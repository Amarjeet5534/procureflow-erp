import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const DEFAULT_MODEL = Deno.env.get("AI_MODEL") || Deno.env.get("GEMINI_MODEL") || Deno.env.get("OPENAI_MODEL") || "gemini-2.5-flash";

function getApiKey() {
  return Deno.env.get("AI_API_KEY") || Deno.env.get("GEMINI_API_KEY") || Deno.env.get("OPENAI_API_KEY");
}

function getChatCompletionsUrl() {
  const configuredBaseUrl = Deno.env.get("AI_BASE_URL") || Deno.env.get("GEMINI_BASE_URL") || Deno.env.get("OPENAI_BASE_URL") || DEFAULT_BASE_URL;
  return `${configuredBaseUrl.replace(/\/$/, "")}/chat/completions`;
}

function getGeminiNativeUrl(model: string, apiKey: string) {
  const encodedModel = encodeURIComponent(model);
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function buildFallbackDescription(productName: string, category: string) {
  const safeName = productName.trim() || "This product";
  const safeCategory = (category || "General").trim() || "General";

  return `${safeName} is a dependable ${safeCategory.toLowerCase()} solution engineered for consistent performance in day-to-day operations. Designed with quality and reliability in mind, it helps teams maintain efficiency while reducing downtime and replacement costs.`;
}

async function parseProviderError(response: Response) {
  const rawBody = await response.text();
  let providerMessage = "";

  try {
    const parsed = JSON.parse(rawBody);
    providerMessage = parsed?.error?.message || parsed?.message || "";
  } catch {
    providerMessage = rawBody;
  }

  return providerMessage.trim().slice(0, 300);
}

function extractMessageContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
          return part.text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, category } = await req.json();
    
    if (!product_name) {
      return new Response(JSON.stringify({ error: "product_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI_API_KEY or GEMINI_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = "You are a professional marketing copywriter for an industrial supply company. Generate exactly 2 sentences: a compelling marketing description for the given product. Be professional, highlight quality and reliability. Do not use bullet points or lists.";
    const userPrompt = `Write a 2-sentence professional marketing description for this product:\nProduct Name: ${product_name}\nCategory: ${category || "General"}`;

    const response = await fetch(getChatCompletionsUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      // Some Gemini keys reject OpenAI-compat auth style. Fall back to native Gemini endpoint.
      if (response.status === 401 || response.status === 403) {
        const geminiNativeResponse = await fetch(getGeminiNativeUrl(DEFAULT_MODEL, apiKey), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
          }),
        });

        if (geminiNativeResponse.ok) {
          const nativeData = await geminiNativeResponse.json();
          const nativeDescription = (nativeData?.candidates?.[0]?.content?.parts || [])
            .map((part: { text?: string }) => part?.text || "")
            .join("")
            .trim();

          if (nativeDescription) {
            return new Response(JSON.stringify({ description: nativeDescription }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          const nativeProviderMessage = await parseProviderError(geminiNativeResponse);
          console.error("Gemini native provider error:", geminiNativeResponse.status, nativeProviderMessage);
        }
      }

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const cleanMessage = await parseProviderError(response);
      const fallbackHint =
        response.status === 403 && !cleanMessage
          ? "Gemini denied the request. Verify Google Cloud account, billing, API key restrictions, and that Generative Language API is enabled for this key's project."
          : undefined;
      console.error("AI provider error:", response.status, cleanMessage);

      const fallbackDescription = buildFallbackDescription(product_name, category || "General");
      if (response.status === 401 || response.status === 403 || response.status >= 500) {
        return new Response(JSON.stringify({
          description: fallbackDescription,
          fallback_used: true,
          fallback_reason: cleanMessage || fallbackHint || "provider_unavailable",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        error: response.status >= 500 ? "AI provider error" : "AI request failed",
        provider_error: cleanMessage || fallbackHint,
        provider_status: response.status,
      }), {
        status: response.status >= 500 ? 500 : response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const description = extractMessageContent(data.choices?.[0]?.message?.content);

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-description error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
