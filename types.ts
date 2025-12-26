export interface Product {
  id: string;
  name: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  sku: string;
  category: string;
}

export interface Sale {
  id: string;
  created_at: string;
  customer_name?: string;
  total_amount: number;
  discount_amount: number;
  payment_method: 'CASH' | 'CARD' | 'UPI';
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price_at_sale: number;
}

// Helper type for the Cart
export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_purchases: number;
  visit_count: number;
  created_at: string;
  updated_at: string;
}

export interface Return {
  id: string;
  sale_id: string;
  reason?: string;
  refund_amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface StockPurchase {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  supplier?: string;
  notes?: string;
  created_at: string;
}