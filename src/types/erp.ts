export interface Vendor {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  rating: number;
  address: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  stock_level: number;
  description: string;
  ai_description?: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  reference_no: string;
  vendor_id: string;
  vendor_name?: string;
  status: 'draft' | 'pending' | 'approved' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  items: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export type POStatus = PurchaseOrder['status'];

export const TAX_RATE = 0.05;

export function calculateOrderTotals(items: Pick<PurchaseOrderItem, 'quantity' | 'unit_price'>[]) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const tax_amount = subtotal * TAX_RATE;
  const total_amount = subtotal + tax_amount;
  return { subtotal, tax_amount, total_amount };
}
