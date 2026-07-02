/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Customer } from '../types';
import {
  Users,
  Search,
  UserPlus,
  Trash2,
  Edit2,
  Award,
  Calendar,
  Phone,
  Mail,
  History,
  ShoppingBag,
  Gift,
  Coins,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const {
    customers,
    membershipTiers,
    sales,
    products,
    addCustomer,
    editCustomer,
    deleteCustomer,
    showToast
  } = useDb();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Custom Delete Confirmation Target State
  const [deleteCustTargetId, setDeleteCustTargetId] = useState<string | null>(null);

  // Customer Form Modals
  const [showCustModal, setShowCustModal] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custLine, setCustLine] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custBirthday, setCustBirthday] = useState('');

  // Selected Member History view
  const [selectedHistCustId, setSelectedHistCustId] = useState<string | null>(null);

  // Filtered, sorted and paginated customers list (Newest first)
  const sortedCustomers = [...customers]
    .filter(c => {
      const matchesTier = selectedTierFilter === 'all' || c.tier === selectedTierFilter;
      const matchesSearch =
        c.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.line_id && c.line_id.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTier && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

  const totalCustItems = sortedCustomers.length;
  const totalCustPages = Math.ceil(totalCustItems / itemsPerPage) || 1;
  const paginatedCustomers = sortedCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Open Cust Form
  const handleOpenAddCust = () => {
    setEditingCust(null);
    setCustName('');
    setCustPhone('');
    setCustLine('');
    setCustEmail('');
    setCustBirthday('1990-01-01');
    setShowCustModal(true);
  };

  const handleOpenEditCust = (cust: Customer) => {
    setEditingCust(cust);
    setCustName(cust.fullname);
    setCustPhone(cust.phone);
    setCustLine(cust.line_id || '');
    setCustEmail(cust.email || '');
    setCustBirthday(cust.birthday || '');
    setShowCustModal(true);
  };

  const handleCustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      showToast('⚠️ กรุณาระบุชื่อ-นามสกุล และเบอร์โทรศัพท์ลูกค้าให้ถูกต้อง', 'warning');
      return;
    }

    const payload = {
      fullname: custName,
      phone: custPhone,
      line_id: custLine,
      email: custEmail,
      birthday: custBirthday
    };

    if (editingCust) {
      editCustomer(editingCust.id, payload);
    } else {
      addCustomer(payload);
    }
    setShowCustModal(false);
  };

  // Get list of sales associated with a customer
  const getCustomerSales = (custId: string) => {
    return sales.filter(s => s.customer_id === custId);
  };

  const selectedCustDetails = customers.find(c => c.id === selectedHistCustId);
  const selectedCustSales = selectedHistCustId ? getCustomerSales(selectedHistCustId) : [];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-slate-300 to-indigo-100 border-indigo-200 text-indigo-950';
      case 'gold':
        return 'from-amber-100 to-amber-200 border-amber-300 text-amber-900';
      case 'silver':
        return 'from-gray-100 to-slate-200 border-slate-300 text-slate-800';
      case 'bronze':
      default:
        return 'from-orange-50 to-orange-100 border-orange-200 text-orange-950';
    }
  };

  const getTierNameThai = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'แพลตินัม (Platinum)';
      case 'gold': return 'โกลด์ (Gold)';
      case 'silver': return 'ซิลเวอร์ (Silver)';
      case 'bronze': default: return 'บรอนซ์ (Bronze)';
    }
  };

  return (
    <div className="space-y-6">
      {/* 2 Grid Columns Layout: Left is Customer list / CRM, Right is Loyalty rules / member history details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CUSTOMERS DIRECTORY (2 cols span) */}
        <div className="xl:col-span-2 space-y-5 bg-white border border-[#EAF2EC] rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F8FAF7] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#2F3E34]">ฐานข้อมูลสมาชิกสปาและสะสมคะแนน</h3>
              <p className="text-xs text-[#2F3E34]/50">ตรวจสอบ จัดการรายชื่อระดับสมาชิกสะสมแต้ม MOKU ONSEN</p>
            </div>
            <button
              onClick={handleOpenAddCust}
              className="px-4 py-2.5 bg-[#8FB996] hover:bg-[#8FB996]/95 text-white transition-all rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4" /> <span>ลงทะเบียนลูกค้าใหม่</span>
            </button>
          </div>

          {/* Search filters row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#2F3E34]/35" />
              <input
                type="text"
                placeholder="ค้นหาชื่อลูกค้า / เบอร์โทรศัพท์ / LINE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl pl-10 pr-4 py-2.5 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
              />
            </div>

            <select
              value={selectedTierFilter}
              onChange={(e) => setSelectedTierFilter(e.target.value)}
              className="text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2.5 text-[#2F3E34] font-medium focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
            >
              <option value="all">ทุกระดับชั้นสมาชิก (All Tiers)</option>
              <option value="bronze">บรอนซ์ (Bronze)</option>
              <option value="silver">ซิลเวอร์ (Silver)</option>
              <option value="gold">โกลด์ (Gold)</option>
              <option value="platinum">แพลตินัม (Platinum)</option>
            </select>
          </div>

          {/* Customers Directory List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAF7] border-b border-[#EAF2EC] text-[#2F3E34]/60 text-[11px] font-bold tracking-wider">
                  <th className="py-3.5 px-4">ชื่อ-นามสกุลสมาชิก</th>
                  <th className="py-3.5 px-3">เบอร์โทรติดต่อ</th>
                  <th className="py-3.5 px-3">ระดับสิทธิ์</th>
                  <th className="py-3.5 px-3 text-center">คะแนนสะสม</th>
                  <th className="py-3.5 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2EC] text-xs">
                {paginatedCustomers.length > 0 ? (
                  paginatedCustomers.map(cust => (
                    <tr
                      key={cust.id}
                      className={`hover:bg-[#8FB996]/4 transition-all cursor-pointer ${selectedHistCustId === cust.id ? 'bg-[#8FB996]/10 font-medium' : ''}`}
                      onClick={() => setSelectedHistCustId(cust.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#8FB996]/10 text-[#8FB996] flex items-center justify-center font-bold text-xs">
                            {cust.fullname.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2F3E34]">{cust.fullname}</p>
                            <p className="text-[10px] text-[#2F3E34]/40 font-mono">LINE: {cust.line_id || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#2F3E34]/70">
                        {cust.phone}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getTierColor(cust.tier)}`}>
                          {cust.tier.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#8FB996]">
                        {cust.points.toLocaleString()} แต้ม
                      </td>
                      <td className="py-3 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCust(cust)}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-[#2F3E34]/60 transition-colors inline-flex cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCustTargetId(cust.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors inline-flex cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#2F3E34]/40">
                      <Users className="w-10 h-10 mx-auto mb-2 text-[#8FB996] opacity-60" />
                      <span>ไม่พบข้อมูลรายชื่อสมาชิกสปาที่ค้นหา</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalCustPages > 1 && (
            <div className="border-t border-[#EAF2EC] pt-4 flex items-center justify-between text-xs text-[#2F3E34]/60">
              <p>แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCustItems)} จากทั้งหมด {totalCustItems} รายการ</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-[#2F3E34] px-2">หน้า {currentPage} / {totalCustPages}</span>
                <button
                  type="button"
                  disabled={currentPage === totalCustPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalCustPages))}
                  className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LOYALTY RULES & DETAILED TRANSACTION LOGS */}
        <div className="space-y-6">
          
          {/* Section 1: Loyalty Rule card guide */}
          <div className="glass-card border border-[#EAF2EC] rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-[#2F3E34] flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-[#8FB996]" />
              <span>กติกาและสิทธิ์ระดับสมาชิก (Loyalty Rules)</span>
            </h4>
            <p className="text-[11px] text-[#2F3E34]/60 leading-relaxed">
              ยอดชำระครบทุก <strong>฿25</strong> ได้รับแต้มพื้นฐาน <strong>1 แต้ม</strong> โดยแต้มสะสมจะถูกคูณด้วยสิทธิ์ของแต่ละระดับดังนี้
            </p>

            <div className="space-y-2.5">
              {membershipTiers.map(tier => (
                <div key={tier.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#EAF2EC]/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      tier.id === 'platinum' ? 'bg-indigo-400' : tier.id === 'gold' ? 'bg-amber-400' : tier.id === 'silver' ? 'bg-slate-400' : 'bg-orange-300'
                    }`}></span>
                    <span className="font-semibold text-[#2F3E34]">{tier.id.toUpperCase()}</span>
                  </div>
                  <div className="text-right text-[11px] text-[#2F3E34]/70">
                    <p className="font-bold">แต้มสะสม x{tier.points_multiplier}</p>
                    <p className="text-[9px] text-[#2F3E34]/40">เป้าหมาย: {tier.min_points}+ แต้ม | ส่วนลดบิล {tier.discount_rate * 100}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Selected member's purchase history logs */}
          <div className="bg-white border border-[#EAF2EC] rounded-2xl p-5 space-y-4 min-h-[250px] flex flex-col">
            <h4 className="text-xs font-bold text-[#2F3E34] flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-[#8FB996]" />
              <span>ประวัติการใช้บริการและการซื้อ</span>
            </h4>

            {selectedCustDetails ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="pb-3 border-b border-[#F8FAF7]">
                    <p className="text-xs font-bold text-[#2F3E34]">{selectedCustDetails.fullname}</p>
                    <p className="text-[10px] text-[#2F3E34]/50 mt-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedCustDetails.phone}</p>
                    {selectedCustDetails.email && <p className="text-[10px] text-[#2F3E34]/50 mt-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {selectedCustDetails.email}</p>}
                    {selectedCustDetails.birthday && <p className="text-[10px] text-[#2F3E34]/50 mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> เกิดเมื่อ: {selectedCustDetails.birthday}</p>}
                  </div>

                  <div className="mt-4 space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    <p className="text-[10px] text-[#2F3E34]/40 font-bold uppercase">ประวัติบิลขายสุขภาพล่าสุด ({selectedCustSales.length})</p>
                    {selectedCustSales.length > 0 ? (
                      selectedCustSales.map(sale => (
                        <div key={sale.id} className="p-2.5 rounded-lg bg-[#F8FAF7] border border-[#EAF2EC]/50 flex items-center justify-between text-[11px]">
                          <div>
                            <p className="font-bold text-[#2F3E34]">{sale.id}</p>
                            <p className="text-[9px] text-[#2F3E34]/40 mt-0.5">{new Date(sale.created_at).toLocaleDateString('th-TH')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#8FB996] font-mono">฿{sale.final_amount.toLocaleString()}</p>
                            <p className="text-[9px] text-[#2F3E34]/40">{sale.items.length} รายการ</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-[#2F3E34]/30 py-4 text-center">ยังไม่มีบันทึกยอดชำระเงินกับลูกค้ารายนี้</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAF2EC]/40 flex items-center justify-between bg-[#8FB996]/5 p-3 rounded-xl mt-4">
                  <div className="flex items-center gap-2 text-xs">
                    <Coins className="w-4.5 h-4.5 text-[#8FB996]" />
                    <span className="font-semibold">แต้มสะสมทั้งหมด:</span>
                  </div>
                  <span className="font-mono font-black text-sm text-[#8FB996]">{selectedCustDetails.points.toLocaleString()} แต้ม</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-[#2F3E34]/30 py-12">
                <ShoppingBag className="w-9 h-9 opacity-35 mb-2 text-[#8FB996]" />
                <p className="text-[11px] leading-relaxed">กรุณาคลิกเลือกชื่อสมาชิกในฐานข้อมูลทางซ้าย เพื่อดึงข้อมูลประวัติการซื้อและแต้มสะสมรายบุคคล</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: CUSTOMER CREATE/EDIT DRAWER */}
      {showCustModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-sm font-bold text-[#2F3E34] mb-4">
              {editingCust ? 'แก้ไขประวัติข้อมูลสมาชิก' : 'จดทะเบียนรายชื่อสมาชิกใหม่'}
            </h3>

            <form onSubmit={handleCustSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ชื่อ-นามสกุลลูกค้า</label>
                <input
                  type="text"
                  required
                  placeholder="ระบุตัวตน เช่น คุณสายชล ขจรเดช"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  required
                  placeholder="08X-XXX-XXXX"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ไอดีไลน์ (LINE ID)</label>
                <input
                  type="text"
                  placeholder="ระบุเพื่อเชื่อมระบบ (ไม่บังคับ)"
                  value={custLine}
                  onChange={(e) => setCustLine(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">อีเมลติดต่อ (Email)</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">วันเกิดของสมาชิก</label>
                <input
                  type="date"
                  value={custBirthday}
                  onChange={(e) => setCustBirthday(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#EAF2EC] mt-6">
                <button
                  type="button"
                  onClick={() => setShowCustModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingCust ? 'บันทึกแก้ไข' : 'บันทึกลงทะเบียนสำเร็จ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG FOR CUSTOMER DELETIONS */}
      {deleteCustTargetId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-[#E57373] mb-3" />
            <h4 className="text-sm font-bold text-[#2F3E34] mb-1">ยืนยันการลบข้อมูลสมาชิก?</h4>
            <p className="text-[10px] text-[#2F3E34]/60 mb-5 leading-relaxed">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลประวัติและแต้มสะสมทั้งหมดของสมาชิกท่านนี้จะถูกลบออกถาวร
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteCustTargetId(null)}
                className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteCustTargetId) {
                    deleteCustomer(deleteCustTargetId);
                    if (selectedHistCustId === deleteCustTargetId) setSelectedHistCustId(null);
                    setDeleteCustTargetId(null);
                  }
                }}
                className="py-2 rounded-xl bg-[#E57373] hover:bg-[#E57373]/95 text-white text-xs font-bold cursor-pointer"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
