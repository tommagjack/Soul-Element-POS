/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DbProvider, useDb } from './context/DbContext';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { ProductsView } from './components/ProductsView';
import { StockView } from './components/StockView';
import { CustomersView } from './components/CustomersView';
import { FinanceView } from './components/FinanceView';
import { PromotionsView } from './components/PromotionsView';
import { UsersView } from './components/UsersView';
import { SettingsView } from './components/SettingsView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { Lock, CircleAlert, RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, rolesPermissions, settings } = useDb();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Dynamically update document title based on Store Name
  React.useEffect(() => {
    if (settings.store_name) {
      document.title = settings.store_name;
    }
  }, [settings.store_name]);

  // Verify Role-Based Access Control
  const hasAccess = (tab: string): boolean => {
    // Owner has supreme master access
    if (currentUser?.role === 'owner') return true;

    const perm = rolesPermissions.find(p => p.role === currentUser?.role);
    if (!perm) return false;

    switch (tab) {
      case 'dashboard':
        return true; // Dashboard open for everyone
      case 'pos':
        return perm.can_access_pos;
      case 'sales-history':
        return perm.can_access_pos;
      case 'products':
        return perm.can_access_products;
      case 'stock':
        return perm.can_access_stock;
      case 'customers':
        return perm.can_access_customers;
      case 'finance':
        return perm.can_access_finance;
      case 'promotions':
        return perm.can_access_pos || perm.can_access_products; // tied to POS or Product management
      case 'users':
        return perm.can_access_users;
      case 'settings':
        return perm.can_access_settings;
      default:
        return false;
    }
  };

  const isAllowed = hasAccess(activeTab);

  // Render the appropriate view
  const renderActiveView = () => {
    if (!isAllowed) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-fade-in max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#E57373]/10 text-[#E57373] flex items-center justify-center mb-5 shrink-0">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#2F3E34] mb-2">ขออภัย บทบาทของคุณไม่มีสิทธิ์เข้าถึงส่วนนี้</h3>
          <p className="text-xs text-[#2F3E34]/55 leading-relaxed mb-6">
            สิทธิ์การเข้าถึงเมนู <strong>"{getTabLabelThai(activeTab)}"</strong> ถูกจำกัดโดยสิทธิ์ความปลอดภัย 
            คุณสามารถขอเปลี่ยนสิทธิ์การปฏิบัติงานกับผู้ดูแลร้าน หรือทดลอง "สลับผู้ปฏิบัติการ" ที่มุมซ้ายล่างเพื่อทดสอบสิทธิ์ผู้ดูแลระบบได้
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-[#8FB996] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#8FB996]/95 cursor-pointer"
            >
              กลับสู่แผงควบคุมหลัก
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <PosView />;
      case 'sales-history':
        return <SalesHistoryView />;
      case 'products':
        return <ProductsView />;
      case 'stock':
        return <StockView />;
      case 'customers':
        return <CustomersView />;
      case 'finance':
        return <FinanceView />;
      case 'promotions':
        return <PromotionsView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  const getTabLabelThai = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'แผงควบคุม';
      case 'pos': return 'ขายสินค้าหน้าร้าน';
      case 'sales-history': return 'ประวัติการขาย';
      case 'products': return 'จัดการสินค้า';
      case 'stock': return 'สต็อกและคู่ค้า';
      case 'customers': return 'สมาชิกและแต้ม';
      case 'finance': return 'รายรับ-รายจ่าย';
      case 'promotions': return 'โปรโมชั่นและคูปอง';
      case 'users': return 'พนักงานและสิทธิ์';
      case 'settings': return 'ตั้งค่าระบบ';
      default: return 'หน้าจอระบุสิทธิ์';
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderActiveView()}
    </Layout>
  );
};

export default function App() {
  return (
    <DbProvider>
      <AppContent />
    </DbProvider>
  );
}
