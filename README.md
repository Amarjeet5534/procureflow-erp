# ProcureFlow

ProcureFlow is a Vite + React procurement app for managing vendors, products, purchase orders, and AI-assisted product descriptions on top of Supabase.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase
- Vitest
- Playwright

## Local development

Prerequisites:

- Node.js 20+
- npm 10+

Install dependencies and start the app:

```sh
npm install
npm run dev
```

The default Vite dev server runs on `http://localhost:8082`.

## Environment

Frontend environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Create a local `.env` from `.env.example` before starting the app.

Supabase Auth requirements:

- Enable the Google provider in Supabase Auth.
- Add the local and deployed app origins to the allowed redirect URLs.

Supabase Edge Function environment variables:

- `AI_API_KEY` or `GEMINI_API_KEY`
- `AI_BASE_URL` or `GEMINI_BASE_URL` (optional, defaults to Gemini's OpenAI-compatible endpoint)
- `AI_MODEL` or `GEMINI_MODEL` (optional, defaults to `gemini-2.5-flash`)
- `OPENAI_*` variables are still accepted as a fallback for other OpenAI-compatible providers

Create a local `supabase/functions/.env` from `supabase/functions/.env.example` before serving functions locally.

## Supabase setup

Current project values inferred from this workspace:

- Project ref: `qbxrbiruxpmnlewikgrp`
- Supabase URL: `https://qbxrbiruxpmnlewikgrp.supabase.co`
- Google OAuth callback URI for Google Cloud: `https://qbxrbiruxpmnlewikgrp.supabase.co/auth/v1/callback`

Google Cloud console:

1. Create or update a Web OAuth client.
2. Add authorized JavaScript origins:
	- `http://localhost:8082`
	- `http://127.0.0.1:8082`
	- your production origin
3. Add the authorized redirect URI:
	- `https://qbxrbiruxpmnlewikgrp.supabase.co/auth/v1/callback`
4. Copy the Google client ID and client secret into Supabase Auth > Providers > Google.

Supabase dashboard:

1. Go to Authentication > URL Configuration.
2. Set the Site URL to your primary app origin.
3. Add redirect URLs:
	- `http://localhost:8082`
	- `http://127.0.0.1:8082`
	- your production origin
4. Go to Authentication > Providers > Google and enable the provider.
5. Paste the Google client ID and client secret.

Edge Function secrets:

1. Add `AI_API_KEY` or `GEMINI_API_KEY`.
2. Optionally add `AI_BASE_URL` or `GEMINI_BASE_URL` if you need to override the default Gemini-compatible endpoint.
3. Optionally add `AI_MODEL` or `GEMINI_MODEL` if you do not want the default `gemini-2.5-flash`.
4. Deploy or re-serve the `generate-description` function after code changes.

CLI examples:

```sh
npx supabase secrets set --project-ref qbxrbiruxpmnlewikgrp AI_API_KEY=your_gemini_key_here
npx supabase secrets set --project-ref qbxrbiruxpmnlewikgrp AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
npx supabase secrets set --project-ref qbxrbiruxpmnlewikgrp AI_MODEL=gemini-2.5-flash
npx supabase functions deploy generate-description --project-ref qbxrbiruxpmnlewikgrp --no-verify-jwt
```

Convenience scripts:

```sh
npm run supabase:login
npm run supabase:link
npm run supabase:secrets
npm run supabase:deploy:function
```

Gemini default configuration:

```sh
AI_API_KEY=your_gemini_key_here
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-2.5-flash
```

## Manual verification

1. Start the app with `npm run dev`.
2. Open `/login` and click Sign in with Google.
3. Confirm Google returns you to the app and the dashboard loads.
4. Open Products, create or edit a product, and click Auto-Generate.
5. Confirm an AI description is returned and saved.
6. Confirm a row is written to `ai_description_logs`.

## Quality checks

```sh
npm run lint
npm run build
npm run test
npm run test:e2e
```

`npm run test:e2e` expects Playwright tests in `./e2e`. If you use an already-running environment, set `PLAYWRIGHT_BASE_URL` to skip the local web server startup.

## Deployment

Deploy the frontend with any static hosting provider that supports Vite output, and deploy the Supabase schema and edge functions through Supabase.

Before production rollout, confirm:

- Supabase Google OAuth redirect URLs match the production origin.
- Edge function secrets are set for the chosen AI provider.
- The `generate-description` function is deployed after any backend changes.

## Final handoff

What is already complete in this repo:

- Google sign-in uses Supabase directly.
- Gemini is the default AI provider path for the edge function.
- Legacy generated runtime, tooling, and docs were removed.
- Build, unit tests, and Playwright smoke test pass.

What you still need to do manually:

1. Create `supabase/functions/.env` from `supabase/functions/.env.example` and put in your real Gemini key.
2. Run `npm run supabase:login` and authenticate with your Supabase account.
3. Run `npm run supabase:secrets`.
4. Run `npm run supabase:deploy:function`.
5. In Supabase dashboard, enable Google Auth and add the redirect URLs listed above.
6. In Google Cloud, add the Supabase callback URL and your app origins.
7. Start the app with `npm run dev` and test login plus product description generation.

What I cannot do from this workspace without your credentials:

- Log in to your Supabase account.
- Set hosted project secrets on your behalf.
- Enable the Google provider in your Supabase dashboard.
- Create or edit your Google Cloud OAuth client.
