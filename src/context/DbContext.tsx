/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  StoreSettings,
  StockMovement,
  Purchase,
  Sale,
  IncomeExpense,
  AuditLog
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  MEMBERSHIP_TIERS,
  INITIAL_USERS,
  INITIAL_ROLES,
  INITIAL_PROMOTIONS,
  INITIAL_COUPONS,
  DEFAULT_SETTINGS
} from '../data/initialData';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

// Toast structure
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number; // ms
}

interface DbContextType {
  // Relational Tables
  categories: ProductCategory[];
  suppliers: Supplier[];
  products: Product[];
  customers: Customer[];
  membershipTiers: MembershipTier[];
  users: User[];
  roles: RolePermission[];
  promotions: Promotion[];
  coupons: Coupon[];
  settings: StoreSettings;
  
  // Operational Logs
  stockMovements: StockMovement[];
  purchases: Purchase[];
  sales: Sale[];
  financials: IncomeExpense[];
  auditLogs: AuditLog[];
  
  // Active User / Session Simulation
  currentUser: User;
  setCurrentUser: (user: User) => void;
  
  // Relational Operations
  addCategory: (name: string, description?: string) => void;
  editCategory: (id: string, name: string, description?: string) => void;
  deleteCategory: (id: string) => boolean;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  editSupplier: (id: string, supplier: Omit<Supplier, 'id'>) => void;
  deleteSupplier: (id: string) => boolean;

  addProduct: (product: Omit<Product, 'id' | 'stock_qty'> & { initial_stock: number }) => void;
  editProduct: (id: string, product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: string) => boolean;
  adjustStock: (productId: string, qtyChange: number, reason: string, type: 'in' | 'out' | 'adjust') => void;
  receivePurchase: (supplierId: string, items: { product_id: string; qty: number; cost_price: number }[]) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'points' | 'tier' | 'created_at'>) => void;
  editCustomer: (id: string, customer: Omit<Customer, 'id' | 'points' | 'tier' | 'created_at'>) => void;
  deleteCustomer: (id: string) => boolean;
  addCustomerPoints: (customerId: string, amountSpent: number) => { pointsEarned: number; tierUpgraded: boolean; newTier: string } | null;

  recordSale: (sale: Omit<Sale, 'id' | 'created_at' | 'user_fullname'>) => Sale;
  deleteSale: (id: string) => void;
  editSale: (id: string, updatedSale: Sale) => void;
  
  addFinancialRecord: (record: Omit<IncomeExpense, 'id' | 'user_fullname'> & { created_at?: string }) => void;
  addMultipleFinancialRecords: (records: (Omit<IncomeExpense, 'id' | 'created_at' | 'user_fullname'> & { created_at?: string })[]) => void;
  deleteFinancialRecord: (id: string) => void;
  editFinancialRecord: (id: string, record: Omit<IncomeExpense, 'id' | 'user_fullname'>) => void;

  addPromotion: (promo: Omit<Promotion, 'id'>) => void;
  editPromotion: (id: string, promo: Omit<Promotion, 'id'>) => void;
  togglePromotion: (id: string) => void;
  deletePromotion: (id: string) => void;

  addCoupon: (coupon: Omit<Coupon, 'id' | 'active'>) => void;
  editCoupon: (id: string, coupon: Omit<Coupon, 'id' | 'active'>) => void;
  toggleCoupon: (id: string) => void;
  deleteCoupon: (id: string) => void;

  updateSettings: (settings: StoreSettings) => void;
  updateRolePermissions: (id: string, permissions: RolePermission['permissions']) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  editUser: (id: string, user: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => boolean;

  // Custom Notifications System
  toasts: Toast[];
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  removeToast: (id: string) => void;

  // Database Reset and Import/Export
  resetDatabase: () => Promise<void>;
  forceSync: () => Promise<void>;
  exportDatabase: () => string;
  importDatabase: (jsonStr: string) => boolean;
  dbLoaded: boolean;
  githubConnected: boolean;
  lastSync: string | null;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Database tables states initialized from LocalStorage or seed data
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [membershipTiers] = useState<MembershipTier[]>(MEMBERSHIP_TIERS);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [financials, setFinancials] = useState<IncomeExpense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Simulation states
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const savedId = localStorage.getItem('pos_db_current_user_id');
    const savedUserJson = localStorage.getItem('pos_db_users');
    
    if (savedId && savedUserJson) {
      try {
        const savedUsers = JSON.parse(savedUserJson) as User[];
        const matched = savedUsers.find(u => u.id === savedId);
        if (matched) return matched;
      } catch (e) {
        // ignore parse error
      }
    }
    
    // Fallback to INITIAL_USERS
    if (savedId) {
      const matched = INITIAL_USERS.find(u => u.id === savedId);
      if (matched) return matched;
    }
    return INITIAL_USERS[0];
  });

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem('pos_db_current_user_id', user.id);
  };

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Load database from Firestore
  const loadAllFromFirestore = async () => {
    try {
      setDbLoaded(false);

      // Helper to load or seed an array collection in Firestore
      const loadOrSeedCol = async <T extends { id: string }>(
        collectionName: string,
        initialData: T[],
        setter: (data: T[]) => void
      ): Promise<T[]> => {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        if (snapshot.empty) {
          // Seed Firestore with initial data
          if (initialData.length > 0) {
            const batch = writeBatch(db);
            initialData.forEach((item) => {
              const docRef = doc(db, collectionName, item.id);
              batch.set(docRef, item);
            });
            await batch.commit();
          }
          setter(initialData);
          localStorage.setItem(`pos_db_${collectionName}`, JSON.stringify(initialData));
          return initialData;
        } else {
          const data: T[] = [];
          snapshot.forEach((docSnap) => {
            data.push(docSnap.data() as T);
          });
          setter(data);
          localStorage.setItem(`pos_db_${collectionName}`, JSON.stringify(data));
          return data;
        }
      };

      // Load array collections
      await loadOrSeedCol('categories', INITIAL_CATEGORIES, setCategories);
      await loadOrSeedCol('suppliers', INITIAL_SUPPLIERS, setSuppliers);
      await loadOrSeedCol('products', INITIAL_PRODUCTS, setProducts);
      await loadOrSeedCol('customers', INITIAL_CUSTOMERS, setCustomers);
      const loadedUsers = await loadOrSeedCol('users', INITIAL_USERS, setUsers);
      
      // Identity Correction: If the primary owner is still the mockup name, update it to the user's real name
      if (loadedUsers && loadedUsers.length > 0) {
        const owner = loadedUsers.find(u => u.id === 'user-1' && (u.fullname === 'คุณอรอุมา เลิศสุวรรณ' || u.fullname === 'Owner User'));
        if (owner) {
          const updatedOwner = { ...owner, fullname: 'คุณขจรเดช มีทอง', username: 'owner_khajondech', email: 'khajondechmee@gmail.com' };
          setUsers(prev => prev.map(u => u.id === 'user-1' ? updatedOwner : u));
          saveDocToFirestore('users', 'user-1', updatedOwner);
        }
      }
      await loadOrSeedCol('roles', INITIAL_ROLES, setRoles);
      await loadOrSeedCol('promotions', INITIAL_PROMOTIONS, setPromotions);
      await loadOrSeedCol('coupons', INITIAL_COUPONS, setCoupons);

      // Sync currentUser with loaded users so any Firestore updates to the current user (e.g. name, avatar) are correctly picked up
      if (loadedUsers && loadedUsers.length > 0) {
        const savedCurrentUserId = localStorage.getItem('pos_db_current_user_id');
        const targetId = savedCurrentUserId || INITIAL_USERS[0].id;
        const matchedUser = loadedUsers.find(u => u.id === targetId);
        if (matchedUser) {
          setCurrentUserState(matchedUser);
        } else {
          const ownerUser = loadedUsers.find(u => u.role === 'owner');
          if (ownerUser) setCurrentUserState(ownerUser);
        }
      }

      // Load settings (single document)
      const settingsRef = doc(db, 'settings', 'store_config');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data() as StoreSettings;
        setSettings(data);
        localStorage.setItem('pos_db_settings', JSON.stringify(data));
      } else {
        await setDoc(settingsRef, DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem('pos_db_settings', JSON.stringify(DEFAULT_SETTINGS));
      }

      // Load transaction/log collections (no seed needed except audit_logs)
      await loadOrSeedCol('stock_movements', [], setStockMovements);
      await loadOrSeedCol('purchases', [], setPurchases);
      await loadOrSeedCol('sales', [], setSales);
      await loadOrSeedCol('financials', [], setFinancials);
      
      const initAuditLog = [
        {
          id: 'log-init',
          user_fullname: 'ระบบอัตโนมัติ',
          action: 'เริ่มต้นระบบ',
          target_table: 'settings',
          details: 'ระบบฐานข้อมูล POS เริ่มต้นทำงานในสไตล์ Relax Wellness สำเร็จ (เชื่อมต่อ Firebase)',
          created_at: new Date().toISOString()
        }
      ];
      await loadOrSeedCol('audit_logs', initAuditLog, setAuditLogs);

      setDbLoaded(true);
    } catch (err) {
      console.error("Error loading database from Firestore, falling back to LocalStorage:", err);
      
      // Fallback to local storage loading
      const loadFromLocalStorage = (key: string, initial: any, setter: any) => {
        const stored = localStorage.getItem(`pos_db_${key}`);
        if (stored) {
          try {
            setter(JSON.parse(stored));
          } catch (e) {
            setter(initial);
          }
        } else {
          setter(initial);
        }
      };

      loadFromLocalStorage('categories', INITIAL_CATEGORIES, setCategories);
      loadFromLocalStorage('suppliers', INITIAL_SUPPLIERS, setSuppliers);
      loadFromLocalStorage('products', INITIAL_PRODUCTS, setProducts);
      loadFromLocalStorage('customers', INITIAL_CUSTOMERS, setCustomers);
      loadFromLocalStorage('users', INITIAL_USERS, (loaded: User[]) => {
        setUsers(loaded);
        if (loaded && loaded.length > 0) {
          const savedCurrentUserId = localStorage.getItem('pos_db_current_user_id');
          const targetId = savedCurrentUserId || INITIAL_USERS[0].id;
          const matchedUser = loaded.find(u => u.id === targetId);
          if (matchedUser) {
            setCurrentUserState(matchedUser);
          } else {
            const ownerUser = loaded.find(u => u.role === 'owner');
            if (ownerUser) setCurrentUserState(ownerUser);
          }
        }
      });
      loadFromLocalStorage('roles', INITIAL_ROLES, setRoles);
      loadFromLocalStorage('promotions', INITIAL_PROMOTIONS, setPromotions);
      loadFromLocalStorage('coupons', INITIAL_COUPONS, setCoupons);
      loadFromLocalStorage('settings', DEFAULT_SETTINGS, setSettings);
      loadFromLocalStorage('stock_movements', [], setStockMovements);
      loadFromLocalStorage('purchases', [], setPurchases);
      loadFromLocalStorage('sales', [], setSales);
      loadFromLocalStorage('financials', [], setFinancials);
      loadFromLocalStorage('audit_logs', [], setAuditLogs);

      setDbLoaded(true);
    }
  };

  useEffect(() => {
    loadAllFromFirestore();
  }, []);

  // Save changes helper to LocalStorage
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(`pos_db_${key}`, JSON.stringify(data));
  };

  // Helper to save document to Firestore in the background
  const saveDocToFirestore = async (collectionName: string, id: string, data: any) => {
    try {
      await setDoc(doc(db, collectionName, id), data);
    } catch (e) {
      console.error(`Error saving doc to Firestore (${collectionName}/${id}):`, e);
    }
  };

  // Helper to delete document from Firestore in the background
  const deleteDocFromFirestore = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (e) {
      console.error(`Error deleting doc from Firestore (${collectionName}/${id}):`, e);
    }
  };

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to log administrative audits
  const logAudit = (action: string, targetTable: string, targetId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      user_fullname: currentUser.fullname,
      action,
      target_table: targetTable,
      details,
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 500); // keep max 500 logs
      saveToStorage('audit_logs', updated);
      return updated;
    });
  };

  // CATEGORIES OPERATIONS
  const addCategory = (name: string, description?: string) => {
    const newCat: ProductCategory = {
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description
    };
    
    setCategories(prev => {
      const updated = [...prev, newCat];
      saveToStorage('categories', updated);
      return updated;
    });
    
    saveDocToFirestore('categories', newCat.id, newCat);
    logAudit('เพิ่มหมวดหมู่สินค้า', 'product_categories', newCat.id, `เพิ่มหมวดหมู่ใหม่: "${name}"`);
    showToast(`เพิ่มหมวดหมู่สินค้า "${name}" สำเร็จ`, 'success');
  };

  const editCategory = (id: string, name: string, description?: string) => {
    let updatedItem: ProductCategory | undefined;
    
    setCategories(prev => {
      const updated = prev.map(cat => {
        if (cat.id === id) {
          updatedItem = { ...cat, name, description };
          return updatedItem;
        }
        return cat;
      });
      saveToStorage('categories', updated);
      return updated;
    });

    // Use a small timeout to ensure updatedItem is set if it was found
    setTimeout(() => {
      if (updatedItem) saveDocToFirestore('categories', id, updatedItem);
    }, 0);
    
    logAudit('แก้ไขหมวดหมู่สินค้า', 'product_categories', id, `แก้ไขข้อมูลหมวดหมู่: "${name}"`);
    showToast('แก้ไขข้อมูลหมวดหมู่สินค้าสำเร็จ', 'success');
  };

  const deleteCategory = (id: string): boolean => {
    // Check if any product belongs to this category
    const hasProducts = products.some(p => p.category_id === id);
    if (hasProducts) {
      showToast('ไม่สามารถลบได้ เนื่องจากมีสินค้าใช้งานหมวดหมู่นี้อยู่', 'error');
      return false;
    }
    
    const cat = categories.find(c => c.id === id);
    setCategories(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToStorage('categories', updated);
      return updated;
    });
    
    deleteDocFromFirestore('categories', id);
    logAudit('ลบหมวดหมู่สินค้า', 'product_categories', id, `ลบหมวดหมู่: "${cat?.name}"`);
    showToast('ลบหมวดหมู่สินค้าสำเร็จ', 'success');
    return true;
  };

  // SUPPLIERS OPERATIONS
  const addSupplier = (supData: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = {
      id: `sup-${Math.random().toString(36).substr(2, 9)}`,
      ...supData
    };
    const updated = [...suppliers, newSup];
    setSuppliers(updated);
    saveToStorage('suppliers', updated);
    saveDocToFirestore('suppliers', newSup.id, newSup);
    logAudit('เพิ่มผู้ผลิต/คู่ค้า', 'suppliers', newSup.id, `เพิ่มคู่ค้าใหม่: "${newSup.company_name}"`);
    showToast(`เพิ่มคู่ค้า "${newSup.company_name}" สำเร็จ`, 'success');
  };

  const editSupplier = (id: string, supData: Omit<Supplier, 'id'>) => {
    const updated = suppliers.map(s => s.id === id ? { ...s, ...supData } : s);
    setSuppliers(updated);
    saveToStorage('suppliers', updated);
    const updatedItem = updated.find(s => s.id === id);
    if (updatedItem) saveDocToFirestore('suppliers', id, updatedItem);
    logAudit('แก้ไขผู้ผลิต/คู่ค้า', 'suppliers', id, `แก้ไขข้อมูลคู่ค้า: "${supData.company_name}"`);
    showToast('แก้ไขข้อมูลผู้จำหน่ายสำเร็จ', 'success');
  };

  const deleteSupplier = (id: string): boolean => {
    // Check if any product belongs to this supplier
    const hasProducts = products.some(p => p.supplier_id === id);
    if (hasProducts) {
      showToast('ไม่สามารถลบได้ เนื่องจากมีสินค้าเชื่อมโยงกับผู้จัดจำหน่ายรายนี้', 'error');
      return false;
    }
    const sup = suppliers.find(s => s.id === id);
    const updated = suppliers.filter(s => s.id !== id);
    setSuppliers(updated);
    saveToStorage('suppliers', updated);
    deleteDocFromFirestore('suppliers', id);
    logAudit('ลบผู้ผลิต/คู่ค้า', 'suppliers', id, `ลบคู่ค้า: "${sup?.company_name}"`);
    showToast('ลบข้อมูลผู้จัดจำหน่ายสำเร็จ', 'success');
    return true;
  };

  // PRODUCTS & STOCK OPERATIONS
  const addProduct = (prodData: Omit<Product, 'id' | 'stock_qty'> & { initial_stock: number }) => {
    const { initial_stock, ...rest } = prodData;
    const newProd: Product = {
      id: `prod-${Math.random().toString(36).substr(2, 9)}`,
      ...rest,
      stock_qty: initial_stock,
      created_at: new Date().toISOString(),
      status: 'active'
    };
    
    setProducts(prev => {
      const updated = [newProd, ...prev];
      saveToStorage('products', updated);
      return updated;
    });
    saveDocToFirestore('products', newProd.id, newProd);
    
    // Create stock movement for initial stock (ONLY for physical products)
    if (initial_stock > 0 && newProd.type === 'product') {
      const newMovement: StockMovement = {
        id: `move-${Math.random().toString(36).substr(2, 9)}`,
        product_id: newProd.id,
        type: 'in',
        qty: initial_stock,
        balance_qty: initial_stock,
        reason: 'สต็อกเริ่มต้นขณะเพิ่มสินค้า',
        user_fullname: currentUser.fullname,
        created_at: new Date().toISOString()
      };
      
      setStockMovements(prev => {
        const updated = [newMovement, ...prev];
        saveToStorage('stock_movements', updated);
        return updated;
      });
      saveDocToFirestore('stock_movements', newMovement.id, newMovement);
    }

    logAudit('เพิ่มสินค้าใหม่', 'products', newProd.id, `เพิ่ม ${newProd.type === 'service' ? 'บริการ' : 'สินค้า'}: "${newProd.name}" รหัสบาร์โค้ด: ${newProd.barcode} ${newProd.type === 'product' ? `สต็อกเริ่มต้น: ${initial_stock}` : ''}`);
    showToast(`เพิ่ม${newProd.type === 'service' ? 'บริการ' : 'สินค้า'} "${newProd.name}" สำเร็จ`, 'success');
  };

  const editProduct = (id: string, prodData: Omit<Product, 'id'>) => {
    let updatedItem: Product | undefined;

    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          // If stock_qty has changed, log a movement (ONLY for physical products)
          if (p.type === 'product' && prodData.stock_qty !== undefined && prodData.stock_qty !== p.stock_qty) {
            const newMovement: StockMovement = {
              id: `move-${Math.random().toString(36).substr(2, 9)}`,
              product_id: id,
              type: 'adjust',
              qty: Math.abs(prodData.stock_qty - p.stock_qty),
              balance_qty: prodData.stock_qty,
              reason: 'แก้ไขจำนวนสต๊อกโดยตรงจากหน้าข้อมูลสินค้า',
              user_fullname: currentUser.fullname,
              created_at: new Date().toISOString()
            };
            
            setStockMovements(mPrev => {
              const mUpdated = [newMovement, ...mPrev];
              saveToStorage('stock_movements', mUpdated);
              return mUpdated;
            });
            saveDocToFirestore('stock_movements', newMovement.id, newMovement);
          }
          updatedItem = { ...p, ...prodData };
          return updatedItem;
        }
        return p;
      });
      saveToStorage('products', updated);
      return updated;
    });

    setTimeout(() => {
      if (updatedItem) saveDocToFirestore('products', id, updatedItem);
    }, 0);

    logAudit('แก้ไขข้อมูลสินค้า', 'products', id, `แก้ไขข้อมูล: "${prodData.name}" (ประเภท: ${prodData.type === 'service' ? 'บริการ' : 'สินค้า'})`);
    showToast(`อัปเดตข้อมูล "${prodData.name}" เรียบร้อย`, 'success');
  };

  const deleteProduct = (id: string): boolean => {
    // Check if product was sold in any sale
    const hasSales = sales.some(s => s.items.some(i => i.product_id === id));
    
    if (hasSales) {
      // Instead of deleting, we can deactivate it
      let updatedItem: Product | undefined;
      setProducts(prev => {
        const updated = prev.map(p => {
          if (p.id === id) {
            updatedItem = { ...p, status: 'inactive' as const };
            return updatedItem;
          }
          return p;
        });
        saveToStorage('products', updated);
        return updated;
      });
      
      setTimeout(() => {
        if (updatedItem) saveDocToFirestore('products', id, updatedItem);
      }, 0);
      
      logAudit('ปิดใช้งานสินค้า', 'products', id, `ปิดใช้งานสินค้าชั่วคราวเนื่องจากมีประวัติการขาย: "${products.find(p => p.id === id)?.name}"`);
      showToast('เปลี่ยนสถานะเป็น "ปิดใช้งาน" เนื่องจากมีข้อมูลในประวัติการชำระเงิน', 'warning');
      return true;
    }

    const prod = products.find(p => p.id === id);
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveToStorage('products', updated);
      return updated;
    });
    
    deleteDocFromFirestore('products', id);
    logAudit('ลบสินค้า', 'products', id, `ลบสินค้าถาวร: "${prod?.name}"`);
    showToast('ลบข้อมูลสินค้าสำเร็จ', 'success');
    return true;
  };

  const adjustStock = (productId: string, qtyChange: number, reason: string, type: 'in' | 'out' | 'adjust') => {
    let finalQtyChange = qtyChange;
    if (type === 'out') {
      finalQtyChange = -Math.abs(qtyChange);
    } else if (type === 'in') {
      finalQtyChange = Math.abs(qtyChange);
    }
    
    let targetProductName = '';
    let updatedProd: Product | undefined;

    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === productId) {
          targetProductName = p.name;
          let newQty = p.stock_qty + finalQtyChange;
          if (type === 'adjust') {
            newQty = qtyChange; // For adjustment, qtyChange represents the NEW direct value
            finalQtyChange = qtyChange - p.stock_qty;
          }
          if (newQty < 0) newQty = 0;
          updatedProd = { ...p, stock_qty: newQty };
          return updatedProd;
        }
        return p;
      });
      saveToStorage('products', updated);
      return updated;
    });

    setTimeout(() => {
      if (updatedProd) {
        saveDocToFirestore('products', productId, updatedProd);
        
        const newMovement: StockMovement = {
          id: `move-${Math.random().toString(36).substr(2, 9)}`,
          product_id: productId,
          type,
          qty: Math.abs(finalQtyChange),
          balance_qty: updatedProd.stock_qty,
          reason,
          user_fullname: currentUser.fullname,
          created_at: new Date().toISOString()
        };

        setStockMovements(prev => {
          const updated = [newMovement, ...prev];
          saveToStorage('stock_movements', updated);
          return updated;
        });
        saveDocToFirestore('stock_movements', newMovement.id, newMovement);

        logAudit('ปรับปรุงสต็อก', 'products', productId, `ปรับปรุงจำนวนสินค้า: "${targetProductName}" เปลี่ยนแปลง: ${finalQtyChange} ชิ้น ยอดสต็อกล่าสุด: ${updatedProd.stock_qty} ชิ้น`);
        showToast(`ปรับปรุงสต็อกสินค้า "${targetProductName}" สำเร็จ`, 'success');
      }
    }, 0);
  };

  const receivePurchase = (supplierId: string, items: { product_id: string; qty: number; cost_price: number }[]) => {
    const totalAmount = items.reduce((sum, item) => sum + (item.qty * item.cost_price), 0);
    const newPurchase: Purchase = {
      id: `PUR-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplier_id: supplierId,
      items: items.map(i => ({ id: `pitem-${Math.random().toString(36).substr(2, 9)}`, ...i, total: i.qty * i.cost_price })),
      total_amount: totalAmount,
      status: 'completed',
      user_fullname: currentUser.fullname,
      created_at: new Date().toISOString()
    };

    // Update product stock and cost prices
    const updatedProducts = products.map(p => {
      const match = items.find(i => i.product_id === p.id);
      if (match) {
        return {
          ...p,
          stock_qty: p.stock_qty + match.qty,
          cost_price: match.cost_price // Update cost price to the latest received cost
        };
      }
      return p;
    });

    // Create stock movements
    const newMovements: StockMovement[] = items.map(i => {
      const currentBalance = updatedProducts.find(p => p.id === i.product_id)?.stock_qty || 0;
      return {
        id: `move-${Math.random().toString(36).substr(2, 9)}`,
        product_id: i.product_id,
        type: 'in',
        qty: i.qty,
        balance_qty: currentBalance,
        reason: `รับสินค้าตามใบนำส่งเลขที่ ${newPurchase.id}`,
        user_fullname: currentUser.fullname,
        created_at: new Date().toISOString()
      };
    });

    setProducts(updatedProducts);
    saveToStorage('products', updatedProducts);
    // Sync all updated products to Firestore
    items.forEach(item => {
      const prod = updatedProducts.find(p => p.id === item.product_id);
      if (prod) saveDocToFirestore('products', prod.id, prod);
    });

    setPurchases(prev => [newPurchase, ...prev]);
    saveToStorage('purchases', [newPurchase, ...purchases]);
    saveDocToFirestore('purchases', newPurchase.id, newPurchase);

    setStockMovements(prev => [...newMovements, ...prev]);
    saveToStorage('stock_movements', [...newMovements, ...stockMovements]);
    newMovements.forEach(movement => {
      saveDocToFirestore('stock_movements', movement.id, movement);
    });

    // Record as expense (ต้นทุนซื้อสินค้า)
    const newExpense: IncomeExpense = {
      id: `exp-${Math.random().toString(36).substr(2, 9)}`,
      type: 'expense',
      category: 'ซื้อสินค้า',
      amount: totalAmount,
      description: `ชำระค่าสินค้าเข้าสต็อกตามใบนำสั่งซื้อ ${newPurchase.id}`,
      user_fullname: currentUser.fullname,
      created_at: new Date().toISOString()
    };
    setFinancials(prev => [newExpense, ...prev]);
    saveToStorage('financials', [newExpense, ...financials]);
    saveDocToFirestore('financials', newExpense.id, newExpense);

    const supplierName = suppliers.find(s => s.id === supplierId)?.company_name || 'ไม่ระบุ';
    logAudit('รับสินค้าเข้าคลัง', 'purchases', newPurchase.id, `รับสินค้าเข้าจาก: "${supplierName}" ยอดรวมมูลค่า: ${totalAmount.toLocaleString()} บาท จำนวนรายการ: ${items.length} รายการ`);
    showToast(`รับสินค้าเข้าสต็อกและชำระเงินเรียบร้อยแล้ว`, 'success');
  };

  // CUSTOMER & POINTS OPERATIONS
  const addCustomer = (custData: Omit<Customer, 'id' | 'points' | 'tier' | 'created_at'>) => {
    const newCust: Customer = {
      id: `cust-${Math.random().toString(36).substr(2, 9)}`,
      ...custData,
      points: 0,
      tier: 'bronze',
      created_at: new Date().toISOString()
    };
    
    setCustomers(prev => {
      const updated = [...prev, newCust];
      saveToStorage('customers', updated);
      return updated;
    });
    saveDocToFirestore('customers', newCust.id, newCust);
    logAudit('เพิ่มลูกค้าใหม่', 'customers', newCust.id, `เพิ่มข้อมูลลูกค้าใหม่: "${newCust.fullname}" ระดับ: บรอนซ์`);
    showToast(`เพิ่มลูกค้า "${newCust.fullname}" สำเร็จ`, 'success');
  };

  const editCustomer = (id: string, custData: Omit<Customer, 'id' | 'points' | 'tier' | 'created_at'>) => {
    let updatedItem: Customer | undefined;
    setCustomers(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          updatedItem = { ...c, ...custData };
          return updatedItem;
        }
        return c;
      });
      saveToStorage('customers', updated);
      return updated;
    });

    setTimeout(() => {
      if (updatedItem) saveDocToFirestore('customers', id, updatedItem);
    }, 0);

    logAudit('แก้ไขข้อมูลลูกค้า', 'customers', id, `แก้ไขข้อมูลลูกค้า: "${custData.fullname}"`);
    showToast('แก้ไขข้อมูลลูกค้าสำเร็จ', 'success');
  };

  const deleteCustomer = (id: string): boolean => {
    // Check if customer has any sale record
    const hasSales = sales.some(s => s.customer_id === id);
    if (hasSales) {
      showToast('ไม่สามารถลบข้อมูลสมาชิกได้ เนื่องจากมีประวัติการซื้อในระบบ', 'error');
      return false;
    }
    const cust = customers.find(c => c.id === id);
    setCustomers(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToStorage('customers', updated);
      return updated;
    });
    deleteDocFromFirestore('customers', id);
    logAudit('ลบลูกค้าสมาชิก', 'customers', id, `ลบสมาชิก: "${cust?.fullname}"`);
    showToast('ลบข้อมูลลูกค้าสำเร็จ', 'success');
    return true;
  };

  const addCustomerPoints = (customerId: string, amountSpent: number) => {
    let result: { pointsEarned: number; tierUpgraded: boolean; newTier: string } | null = null;
    let customerName = '';

    setCustomers(prev => {
      const customer = prev.find(c => c.id === customerId);
      if (!customer) return prev;

      customerName = customer.fullname;
      // Rules: 25 THB spent = 1 base point
      const basePoints = Math.floor(amountSpent / 25);
      
      // Get tier details for multiplier
      const tierRule = membershipTiers.find(t => t.id === customer.tier) || membershipTiers[0];
      const pointsEarned = Math.round(basePoints * tierRule.points_multiplier);

      const newPoints = customer.points + pointsEarned;
      
      // Determine new tier based on points
      let finalTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
      if (newPoints >= 3000) {
        finalTier = 'platinum';
      } else if (newPoints >= 1000) {
        finalTier = 'gold';
      } else if (newPoints >= 300) {
        finalTier = 'silver';
      }

      const tierUpgraded = finalTier !== customer.tier;
      result = { pointsEarned, tierUpgraded, newTier: finalTier };

      const updated = prev.map(c => {
        if (c.id === customerId) {
          return {
            ...c,
            points: newPoints,
            tier: finalTier
          };
        }
        return c;
      });

      saveToStorage('customers', updated);
      const updatedCust = updated.find(c => c.id === customerId);
      if (updatedCust) saveDocToFirestore('customers', customerId, updatedCust);
      
      return updated;
    });

    // Logging/Auditing
    setTimeout(() => {
      if (result) {
        const { pointsEarned, tierUpgraded, newTier } = result as { pointsEarned: number; tierUpgraded: boolean; newTier: string };
        if (pointsEarned > 0) {
          logAudit('เพิ่มแต้มสะสม', 'customers', customerId, `เพิ่มคะแนนลูกค้า: "${customerName}" +${pointsEarned} คะแนน`);
        }

        if (tierUpgraded) {
          const tierNameMap = { bronze: 'บรอนซ์', silver: 'ซิลเวอร์', gold: 'โกลด์', platinum: 'แพลตินัม' };
          logAudit('ปรับระดับสมาชิก', 'customers', customerId, `ยกระดับระดับสมาชิกของลูกค้า "${customerName}" ขึ้นเป็นระดับ ${tierNameMap[newTier as keyof typeof tierNameMap]}`);
          showToast(`🎉 สมาชิก ${customerName} เลื่อนระดับขึ้นเป็น "${tierNameMap[newTier as keyof typeof tierNameMap]}"!`, 'success', 5000);
        }
      }
    }, 0);

    return result;
  };

  // SALES POS CHECKOUT ENGINE
  const recordSale = (saleData: Omit<Sale, 'id' | 'created_at' | 'user_fullname'>) => {
    const saleId = `SALE-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: Sale = {
      id: saleId,
      ...saleData,
      user_fullname: currentUser.fullname,
      created_at: new Date().toISOString()
    };

    // Update product stocks
    setProducts(prev => {
      const updated = prev.map(p => {
        const item = saleData.items.find(i => i.product_id === p.id);
        if (item) {
          const newQty = Math.max(0, p.stock_qty - item.qty);
          const updatedProd = { ...p, stock_qty: newQty };
          saveDocToFirestore('products', p.id, updatedProd);
          
          // Notify if below min stock
          if (p.type === 'product' && newQty <= p.min_stock) {
            setTimeout(() => {
               showToast(`⚠️ สินค้า "${p.name}" เหลือ ${newQty} ชิ้น (ต่ำกว่าสต็อกขั้นต่ำ!)`, 'warning', 6000);
            }, 1000);
          }
          
          return updatedProd;
        }
        return p;
      });
      saveToStorage('products', updated);
      
      // Create stock movements for items sold
      const newMovements: StockMovement[] = saleData.items.map(item => {
        const pState = updated.find(p => p.id === item.product_id);
        return {
          id: `move-${Math.random().toString(36).substr(2, 9)}`,
          product_id: item.product_id,
          type: 'out',
          qty: item.qty,
          balance_qty: pState?.stock_qty || 0,
          reason: `ขายผ่านเครื่อง POS ใบเสร็จ ${saleId}`,
          user_fullname: currentUser.fullname,
          created_at: new Date().toISOString()
        };
      });
      
      setStockMovements(mPrev => {
        const mUpdated = [...newMovements, ...mPrev];
        saveToStorage('stock_movements', mUpdated);
        newMovements.forEach(m => saveDocToFirestore('stock_movements', m.id, m));
        return mUpdated;
      });

      return updated;
    });

    setSales(prev => {
      const updated = [newSale, ...prev];
      saveToStorage('sales', updated);
      return updated;
    });
    saveDocToFirestore('sales', newSale.id, newSale);

    // Add financial income (รายรับจากการขาย)
    const newIncome: IncomeExpense = {
      id: `inc-${Math.random().toString(36).substr(2, 9)}`,
      type: 'income',
      category: 'รายรับจากการขาย',
      amount: saleData.final_amount,
      description: `รายรับจดทะเบียนการขาย POS ใบเสร็จ ${saleId}`,
      user_fullname: currentUser.fullname,
      created_at: new Date().toISOString()
    };
    setFinancials(prev => {
      const updated = [newIncome, ...prev];
      saveToStorage('financials', updated);
      return updated;
    });
    saveDocToFirestore('financials', newIncome.id, newIncome);

    // Handle customer points
    if (saleData.customer_id) {
      addCustomerPoints(saleData.customer_id, saleData.final_amount);
    }

    logAudit('บันทึกยอดขาย', 'sales', saleId, `บันทึกการขายบิลใหม่: ${saleId} ยอดชำระสุทธิ: ${saleData.final_amount.toLocaleString()} บาท ชำระโดย: ${saleData.payment_method}`);
    showToast(`💰 ชำระเงินสุทธิ ${saleData.final_amount.toLocaleString()} บาท สำเร็จ!`, 'success');

    return newSale;
  };
 
  const deleteSale = (id: string) => {
    setSales(prevSales => {
      const sale = prevSales.find(s => s.id === id);
      if (!sale) return prevSales;

      // 1. Revert product stocks (add back what was sold)
      setProducts(prevProducts => {
        const updatedProducts = prevProducts.map(p => {
          const item = sale.items.find(i => i.product_id === p.id);
          if (item) {
            const updatedProd = { ...p, stock_qty: p.stock_qty + item.qty };
            saveDocToFirestore('products', p.id, updatedProd);
            return updatedProd;
          }
          return p;
        });
        saveToStorage('products', updatedProducts);

        // 2. Create stock movements for inventory reversion
        const newMovements: StockMovement[] = sale.items.map(item => {
          const balance = updatedProducts.find(p => p.id === item.product_id)?.stock_qty || 0;
          return {
            id: `move-${Math.random().toString(36).substr(2, 9)}`,
            product_id: item.product_id,
            type: 'in',
            qty: item.qty,
            balance_qty: balance,
            reason: `รับคืนสินค้าจากการยกเลิกบิล ${sale.id}`,
            user_fullname: currentUser.fullname,
            created_at: new Date().toISOString()
          };
        });
        
        setStockMovements(prevMovements => {
          const mUpdated = [...newMovements, ...prevMovements];
          saveToStorage('stock_movements', mUpdated);
          newMovements.forEach(m => saveDocToFirestore('stock_movements', m.id, m));
          return mUpdated;
        });

        return updatedProducts;
      });

      // 3. Revert financial income record
      setFinancials(prevFin => {
        const updated = prevFin.filter(f => !f.description.includes(sale.id));
        saveToStorage('financials', updated);
        const removed = prevFin.filter(f => f.description.includes(sale.id));
        removed.forEach(f => deleteDocFromFirestore('financials', f.id));
        return updated;
      });

      // 4. Revert customer points
      if (sale.customer_id) {
        setCustomers(prevCust => {
          const customer = prevCust.find(c => c.id === sale.customer_id);
          if (customer) {
            const basePoints = Math.floor(sale.final_amount / 25);
            const tierRule = membershipTiers.find(t => t.id === customer.tier) || membershipTiers[0];
            const pointsEarned = Math.round(basePoints * tierRule.points_multiplier);
            const newPoints = Math.max(0, customer.points - pointsEarned);

            let finalTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
            if (newPoints >= 3000) finalTier = 'platinum';
            else if (newPoints >= 1000) finalTier = 'gold';
            else if (newPoints >= 300) finalTier = 'silver';

            const updatedCustomers = prevCust.map(c => 
              c.id === sale.customer_id 
                ? { ...c, points: newPoints, tier: finalTier } 
                : c
            );
            saveToStorage('customers', updatedCustomers);
            const updatedCust = { ...customer, points: newPoints, tier: finalTier };
            saveDocToFirestore('customers', customer.id, updatedCust);
            return updatedCustomers;
          }
          return prevCust;
        });
      }

      // 5. Delete sale record
      const updatedSales = prevSales.filter(s => s.id !== id);
      saveToStorage('sales', updatedSales);
      deleteDocFromFirestore('sales', id);
      
      logAudit('ลบบิลการขาย', 'sales', id, `ยกเลิกบิลการขายเลขที่: ${id} ยอดเงินคืน: ${sale.final_amount.toLocaleString()} บาท`);
      showToast(`🗑 ยกเลิกและลบบิล "${id}" เรียบร้อย คืนสินค้าเข้าคลังแล้ว`, 'success');
      
      return updatedSales;
    });
  };
 
  const editSale = (id: string, updatedSale: Sale) => {
    const oldSale = sales.find(s => s.id === id);
    if (!oldSale) return;
 
    // 1. Revert old stock, apply new stock
    const stockOffsets: { [key: string]: number } = {};
    oldSale.items.forEach(item => {
      stockOffsets[item.product_id] = (stockOffsets[item.product_id] || 0) + item.qty;
    });
    updatedSale.items.forEach(item => {
      stockOffsets[item.product_id] = (stockOffsets[item.product_id] || 0) - item.qty;
    });
 
    const updatedProducts = products.map(p => {
      const offset = stockOffsets[p.id];
      if (offset) {
        return { ...p, stock_qty: Math.max(0, p.stock_qty + offset) };
      }
      return p;
    });
 
    // Create stock movements for any changes in product quantities
    const newMovements: StockMovement[] = [];
    Object.entries(stockOffsets).forEach(([pId, offset]) => {
      if (offset !== 0) {
        const balance = updatedProducts.find(p => p.id === pId)?.stock_qty || 0;
        newMovements.push({
          id: `move-${Math.random().toString(36).substr(2, 9)}`,
          product_id: pId,
          type: offset > 0 ? 'in' : 'out',
          qty: Math.abs(offset),
          balance_qty: balance,
          reason: `ปรับปรุงสินค้าจากการแก้ไขบิล ${id}`,
          user_fullname: currentUser.fullname,
          created_at: new Date().toISOString()
        });
      }
    });
 
    setProducts(updatedProducts);
    saveToStorage('products', updatedProducts);
    Object.keys(stockOffsets).forEach(pId => {
      const prod = updatedProducts.find(p => p.id === pId);
      if (prod) saveDocToFirestore('products', pId, prod);
    });
 
    if (newMovements.length > 0) {
      setStockMovements(prev => [...newMovements, ...prev]);
      saveToStorage('stock_movements', [...newMovements, ...stockMovements]);
      newMovements.forEach(movement => {
        saveDocToFirestore('stock_movements', movement.id, movement);
      });
    }
 
    // 2. Update financials transaction
    const updatedFinancials = financials.map(f => {
      if (f.description.includes(id) && f.type === 'income') {
        return {
          ...f,
          amount: updatedSale.final_amount,
          description: `รายรับจดทะเบียนการขาย POS ใบเสร็จ ${id} (แก้ไขแล้ว)`
        };
      }
      return f;
    });
    setFinancials(updatedFinancials);
    saveToStorage('financials', updatedFinancials);
    const updatedFin = updatedFinancials.find(f => f.description.includes(id) && f.type === 'income');
    if (updatedFin) saveDocToFirestore('financials', updatedFin.id, updatedFin);
 
    // 3. Revert points for old customer, add points for new customer
    let updatedCustomers = [...customers];
    
    // Deduct old customer points if existed
    if (oldSale.customer_id) {
      const oldCustIndex = updatedCustomers.findIndex(c => c.id === oldSale.customer_id);
      if (oldCustIndex !== -1) {
        const c = updatedCustomers[oldCustIndex];
        const basePoints = Math.floor(oldSale.final_amount / 25);
        const tierRule = membershipTiers.find(t => t.id === c.tier) || membershipTiers[0];
        const pointsEarned = Math.round(basePoints * tierRule.points_multiplier);
        const newPoints = Math.max(0, c.points - pointsEarned);
        
        let finalTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
        if (newPoints >= 3000) finalTier = 'platinum';
        else if (newPoints >= 1000) finalTier = 'gold';
        else if (newPoints >= 300) finalTier = 'silver';
 
        updatedCustomers[oldCustIndex] = { ...c, points: newPoints, tier: finalTier };
      }
    }
 
    // Add new customer points if exists
    if (updatedSale.customer_id) {
      const newCustIndex = updatedCustomers.findIndex(c => c.id === updatedSale.customer_id);
      if (newCustIndex !== -1) {
        const c = updatedCustomers[newCustIndex];
        const basePoints = Math.floor(updatedSale.final_amount / 25);
        const tierRule = membershipTiers.find(t => t.id === c.tier) || membershipTiers[0];
        const pointsEarned = Math.round(basePoints * tierRule.points_multiplier);
        const newPoints = c.points + pointsEarned;
        
        let finalTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
        if (newPoints >= 3000) finalTier = 'platinum';
        else if (newPoints >= 1000) finalTier = 'gold';
        else if (newPoints >= 300) finalTier = 'silver';
 
        updatedCustomers[newCustIndex] = { ...c, points: newPoints, tier: finalTier };
      }
    }
    
    setCustomers(updatedCustomers);
    saveToStorage('customers', updatedCustomers);
    if (oldSale.customer_id) {
      const oldCust = updatedCustomers.find(c => c.id === oldSale.customer_id);
      if (oldCust) saveDocToFirestore('customers', oldSale.customer_id, oldCust);
    }
    if (updatedSale.customer_id) {
      const newCust = updatedCustomers.find(c => c.id === updatedSale.customer_id);
      if (newCust) saveDocToFirestore('customers', updatedSale.customer_id, newCust);
    }
 
    // 4. Update sales list
    const updatedSales = sales.map(s => s.id === id ? updatedSale : s);
    setSales(updatedSales);
    saveToStorage('sales', updatedSales);
    saveDocToFirestore('sales', id, updatedSale);
 
    logAudit('แก้ไขบิลการขาย', 'sales', id, `แก้ไขบิลการขายเลขที่: ${id} ยอดรวมใหม่: ${updatedSale.final_amount.toLocaleString()} บาท`);
    showToast(`📝 แก้ไขข้อมูลบิล "${id}" สำเร็จแล้ว`, 'success');
  };

  // INCOME & EXPENSE LOGS
  const addFinancialRecord = (recordData: Omit<IncomeExpense, 'id' | 'user_fullname'> & { created_at?: string }) => {
    const newRecord: IncomeExpense = {
      id: `${recordData.type === 'income' ? 'inc' : 'exp'}-${Math.random().toString(36).substr(2, 9)}`,
      ...recordData,
      user_fullname: currentUser.fullname,
      created_at: recordData.created_at || new Date().toISOString()
    };
    const updated = [newRecord, ...financials];
    setFinancials(updated);
    saveToStorage('financials', updated);
    saveDocToFirestore('financials', newRecord.id, newRecord);
    
    const thType = recordData.type === 'income' ? 'รายรับ' : 'รายจ่าย';
    logAudit(`บันทึก${thType}`, 'financials', newRecord.id, `ลงบัญชีรายการ ${recordData.category}: ยอดเงิน ${recordData.amount.toLocaleString()} บาท รายละเอียด: ${recordData.description}`);
    showToast(`ลงรายการ ${thType} "${recordData.category}" สำเร็จ`, 'success');
  };

  const addMultipleFinancialRecords = (records: (Omit<IncomeExpense, 'id' | 'created_at' | 'user_fullname'> & { created_at?: string })[]) => {
    const newRecords: IncomeExpense[] = records.map(recordData => ({
      id: `${recordData.type === 'income' ? 'inc' : 'exp'}-${Math.random().toString(36).substr(2, 9)}`,
      ...recordData,
      user_fullname: currentUser.fullname,
      created_at: recordData.created_at || new Date().toISOString()
    }));
    setFinancials(prev => {
      const updated = [...newRecords, ...prev];
      saveToStorage('financials', updated);
      return updated;
    });
    newRecords.forEach(r => saveDocToFirestore('financials', r.id, r));
    
    logAudit('นำเข้ารายการบัญชี', 'financials', 'bulk', `นำเข้าสมุดบัญชีจาก Excel จำนวน ${records.length} รายการ`);
    showToast(`นำเข้ารายการบัญชีสำเร็จจำนวน ${records.length} รายการ`, 'success');
  };

  const deleteFinancialRecord = (id: string) => {
    const record = financials.find(f => f.id === id);
    if (!record) return;
    const updated = financials.filter(f => f.id !== id);
    setFinancials(updated);
    saveToStorage('financials', updated);
    deleteDocFromFirestore('financials', id);
    const thType = record.type === 'income' ? 'รายรับ' : 'รายจ่าย';
    logAudit(`ลบ${thType}`, 'financials', id, `ลบรายการบัญชี ${record.category} มูลค่า ${record.amount.toLocaleString()} บาท`);
    showToast('ลบรายการทางบัญชีสำเร็จ', 'success');
  };

  const editFinancialRecord = (id: string, recordData: Omit<IncomeExpense, 'id' | 'user_fullname'>) => {
    const updated = financials.map(f => f.id === id ? { ...f, ...recordData } : f);
    setFinancials(updated);
    saveToStorage('financials', updated);
    const updatedItem = updated.find(f => f.id === id);
    if (updatedItem) saveDocToFirestore('financials', id, updatedItem);
    const thType = recordData.type === 'income' ? 'รายรับ' : 'รายจ่าย';
    logAudit(`แก้ไข${thType}`, 'financials', id, `แก้ไขรายการบัญชี ${recordData.category}: ยอดเงิน ${recordData.amount.toLocaleString()} บาท`);
    showToast('แก้ไขข้อมูลรายการบัญชีสำเร็จ', 'success');
  };

  // PROMOTIONS & COUPONS
  const addPromotion = (promo: Omit<Promotion, 'id'>) => {
    const newPromo: Promotion = {
      id: `promo-${Math.random().toString(36).substr(2, 9)}`,
      ...promo
    };
    const updated = [...promotions, newPromo];
    setPromotions(updated);
    saveToStorage('promotions', updated);
    saveDocToFirestore('promotions', newPromo.id, newPromo);
    logAudit('เพิ่มโปรโมชั่น', 'promotions', newPromo.id, `เพิ่มโปรโมชั่นใหม่: "${promo.name}"`);
    showToast(`เพิ่มโปรโมชั่น "${promo.name}" สำเร็จ`, 'success');
  };

  const editPromotion = (id: string, promo: Omit<Promotion, 'id'>) => {
    const updated = promotions.map(p => p.id === id ? { ...p, ...promo } : p);
    setPromotions(updated);
    saveToStorage('promotions', updated);
    const updatedItem = updated.find(p => p.id === id);
    if (updatedItem) saveDocToFirestore('promotions', id, updatedItem);
    logAudit('แก้ไขโปรโมชั่น', 'promotions', id, `แก้ไขโปรโมชั่น: "${promo.name}"`);
    showToast('แก้ไขข้อมูลโปรโมชั่นสำเร็จ', 'success');
  };

  const togglePromotion = (id: string) => {
    const updated = promotions.map(p => p.id === id ? { ...p, active: !p.active } : p);
    setPromotions(updated);
    saveToStorage('promotions', updated);
    const p = updated.find(x => x.id === id);
    if (p) saveDocToFirestore('promotions', id, p);
    logAudit('เปลี่ยนสถานะโปรโมชั่น', 'promotions', id, `เปลี่ยนสถานะโปรโมชั่น "${p?.name}" เป็น ${p?.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`);
    showToast(`โปรโมชั่น "${p?.name}" ${p?.active ? 'เปิดใช้งานแล้ว' : 'ปิดการทำงานแล้ว'}`, 'info');
  };

  const deletePromotion = (id: string) => {
    const p = promotions.find(x => x.id === id);
    const updated = promotions.filter(p => p.id !== id);
    setPromotions(updated);
    saveToStorage('promotions', updated);
    deleteDocFromFirestore('promotions', id);
    logAudit('ลบโปรโมชั่น', 'promotions', id, `ลบโปรโมชั่น: "${p?.name}"`);
    showToast('ลบโปรโมชั่นสำเร็จ', 'success');
  };

  const addCoupon = (coupon: Omit<Coupon, 'id' | 'active'>) => {
    const newCoupon: Coupon = {
      id: `cp-${Math.random().toString(36).substr(2, 9)}`,
      ...coupon,
      active: true
    };
    const updated = [...coupons, newCoupon];
    setCoupons(updated);
    saveToStorage('coupons', updated);
    saveDocToFirestore('coupons', newCoupon.id, newCoupon);
    logAudit('เพิ่มคูปอง', 'coupons', newCoupon.id, `เพิ่มคูปองส่วนลดโค้ด: "${coupon.code}"`);
    showToast(`สร้างคูปองส่วนลดโค้ด "${coupon.code}" สำเร็จ`, 'success');
  };

  const editCoupon = (id: string, coupon: Omit<Coupon, 'id' | 'active'>) => {
    const updated = coupons.map(c => c.id === id ? { ...c, ...coupon } : c);
    setCoupons(updated);
    saveToStorage('coupons', updated);
    const updatedItem = updated.find(c => c.id === id);
    if (updatedItem) saveDocToFirestore('coupons', id, updatedItem);
    logAudit('แก้ไขคูปอง', 'coupons', id, `แก้ไขข้อมูลคูปองโค้ด: "${coupon.code}"`);
    showToast('แก้ไขคูปองสำเร็จ', 'success');
  };

  const toggleCoupon = (id: string) => {
    const updated = coupons.map(c => c.id === id ? { ...c, active: !c.active } : c);
    setCoupons(updated);
    saveToStorage('coupons', updated);
    const c = updated.find(x => x.id === id);
    if (c) saveDocToFirestore('coupons', id, c);
    logAudit('เปลี่ยนสถานะคูปอง', 'coupons', id, `เปลี่ยนสถานะคูปอง "${c?.code}" เป็น ${c?.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`);
    showToast(`คูปองโค้ด "${c?.code}" ${c?.active ? 'เปิดใช้งานแล้ว' : 'ปิดการทำงานแล้ว'}`, 'info');
  };

  const deleteCoupon = (id: string) => {
    const c = coupons.find(x => x.id === id);
    const updated = coupons.filter(c => c.id !== id);
    setCoupons(updated);
    saveToStorage('coupons', updated);
    deleteDocFromFirestore('coupons', id);
    logAudit('ลบคูปองส่วนลด', 'coupons', id, `ลบโค้ดส่วนลด: "${c?.code}"`);
    showToast('ลบข้อมูลคูปองสำเร็จ', 'success');
  };

  // STORE SETTINGS
  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveToStorage('settings', newSettings);
    saveDocToFirestore('settings', 'store_config', newSettings); // Using store_config as main key
    logAudit('ปรับปรุงการตั้งค่าร้าน', 'settings', 'store_config', 'ปรับเปลี่ยนข้อมูลรายละเอียดร้านค้าและอัตราภาษีมูลค่าเพิ่ม (VAT)');
    showToast('ปรับปรุงข้อมูลและตั้งค่าร้านค้าสำเร็จ', 'success');
  };

  const updateRolePermissions = (id: string, permissions: RolePermission['permissions']) => {
    let updatedItem: RolePermission | undefined;
    setRoles(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          updatedItem = { ...r, permissions };
          return updatedItem;
        }
        return r;
      });
      saveToStorage('roles', updated);
      return updated;
    });

    setTimeout(() => {
      if (updatedItem) saveDocToFirestore('roles', id, updatedItem);
    }, 0);
    
    const roleName = roles.find(r => r.id === id)?.name || id;
    logAudit('ปรับปรุงสิทธิ์บทบาท', 'roles', id, `ปรับเปลี่ยนสิทธิ์ความปลอดภัยบทบาทของกลุ่มสิทธิ์ "${roleName}"`);
    showToast(`อัปเดตสิทธิ์บทบาทกลุ่มสิทธิ์ "${roleName}" เรียบร้อย`, 'success');
  };

  // USERS OPERATIONS
  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      ...userData
    };
    
    setUsers(prev => {
      const updated = [...prev, newUser];
      saveToStorage('users', updated);
      return updated;
    });
    saveDocToFirestore('users', newUser.id, newUser);
    logAudit('เพิ่มผู้ใช้ใหม่', 'users', newUser.id, `เพิ่มพนักงานคนใหม่: "${newUser.fullname}" บทบาท: ${newUser.role}`);
    showToast(`เพิ่มผู้ใช้งาน "${newUser.fullname}" สำเร็จ`, 'success');
  };

  const editUser = (id: string, userData: Omit<User, 'id'>) => {
    let updatedItem: User | undefined;
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === id) {
          updatedItem = { ...u, ...userData };
          return updatedItem;
        }
        return u;
      });
      saveToStorage('users', updated);
      return updated;
    });

    setTimeout(() => {
      if (updatedItem) {
        saveDocToFirestore('users', id, updatedItem);
        if (currentUser.id === id) {
          setCurrentUserState(updatedItem);
        }
      }
    }, 0);
    
    logAudit('แก้ไขพนักงาน', 'users', id, `แก้ไขข้อมูลของพนักงาน: "${userData.fullname}"`);
    showToast('แก้ไขข้อมูลพนักงานสำเร็จ', 'success');
  };

  const deleteUser = (id: string): boolean => {
    if (id === currentUser.id) {
      showToast('ไม่สามารถลบตัวเองในขณะทำงานอยู่ในระบบได้', 'error');
      return false;
    }
    const u = users.find(x => x.id === id);
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      saveToStorage('users', updated);
      return updated;
    });
    deleteDocFromFirestore('users', id);
    logAudit('ลบผู้ใช้งานพนักงาน', 'users', id, `ลบพนักงานออกจากระบบ: "${u?.fullname}"`);
    showToast('ลบข้อมูลพนักงานสำเร็จ', 'success');
    return true;
  };

  // UTILITIES: DB RESET AND EXPORT
  const forceSync = async () => {
    showToast('กำลังซิงค์ข้อมูลกับคลาวด์...', 'info');
    await loadAllFromFirestore();
    showToast('ซิงค์ข้อมูลสำเร็จ', 'success');
  };

  const resetDatabase = async () => {
    if (!confirm('🚨 ยืนยันการล้างข้อมูลทั้งหมด? ข้อมูลในระบบคลาวด์จะถูกลบและไม่สามารถกู้คืนได้')) return;
    
    try {
      showToast('กำลังล้างข้อมูลระบบ...', 'info');
      
      // 1. Clear Local Storage
      localStorage.clear();
      
      // 2. Clear Firestore Collections (if online)
      const collectionsToClear = [
        'categories', 'suppliers', 'products', 'customers', 
        'promotions', 'coupons', 'stock_movements', 
        'purchases', 'sales', 'financials', 'audit_logs'
      ];
      
      for (const colName of collectionsToClear) {
        const querySnapshot = await getDocs(collection(db, colName));
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }
      
      // Special handle for users (keep owner)
      const userSnapshot = await getDocs(collection(db, 'users'));
      const userDeletePromises = userSnapshot.docs
        .filter(doc => doc.id !== 'user-1')
        .map(doc => deleteDoc(doc.ref));
      await Promise.all(userDeletePromises);
      
      // Reset settings to default
      await setDoc(doc(db, 'settings', 'store_config'), DEFAULT_SETTINGS);

      // 3. Reset Local State
      setCategories(INITIAL_CATEGORIES);
      setSuppliers(INITIAL_SUPPLIERS);
      setProducts(INITIAL_PRODUCTS);
      setCustomers(INITIAL_CUSTOMERS);
      setUsers(INITIAL_USERS);
      setRoles(INITIAL_ROLES);
      setPromotions(INITIAL_PROMOTIONS);
      setCoupons(INITIAL_COUPONS);
      setSettings(DEFAULT_SETTINGS);
      setStockMovements([]);
      setPurchases([]);
      setSales([]);
      setFinancials([]);
      setAuditLogs([
        {
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          user_fullname: currentUser.fullname,
          action: 'ล้างฐานข้อมูล',
          target_table: 'all',
          details: 'รีเซ็ตข้อมูลทั้งหมดในระบบกลับสู่ค่าเริ่มต้นจริง เพื่อเริ่มการใช้งาน',
          created_at: new Date().toISOString()
        }
      ]);
      
      showToast('คืนค่าข้อมูลและล้างระบบทั้งหมดสำเร็จ', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error resetting database:', error);
      showToast('เกิดข้อผิดพลาดในการล้างข้อมูลคลาวด์', 'error');
    }
  };

  const exportDatabase = (): string => {
    const fullDb = {
      categories,
      suppliers,
      products,
      customers,
      users,
      roles,
      promotions,
      coupons,
      settings,
      stockMovements,
      purchases,
      sales,
      financials,
      auditLogs,
      exported_at: new Date().toISOString()
    };
    return JSON.stringify(fullDb, null, 2);
  };

  const importDatabase = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.settings && parsed.products && parsed.categories) {
        setCategories(parsed.categories || INITIAL_CATEGORIES);
        setSuppliers(parsed.suppliers || INITIAL_SUPPLIERS);
        setProducts(parsed.products || INITIAL_PRODUCTS);
        setCustomers(parsed.customers || INITIAL_CUSTOMERS);
        setUsers(parsed.users || INITIAL_USERS);
        setRoles(parsed.roles || INITIAL_ROLES);
        setPromotions(parsed.promotions || INITIAL_PROMOTIONS);
        setCoupons(parsed.coupons || INITIAL_COUPONS);
        setSettings(parsed.settings || DEFAULT_SETTINGS);
        setStockMovements(parsed.stockMovements || []);
        setPurchases(parsed.purchases || []);
        setSales(parsed.sales || []);
        setFinancials(parsed.financials || []);
        setAuditLogs(parsed.auditLogs || []);

        saveToStorage('categories', parsed.categories);
        saveToStorage('suppliers', parsed.suppliers);
        saveToStorage('products', parsed.products);
        saveToStorage('customers', parsed.customers);
        saveToStorage('users', parsed.users);
        saveToStorage('roles', parsed.roles);
        saveToStorage('promotions', parsed.promotions);
        saveToStorage('coupons', parsed.coupons);
        saveToStorage('settings', parsed.settings);
        saveToStorage('stock_movements', parsed.stockMovements);
        saveToStorage('purchases', parsed.purchases);
        saveToStorage('sales', parsed.sales);
        saveToStorage('financials', parsed.financials);
        saveToStorage('audit_logs', parsed.auditLogs);

        logAudit('นำเข้าข้อมูลระบบ', 'all', 'backup', 'กู้คืนฐานข้อมูล POS สำเร็จผ่านระบบไฟล์สำรองข้อมูล');
        showToast('กู้คืนสำรองข้อมูลระบบทั้งหมดเรียบร้อยแล้ว', 'success');
        return true;
      }
      return false;
    } catch (e) {
      showToast('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', 'error');
      return false;
    }
  };

  return (
    <DbContext.Provider
      value={{
        categories,
        suppliers,
        products,
        customers,
        membershipTiers,
        users,
        roles,
        promotions,
        coupons,
        settings,
        stockMovements,
        purchases,
        sales,
        financials,
        auditLogs,
        currentUser,
        setCurrentUser,
        addCategory,
        editCategory,
        deleteCategory,
        addSupplier,
        editSupplier,
        deleteSupplier,
        addProduct,
        editProduct,
        deleteProduct,
        adjustStock,
        receivePurchase,
        addCustomer,
        editCustomer,
        deleteCustomer,
        addCustomerPoints,
        recordSale,
        deleteSale,
        editSale,
        addFinancialRecord,
        addMultipleFinancialRecords,
        deleteFinancialRecord,
        editFinancialRecord,
        addPromotion,
        editPromotion,
        togglePromotion,
        deletePromotion,
        addCoupon,
        editCoupon,
        toggleCoupon,
        deleteCoupon,
        updateSettings,
        updateRolePermissions,
        addUser,
        editUser,
        deleteUser,
        toasts,
        showToast,
        removeToast,
        resetDatabase,
        forceSync,
        exportDatabase,
        importDatabase,
        dbLoaded,
        githubConnected,
        lastSync
      }}
    >
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
};
