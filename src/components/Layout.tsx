/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  Wallet,
  Percent,
  UserCheck,
  Settings,
  Bell,
  Clock,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Database,
  Store,
  Receipt,
  Menu,
  X,
  Plus,
  Minus,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { settings, currentUser, users, setCurrentUser, toasts, removeToast } = useDb();
  const [time, setTime] = useState(new Date());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('pos_sidebar_collapsed') === 'true';
  });
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('pos_font_size') || '16');
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('pos_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('pos_font_size', String(fontSize));
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.min(24, Math.max(12, prev + delta)));
  };

  const menuItems = [
    { id: 'dashboard', label: 'แผงควบคุม', icon: LayoutDashboard },
    { id: 'pos', label: 'ขายสินค้าหน้าร้าน', icon: ShoppingBag },
    { id: 'sales-history', label: 'ประวัติการขาย', icon: Receipt },
    { id: 'products', label: 'จัดการสินค้า', icon: Package },
    { id: 'stock', label: 'สต็อกและคู่ค้า', icon: Boxes },
    { id: 'customers', label: 'สมาชิกและแต้ม', icon: Users },
    { id: 'finance', label: 'รายรับ-รายจ่าย', icon: Wallet },
    { id: 'promotions', label: 'โปรโมชั่นและคูปอง', icon: Percent },
    { id: 'users', label: 'พนักงานและสิทธิ์', icon: UserCheck },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings },
  ];

  const formatThaiDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getToastStyle = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-white/95 border-[#6CBF84]',
          iconBg: 'bg-[#D7E8D4] text-[#6CBF84]',
          progress: 'bg-[#6CBF84]'
        };
      case 'error':
        return {
          bg: 'bg-white/95 border-[#E57373]',
          iconBg: 'bg-[#FADBD8] text-[#E57373]',
          progress: 'bg-[#E57373]'
        };
      case 'warning':
        return {
          bg: 'bg-white/95 border-[#F2C46D]',
          iconBg: 'bg-[#FEF5E7] text-[#F2C46D]',
          progress: 'bg-[#F2C46D]'
        };
      case 'info':
      default:
        return {
          bg: 'bg-white/95 border-[#8FB996]',
          iconBg: 'bg-[#EAF2EC] text-[#8FB996]',
          progress: 'bg-[#8FB996]'
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#2F3E34] flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-[#EAF2EC] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#8FB996] flex items-center justify-center text-white shrink-0 overflow-hidden">
            {settings.logo ? (
              <img src={settings.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Store className="w-4.5 h-4.5" />
            )}
          </div>
          <span className="font-semibold text-sm truncate max-w-[150px]">{settings.store_name}</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[#2F3E34]/60"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Muji Minimal Luxury Style */}
      <AnimatePresence mode="wait">
        {(isMobileMenuOpen || !isSidebarCollapsed || window.innerWidth >= 768) && (
          <motion.aside 
            initial={window.innerWidth < 768 ? { x: -300 } : false}
            animate={window.innerWidth < 768 ? { x: 0 } : { width: isSidebarCollapsed ? 80 : 288 }}
            exit={window.innerWidth < 768 ? { x: -300 } : false}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`${
              isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden md:flex'
            } bg-white border-r border-[#EAF2EC] flex flex-col shrink-0 h-full overflow-hidden`}
          >
            {/* Brand Header */}
            <div className={`p-6 border-b border-[#EAF2EC] flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 rounded-xl bg-[#8FB996] flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden">
                {settings.logo ? (
                  <img
                    src={settings.logo}
                    alt={settings.store_name}
                    className="w-full h-full object-cover animate-fade-in"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Store className="w-5.5 h-5.5" />
                )}
              </div>
              {!isSidebarCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="overflow-hidden"
                >
                  <h1 className="font-semibold text-sm tracking-tight text-[#2F3E34] truncate max-w-[160px]">
                    {settings.store_name}
                  </h1>
                  <p className="text-[11px] text-[#8FB996] font-medium tracking-wide flex items-center gap-1 mt-0.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6CBF84] inline-block animate-pulse"></span>
                    ระบบสไตล์เซน
                  </p>
                </motion.div>
              )}
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`menu-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 768) setIsMobileMenuOpen(false);
                    }}
                    title={isSidebarCollapsed ? item.label : ''}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4'} py-3 rounded-xl text-left text-[14px] font-medium transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-[#8FB996]/10 text-[#8FB996] shadow-sm'
                        : 'text-[#2F3E34]/70 hover:text-[#2F3E34] hover:bg-[#8FB996]/4'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                      isActive ? 'text-[#8FB996]' : 'text-[#2F3E34]/40 group-hover:text-[#2F3E34]/60'
                    }`} />
                    {!isSidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                    {isActive && !isSidebarCollapsed && (
                      <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#8FB996]"></span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Font Size & Collapse Controls */}
            <div className={`p-4 border-t border-[#EAF2EC] flex flex-col gap-2 ${isSidebarCollapsed ? 'items-center' : ''}`}>
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between px-2 text-[#2F3E34]/40 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">ขนาดตัวอักษร</span>
                  </div>
                  <span className="text-[10px] font-mono">{fontSize}px</span>
                </div>
              )}
              
              <div className={`flex ${isSidebarCollapsed ? 'flex-col' : 'items-center justify-between'} gap-2`}>
                <div className={`flex items-center gap-1 bg-[#F8FAF7] border border-[#EAF2EC] rounded-lg p-1 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
                  <button 
                    onClick={() => adjustFontSize(-1)}
                    className="p-1.5 hover:bg-white rounded-md transition-colors text-[#2F3E34]/60"
                    title="ลดขนาดตัวอักษร"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => adjustFontSize(1)}
                    className="p-1.5 hover:bg-white rounded-md transition-colors text-[#2F3E34]/60"
                    title="เพิ่มขนาดตัวอักษร"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button 
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={`p-2 hover:bg-[#8FB996]/10 rounded-xl transition-all duration-300 text-[#8FB996] ${isSidebarCollapsed ? '' : 'bg-[#8FB996]/5'}`}
                  title={isSidebarCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Active Cashier Switching & Profile Footer */}
            <div className={`p-4 border-t border-[#EAF2EC] bg-[#F8FAF7]/50 ${isSidebarCollapsed ? 'space-y-4' : 'space-y-3'}`}>
              {!isSidebarCollapsed && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-[#2F3E34]/45 font-semibold block px-1">
                    ผู้ปฏิบัติการขณะนี้
                  </label>
                  <select
                    value={currentUser.id}
                    onChange={(e) => {
                      const selected = users.find(u => u.id === e.target.value);
                      if (selected) setCurrentUser(selected);
                    }}
                    className="w-full text-[13px] bg-white border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] font-medium focus:outline-none focus:ring-1 focus:ring-[#8FB996] appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238FB996\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullname}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 p-2 rounded-xl bg-white border border-[#EAF2EC]'}`}>
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                  alt={currentUser.fullname}
                  className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-full object-cover shrink-0 border border-[#EAF2EC]`}
                  referrerPolicy="no-referrer"
                />
                {!isSidebarCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-[#2F3E34] truncate">{currentUser.fullname}</p>
                    <p className="text-[10px] text-[#2F3E34]/50 font-medium">สิทธิ์: {currentUser.role === 'owner' ? 'เจ้าของ' : 'พนักงาน'}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Row */}
        <header className="bg-white/80 backdrop-blur-md border-b border-[#EAF2EC] sticky top-0 z-40 px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <h2 className="text-sm md:text-base font-semibold tracking-tight text-[#2F3E34] truncate">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
            <ChevronRight className="w-4 h-4 text-[#2F3E34]/20 shrink-0" />
            <span className="text-[10px] md:text-xs text-[#2F3E34]/50 font-medium bg-[#8FB996]/5 px-2 md:px-2.5 py-1 rounded-full truncate">
              {currentUser.role === 'owner' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
            </span>
          </div>

          {/* Time & Real-time Status */}
          <div className="hidden sm:flex items-center gap-4 text-[#2F3E34]/60 font-medium text-xs">
            <div className="flex items-center gap-1.5 bg-[#F8FAF7] border border-[#EAF2EC] px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5 text-[#8FB996]" />
              <span className="hidden lg:inline">{formatThaiDate(time)}</span>
              <span className="hidden lg:inline text-[#2F3E34]/20">|</span>
              <span className="font-mono">{time.toLocaleTimeString('th-TH')} น.</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-6 relative overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Floating Animated Toast Notifications System - Top Right Corner */}
      <div className="fixed top-6 right-6 z-50 space-y-3 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={removeToast}
            getToastStyle={getToastStyle}
          />
        ))}
      </div>

      {/* Dynamic Keyframe for shrinking width (progress bar countdown) */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

interface ToastItemProps {
  toast: any;
  onClose: (id: string) => void;
  getToastStyle: (type: string) => { bg: string; iconBg: string; progress: string };
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose, getToastStyle }) => {
  const styles = getToastStyle(toast.type);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={`flex flex-col ${styles.bg} border rounded-xl shadow-lg pointer-events-auto overflow-hidden animate-fade-in`}
      style={{
        boxShadow: '0 12px 25px -5px rgba(47, 62, 52, 0.08)'
      }}
    >
      <div className="flex items-center gap-3 p-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${styles.iconBg} font-bold text-sm`}>
          {toast.type === 'success' && '✓'}
          {toast.type === 'error' && '✕'}
          {toast.type === 'warning' && '⚠️'}
          {toast.type === 'info' && 'i'}
        </div>
        <div className="flex-1 pr-2">
          <p className="text-xs font-semibold text-[#2F3E34] leading-relaxed">
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-[#2F3E34]/30 hover:text-[#2F3E34]/60 transition-colors text-xs p-1 cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-black/5 overflow-hidden">
        <div
          className={`h-full ${styles.progress}`}
          style={{
            animation: `shrinkWidth ${toast.duration || 4000}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
};
