/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  fullname: string;
  role: string; // 'owner' | 'manager' | 'cashier' | 'warehouse' | 'accountant'
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface RolePermission {
  id: string;
  role: string;
  name: string; // Thai name e.g. "เจ้าของร้าน"
  permissions: {
    dashboard: boolean;
    pos: boolean;
    products: boolean;
    stock: boolean;
    customers: boolean;
    finance: boolean;
    promotions: boolean;
    users: boolean;
    settings: boolean;
  };
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface Product {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  image: string;
  category_id: string;
  cost_price: number;
  selling_price: number;
  member_price: number;
  unit: string; // e.g. "ขวด", "ซอง", "ชิ้น"
  supplier_id: string;
  min_stock: number;
  stock_qty: number;
  status: 'active' | 'inactive';
  description?: string;
  type: 'product' | 'service';
  created_at: string;
}

export interface Customer {
  id: string;
  fullname: string;
  phone: string;
  line_id?: string;
  email?: string;
  birthday?: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
}

export interface MembershipTier {
  id: 'bronze' | 'silver' | 'gold' | 'platinum';
  name: string; // "Bronze", "Silver", "Gold", "Platinum"
  min_points: number;
  discount_rate: number; // e.g. 0 = 0%, 0.05 = 5%
  points_multiplier: number; // e.g. 1, 1.5, 2
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: 'in' | 'out' | 'adjust'; // 'in' (รับสินค้า), 'out' (ขาย/เบิก), 'adjust' (ปรับยอด)
  qty: number;
  balance_qty: number;
  reason: string;
  user_fullname: string;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  product_id: string;
  qty: number;
  cost_price: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplier_id: string;
  items: PurchaseItem[];
  total_amount: number;
  status: 'completed' | 'pending';
  user_fullname: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  product_id: string;
  qty: number;
  price: number;
  discount: number;
  total: number;
  notes?: string;
}

export interface Sale {
  id: string;
  customer_id?: string; // Optional
  items: SaleItem[];
  discount_amount: number;
  vat_amount: number;
  total_amount: number; // Subtotal before discount & vat or final?
  final_amount: number; // Final net amount to pay
  payment_method: 'cash' | 'promptpay' | 'transfer' | 'credit' | 'wallet';
  received_amount: number;
  change_amount: number;
  user_fullname: string;
  created_at: string;
  notes?: string;
  coupon_code?: string;
}

export interface IncomeExpense {
  id: string;
  type: 'income' | 'expense';
  category: string; // e.g., "ค่าน้ำ", "ค่าไฟ", "ค่าเช่า", "เงินเดือน", "รายได้ค่าบริการ", "อื่นๆ"
  amount: number;
  description: string;
  ref_image?: string; // Data URL or placeholder
  user_fullname: string;
  created_at: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'bogo' | 'discount_percent' | 'discount_amount' | 'happy_hour';
  value: number; // percent discount or flat amount
  min_purchase: number;
  active: boolean;
  start_date: string;
  end_date: string;
  description: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_value: number;
  type: 'percent' | 'fixed';
  min_purchase: number;
  active: boolean;
  description: string;
  expiry_date?: string;
}

export interface StoreSettings {
  store_name: string;
  logo: string;
  address: string;
  tax_id: string;
  promptpay_num: string;
  vat_rate: number; // e.g. 7 for 7%
  printer_ip?: string;
  theme: 'wellness_light';
  language: 'th';
  phone?: string;
  receipt_header?: string;
  receipt_footer?: string;
  bank_name?: string;
  account_no?: string;
  account_name?: string;
  qr_code_url?: string;
}

export interface AuditLog {
  id: string;
  user_fullname: string;
  action: string;
  target_table: string;
  details: string;
  created_at: string;
}
