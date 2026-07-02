/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ProductCategory,
  Product,
  Supplier,
  Customer,
  MembershipTier,
  User,
  RolePermission,
  Promotion,
  Coupon,
  StoreSettings
} from '../types';

export const INITIAL_CATEGORIES: ProductCategory[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  { id: 'bronze', name: 'สมาชิกระดับ บรอนซ์', min_points: 0, discount_rate: 0.0, points_multiplier: 1.0 },
  { id: 'silver', name: 'สมาชิกระดับ ซิลเวอร์', min_points: 300, discount_rate: 0.05, points_multiplier: 1.2 },
  { id: 'gold', name: 'สมาชิกระดับ โกลด์', min_points: 1000, discount_rate: 0.08, points_multiplier: 1.5 },
  { id: 'platinum', name: 'สมาชิกระดับ แพลตินัม', min_points: 3000, discount_rate: 0.12, points_multiplier: 2.0 }
];

export const INITIAL_USERS: User[] = [
  { id: 'user-1', username: 'owner_khajondech', fullname: 'คุณขจรเดช มีทอง', role: 'owner', email: 'khajondechmee@gmail.com', phone: '081-111-2222', status: 'active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' }
];

export const INITIAL_ROLES: RolePermission[] = [
  {
    id: 'role-owner',
    role: 'owner',
    name: 'เจ้าของร้าน (Owner)',
    permissions: { dashboard: true, pos: true, products: true, stock: true, customers: true, finance: true, promotions: true, users: true, settings: true }
  },
  {
    id: 'role-manager',
    role: 'manager',
    name: 'ผู้จัดการร้าน (Manager)',
    permissions: { dashboard: true, pos: true, products: true, stock: true, customers: true, finance: true, promotions: true, users: false, settings: true }
  },
  {
    id: 'role-cashier',
    role: 'cashier',
    name: 'แคชเชียร์ (Cashier)',
    permissions: { dashboard: false, pos: true, products: false, stock: false, customers: true, finance: false, promotions: false, users: false, settings: false }
  },
  {
    id: 'role-warehouse',
    role: 'warehouse',
    name: 'พนักงานคลังสินค้า (Warehouse)',
    permissions: { dashboard: false, pos: false, products: true, stock: true, customers: false, finance: false, promotions: false, users: false, settings: false }
  },
  {
    id: 'role-accountant',
    role: 'accountant',
    name: 'ฝ่ายบัญชี (Accountant)',
    permissions: { dashboard: true, pos: false, products: false, stock: false, customers: false, finance: true, promotions: false, users: false, settings: false }
  }
];

export const INITIAL_PROMOTIONS: Promotion[] = [];

export const INITIAL_COUPONS: Coupon[] = [];

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'ระบบจัดการร้านค้าอัจฉริยะ',
  logo: '',
  address: '',
  tax_id: '',
  promptpay_num: '',
  vat_rate: 7,
  printer_ip: '',
  theme: 'wellness_light',
  language: 'th',
  bank_name: '',
  account_no: '',
  account_name: '',
  qr_code_url: ''
};
