import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { calculateOrderTotals } from '@/types/erp';
import type { Tables } from '@/integrations/supabase/types';

type Vendor = Tables<'vendors'>;
type Product = Tables<'products'>;
type PurchaseOrderRow = Tables<'purchase_orders'>;
type PurchaseOrderItemRow = Tables<'purchase_order_items'>;

export interface PurchaseOrder extends PurchaseOrderRow {
  vendor_name?: string;
  items: (PurchaseOrderItemRow & { product_name?: string })[];
}

interface DataContextType {
  vendors: Vendor[];
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  refreshVendors: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshPurchaseOrders: () => Promise<void>;
  addVendor: (v: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateVendor: (id: string, v: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  addProduct: (p: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addPurchaseOrder: (input: { vendor_id: string; items: { product_id: string; quantity: number; unit_price: number }[] }) => Promise<void>;
  updatePOStatus: (id: string, status: string) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
  generateAIDescription: (productName: string, category: string) => Promise<string>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
    return 'Unexpected error';
  };

  const refreshVendors = useCallback(async () => {
    const { data, error } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (data) setVendors(data);
  }, []);

  const refreshProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (data) setProducts(data);
  }, []);

  const refreshPurchaseOrders = useCallback(async () => {
    const { data: pos, error: poError } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
    if (poError) throw poError;
    if (!pos) return;

    const enriched: PurchaseOrder[] = [];
    for (const po of pos) {
      const vendor = vendors.find(v => v.id === po.vendor_id);
      const { data: items, error: itemsError } = await supabase.from('purchase_order_items').select('*').eq('purchase_order_id', po.id);
      if (itemsError) throw itemsError;
      const enrichedItems = (items || []).map(item => {
        const product = products.find(p => p.id === item.product_id);
        return { ...item, product_name: product?.name };
      });
      enriched.push({ ...po, vendor_name: vendor?.name, items: enrichedItems });
    }
    setPurchaseOrders(enriched);
  }, [vendors, products]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([refreshVendors(), refreshProducts()])
        .catch((error) => {
          console.error('Initial data load failed:', getErrorMessage(error));
        })
        .finally(() => setLoading(false));
    } else {
      setVendors([]);
      setProducts([]);
      setPurchaseOrders([]);
      setLoading(false);
    }
  }, [user, refreshVendors, refreshProducts]);

  useEffect(() => {
    if (user && vendors.length >= 0 && products.length >= 0) {
      refreshPurchaseOrders();
    }
  }, [user, vendors, products, refreshPurchaseOrders]);

  const addVendor = useCallback(async (v: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) throw new Error('Please sign in first');
    const { error } = await supabase.from('vendors').insert({ ...v, user_id: user.id });
    if (error) throw error;
    await refreshVendors();
  }, [user, refreshVendors]);

  const updateVendor = useCallback(async (id: string, v: Partial<Vendor>) => {
    const { error } = await supabase.from('vendors').update(v).eq('id', id);
    if (error) throw error;
    await refreshVendors();
  }, [refreshVendors]);

  const deleteVendor = useCallback(async (id: string) => {
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) throw error;
    await refreshVendors();
  }, [refreshVendors]);

  const addProduct = useCallback(async (p: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) throw new Error('Please sign in first');
    const { error } = await supabase.from('products').insert({ ...p, user_id: user.id });
    if (error) throw error;
    await refreshProducts();
  }, [user, refreshProducts]);

  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    const { user_id: _userId, ...rest } = p;
    const { error } = await supabase.from('products').update(rest).eq('id', id);
    if (error) throw error;
    await refreshProducts();
  }, [refreshProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await refreshProducts();
  }, [refreshProducts]);

  const addPurchaseOrder = useCallback(async (input: { vendor_id: string; items: { product_id: string; quantity: number; unit_price: number }[] }) => {
    if (!user) throw new Error('Please sign in first');
    const totals = calculateOrderTotals(input.items);
    
    // Generate reference number
    const { data: refData, error: refError } = await supabase.rpc('generate_po_reference');
    if (refError) throw refError;
    const reference_no = refData || `PO-${Date.now()}`;

    const { data: po, error } = await supabase.from('purchase_orders').insert({
      user_id: user.id,
      vendor_id: input.vendor_id,
      reference_no,
      ...totals,
    }).select().single();

    if (error || !po) {
      throw error || new Error('Purchase order was not created');
    }

    const items = input.items.map(item => ({
      purchase_order_id: po.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase.from('purchase_order_items').insert(items);
    if (itemsError) throw itemsError;
    await refreshPurchaseOrders();
  }, [user, refreshPurchaseOrders]);

  const updatePOStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id);
    if (error) throw error;
    await refreshPurchaseOrders();
  }, [refreshPurchaseOrders]);

  const deletePurchaseOrder = useCallback(async (id: string) => {
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (error) throw error;
    await refreshPurchaseOrders();
  }, [refreshPurchaseOrders]);

  const generateAIDescription = useCallback(async (productName: string, category: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('generate-description', {
      body: { product_name: productName, category },
    });
    if (error) {
      const responseContext = (error as { context?: Response }).context;
      if (responseContext) {
        let parsedMessage: string | null = null;
        try {
          const payload = await responseContext.json();
          parsedMessage = payload?.provider_error || payload?.error || null;
        } catch {
          // Fall back to the original error below when response body is not JSON.
        }

        if (parsedMessage) {
          throw new Error(parsedMessage);
        }
      }
      throw error;
    }
    if (!data || typeof data.description !== 'string' || !data.description.trim()) {
      throw new Error('AI service returned an empty description');
    }
    
    // Log to ai_description_logs
    if (user) {
      const { error: logError } = await supabase.from('ai_description_logs').insert({
        user_id: user.id,
        request_payload: { product_name: productName, category },
        response_payload: { description: data.description },
      });
      if (logError) {
        console.error('Failed to log AI description request:', getErrorMessage(logError));
      }
    }
    
    return data.description;
  }, [user]);

  return (
    <DataContext.Provider value={{
      vendors, products, purchaseOrders, loading,
      refreshVendors, refreshProducts, refreshPurchaseOrders,
      addVendor, updateVendor, deleteVendor,
      addProduct, updateProduct, deleteProduct,
      addPurchaseOrder, updatePOStatus, deletePurchaseOrder,
      generateAIDescription,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
