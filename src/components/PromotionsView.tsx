/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Promotion, Coupon } from '../types';
import {
  Gift,
  Ticket,
  Plus,
  Trash2,
  Inbox,
  Clock,
  CircleAlert,
  Percent,
  CheckCircle,
  Tag,
  Edit2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export const PromotionsView: React.FC = () => {
  const {
    promotions,
    coupons,
    addPromotion,
    editPromotion,
    deletePromotion,
    addCoupon,
    editCoupon,
    deleteCoupon,
    showToast
  } = useDb();

  // Navigation Subtabs
  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'promotions'>('coupons');

  // Form Modals
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Editing state
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  // Custom Deletion Confirmation states
  const [deleteCouponTargetId, setDeleteCouponTargetId] = useState<string | null>(null);
  const [deletePromoTargetId, setDeletePromoTargetId] = useState<string | null>(null);

  // Pagination states
  const [currentPageCoupons, setCurrentPageCoupons] = useState(1);
  const [currentPagePromotions, setCurrentPagePromotions] = useState(1);
  const itemsPerPage = 20;

  // Coupon Form state
  const [cpCode, setCpCode] = useState('');
  const [cpName, setCpName] = useState('');
  const [cpType, setCpType] = useState<'percent' | 'fixed'>('fixed');
  const [cpValue, setCpValue] = useState(50);
  const [cpMinSpend, setCpMinSpend] = useState(300);
  const [cpExpiry, setCpExpiry] = useState('2026-12-31');

  // Promotion Form state
  const [promoName, setPromoName] = useState('');
  const [promoType, setPromoType] = useState<'bogo' | 'discount_percent' | 'discount_amount' | 'happy_hour'>('bogo');
  const [promoValue, setPromoValue] = useState(10);
  const [promoMinSpend, setPromoMinSpend] = useState(500);
  const [promoStart, setPromoStart] = useState('2026-07-01');
  const [promoEnd, setPromoEnd] = useState('2026-12-31');
  const [promoDescription, setPromoDescription] = useState('');

  // Pagination calculations for Coupons
  const sortedCoupons = [...coupons].reverse();
  const totalCouponItems = sortedCoupons.length;
  const totalCouponPages = Math.ceil(totalCouponItems / itemsPerPage) || 1;
  const paginatedCoupons = sortedCoupons.slice(
    (currentPageCoupons - 1) * itemsPerPage,
    currentPageCoupons * itemsPerPage
  );

  // Pagination calculations for Promotions
  const sortedPromotions = [...promotions].reverse();
  const totalPromoItems = sortedPromotions.length;
  const totalPromoPages = Math.ceil(totalPromoItems / itemsPerPage) || 1;
  const paginatedPromotions = sortedPromotions.slice(
    (currentPagePromotions - 1) * itemsPerPage,
    currentPagePromotions * itemsPerPage
  );

  // Handle open add coupon
  const handleOpenAddCoupon = () => {
    setEditingCoupon(null);
    setCpCode('');
    setCpName('');
    setCpType('fixed');
    setCpValue(50);
    setCpMinSpend(300);
    setCpExpiry('2026-12-31');
    setShowCouponModal(true);
  };

  // Handle open edit coupon
  const handleOpenEditCoupon = (cp: Coupon) => {
    setEditingCoupon(cp);
    setCpCode(cp.code);
    setCpName(cp.description);
    setCpType(cp.type);
    setCpValue(cp.discount_value);
    setCpMinSpend(cp.min_purchase);
    setCpExpiry(cp.expiry_date || '');
    setShowCouponModal(true);
  };

  // Submit Coupon
  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = cpCode.trim().toUpperCase();
    if (!cleanCode || !cpName.trim()) {
      showToast('⚠️ กรุณาระบุรหัสคูปอง และชื่อรายละเอียดสปาให้ครบถ้วน', 'warning');
      return;
    }

    const payload = {
      code: cleanCode,
      description: cpName,
      type: cpType,
      discount_value: Number(cpValue) || 0,
      min_purchase: Number(cpMinSpend) || 0,
      expiry_date: cpExpiry || undefined
    };

    if (editingCoupon) {
      editCoupon(editingCoupon.id, payload);
    } else {
      addCoupon(payload);
    }

    setShowCouponModal(false);
    setEditingCoupon(null);
  };

  // Handle open add promotion
  const handleOpenAddPromotion = () => {
    setEditingPromotion(null);
    setPromoName('');
    setPromoType('bogo');
    setPromoValue(1);
    setPromoMinSpend(500);
    setPromoStart('2026-07-01');
    setPromoEnd('2026-12-31');
    setPromoDescription('');
    setShowPromoModal(true);
  };

  // Handle open edit promotion
  const handleOpenEditPromotion = (promo: Promotion) => {
    setEditingPromotion(promo);
    setPromoName(promo.name);
    setPromoType(promo.type);
    setPromoValue(promo.value);
    setPromoMinSpend(promo.min_purchase);
    setPromoStart(promo.start_date);
    setPromoEnd(promo.end_date);
    setPromoDescription(promo.description);
    setShowPromoModal(true);
  };

  // Submit Promotion
  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName.trim()) {
      showToast('⚠️ กรุณาระบุชื่อแคมเปญโปรโมชั่น', 'warning');
      return;
    }

    const payload = {
      name: promoName,
      type: promoType,
      value: promoType === 'bogo' ? 1 : Number(promoValue) || 0,
      min_purchase: Number(promoMinSpend) || 0,
      active: editingPromotion ? editingPromotion.active : true,
      start_date: promoStart,
      end_date: promoEnd,
      description: promoDescription.trim() || promoName
    };

    if (editingPromotion) {
      editPromotion(editingPromotion.id, payload);
    } else {
      addPromotion(payload);
    }

    setShowPromoModal(false);
    setEditingPromotion(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switchers */}
      <div className="flex gap-2.5 shrink-0 border-b border-[#EAF2EC] pb-2">
        {[
          { id: 'coupons', label: 'รหัสคูปองส่วนลดตะกร้า (Coupons)', icon: Ticket },
          { id: 'promotions', label: 'แคมเปญซื้อและของแถม (Promotions)', icon: Gift }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#8FB996] text-white shadow-sm'
                  : 'bg-white text-[#2F3E34]/70 border border-[#EAF2EC] hover:bg-[#8FB996]/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: COUPONS SCREEN */}
      {activeSubTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#2F3E34]">คูปองลดราคาท้ายบิล (Checkout Coupons)</h3>
              <p className="text-xs text-[#2F3E34]/50">รหัสคูปองสำหรับพิมพ์แจกลูกค้าหรือสปอนเซอร์ส่วนลดพิเศษหน้าร้าน</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddCoupon}
              className="px-4 py-2.5 bg-[#8FB996] hover:bg-[#8FB996]/95 text-white transition-all rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> <span>สร้างคูปองใหม่</span>
            </button>
          </div>

          {paginatedCoupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedCoupons.map(cp => {
                const hasExpiry = !!cp.expiry_date;
                const isExpired = hasExpiry ? new Date(cp.expiry_date!) < new Date() : false;
                return (
                  <div key={cp.id} className="relative bg-white border border-[#EAF2EC] rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between p-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-[#8FB996] bg-[#8FB996]/10 border border-[#8FB996]/20 px-3 py-1 rounded-xl uppercase tracking-wider">
                          {cp.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isExpired ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {isExpired ? 'หมดเขตแล้ว' : 'เปิดใช้งานอยู่'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[#2F3E34] leading-relaxed line-clamp-1">{cp.description}</h4>
                        <p className="text-[10px] text-[#2F3E34]/55 mt-1">
                          ส่วนลดพิเศษ: <strong className="font-mono text-[#8FB996] text-xs">{cp.type === 'percent' ? `${cp.discount_value}%` : `฿${cp.discount_value}`}</strong>
                        </p>
                        <p className="text-[10px] text-[#2F3E34]/55 mt-0.5">
                          ขั้นต่ำในการเปิดใช้: <span className="font-mono">฿{cp.min_purchase}</span> บาท
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-[#EAF2EC]/60 flex items-center justify-between text-[10px]">
                      <span className="text-[#2F3E34]/40 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> หมดอายุ: {hasExpiry ? new Date(cp.expiry_date!).toLocaleDateString('th-TH') : 'ไม่มีหมดอายุ'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCoupon(cp)}
                          className="text-[#2F3E34]/60 hover:text-[#8FB996] font-bold hover:bg-[#8FB996]/10 p-1.5 rounded-lg cursor-pointer transition-colors"
                          title="แก้ไขคูปอง"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCouponTargetId(cp.id)}
                          className="text-red-500 hover:text-red-700 font-bold hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                          title="ลบคูปอง"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-[#2F3E34]/40 bg-white border border-[#EAF2EC] rounded-2xl shadow-sm">
              <Ticket className="w-12 h-12 mx-auto mb-2 text-[#8FB996] opacity-60" />
              <p className="text-sm font-semibold">ไม่มีรหัสคูปองส่วนลดในระบบ</p>
            </div>
          )}

          {/* Pagination Controls for Coupons */}
          {totalCouponPages > 1 && (
            <div className="border-t border-[#EAF2EC] pt-4 flex items-center justify-between text-xs text-[#2F3E34]/60">
              <p>แสดง {(currentPageCoupons - 1) * itemsPerPage + 1} - {Math.min(currentPageCoupons * itemsPerPage, totalCouponItems)} จากทั้งหมด {totalCouponItems} คูปอง</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPageCoupons === 1}
                  onClick={() => setCurrentPageCoupons(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-[#2F3E34] px-2">หน้า {currentPageCoupons} / {totalCouponPages}</span>
                <button
                  type="button"
                  disabled={currentPageCoupons === totalCouponPages}
                  onClick={() => setCurrentPageCoupons(prev => Math.min(prev + 1, totalCouponPages))}
                  className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: PROMOTIONS SCREEN */}
      {activeSubTab === 'promotions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#2F3E34]">โปรโมชั่นร้านค้าปลีก (Promotions)</h3>
              <p className="text-xs text-[#2F3E34]/50">สิทธิพิเศษซื้อสินค้ารายชิ้น จัดโปรซื้อ 1 แถม 1 หรือลดราคารายเซ็ต</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddPromotion}
              className="px-4 py-2.5 bg-[#8FB996] hover:bg-[#8FB996]/95 text-white transition-all rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> <span>สร้างแคมเปญใหม่</span>
            </button>
          </div>

          {paginatedPromotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedPromotions.map(promo => {
                const isExpired = new Date(promo.end_date) < new Date();
                return (
                  <div key={promo.id} className="bg-white border border-[#EAF2EC] rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-[#8FB996]/10 text-[#8FB996] font-bold px-2 py-0.5 rounded-md uppercase">
                          {promo.type === 'bogo' ? 'ซื้อ 1 แถม 1 (BOGO)' :
                           promo.type === 'discount_percent' ? 'ลด % ทั้งบิล' :
                           promo.type === 'discount_amount' ? 'ลดบาททั้งบิล' : 'ช่วงเวลาพิเศษ'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isExpired ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {isExpired ? 'หมดอายุ' : 'กำลังจัดรายการ'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[#2F3E34] leading-relaxed line-clamp-1">{promo.name}</h4>
                        <p className="text-[10px] text-[#2F3E34]/50 mt-1.5 leading-relaxed line-clamp-2 min-h-[32px]">
                          {promo.description || '-'}
                        </p>
                        <p className="text-[10px] text-[#2F3E34]/50 mt-1 font-semibold">
                          มูลค่าสิทธิ์: <span className="text-[#8FB996] font-mono">{promo.type === 'bogo' ? 'แถมฟรี 1 ชิ้น' : promo.type === 'discount_percent' ? `${promo.value}%` : `฿${promo.value}`}</span> ขั้นต่ำ: ฿{promo.min_purchase}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-[#EAF2EC]/60 flex items-center justify-between text-[10px]">
                      <span className="text-[#2F3E34]/40 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> ระยะ: {new Date(promo.start_date).toLocaleDateString('th-TH')} - {new Date(promo.end_date).toLocaleDateString('th-TH')}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPromotion(promo)}
                          className="text-[#2F3E34]/60 hover:text-[#8FB996] font-bold hover:bg-[#8FB996]/10 p-1.5 rounded-lg cursor-pointer transition-colors"
                          title="แก้ไขโปรโมชั่น"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePromoTargetId(promo.id)}
                          className="text-red-500 hover:text-red-700 font-bold hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                          title="ลบโปรโมชั่น"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-[#2F3E34]/40 bg-white border border-[#EAF2EC] rounded-2xl shadow-sm">
              <Gift className="w-12 h-12 mx-auto mb-2 text-[#8FB996] opacity-60" />
              <p className="text-sm font-semibold">ไม่มีแคมเปญจัดรายการสิทธิประโยชน์ตอนนี้</p>
            </div>
          )}

          {/* Pagination Controls for Promotions */}
          {totalPromoPages > 1 && (
            <div className="border-t border-[#EAF2EC] pt-4 flex items-center justify-between text-xs text-[#2F3E34]/60">
              <p>แสดง {(currentPagePromotions - 1) * itemsPerPage + 1} - {Math.min(currentPagePromotions * itemsPerPage, totalPromoItems)} จากทั้งหมด {totalPromoItems} โปรโมชั่น</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPagePromotions === 1}
                  onClick={() => setCurrentPagePromotions(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-[#2F3E34] px-2">หน้า {currentPagePromotions} / {totalPromoPages}</span>
                <button
                  type="button"
                  disabled={currentPagePromotions === totalPromoPages}
                  onClick={() => setCurrentPagePromotions(prev => Math.min(prev + 1, totalPromoPages))}
                  className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE/EDIT COUPON DIALOG */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-sm font-bold text-[#2F3E34] mb-4">
              {editingCoupon ? 'แก้ไขข้อมูลคูปองส่วนลด' : 'ออกคูปองส่วนลดใหม่'}
            </h3>

            <form onSubmit={handleCouponSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">รหัสคูปอง (Coupon Code)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น MOKULIFE10"
                  value={cpCode}
                  onChange={(e) => setCpCode(e.target.value)}
                  className="w-full text-xs font-bold font-mono tracking-wider bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] uppercase"
                  disabled={!!editingCoupon} // protect coupon code changes
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ชื่อแคมเปญ / รายละเอียดคูปอง</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สิทธิพิเศษเปิดร้านใหม่ Moku Onsen"
                  value={cpName}
                  onChange={(e) => setCpName(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">ประเภทส่วนลด</label>
                  <select
                    value={cpType}
                    onChange={(e) => setCpType(e.target.value as any)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  >
                    <option value="fixed">ลดจำนวนเงินบาท (฿)</option>
                    <option value="percent">ลดสัดส่วนตามเปอร์เซ็นต์ (%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">มูลค่าส่วนลด</label>
                  <input
                    type="number"
                    required
                    step="any"
                    min={0.01}
                    value={cpValue}
                    onChange={(e) => setCpValue(Number(e.target.value) || 0)}
                    className="w-full text-xs font-bold bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">ขั้นต่ำยอดใช้จ่ายท้ายบิล (บาท)</label>
                <input
                  type="number"
                  step="any"
                  min={0}
                  value={cpMinSpend}
                  onChange={(e) => setCpMinSpend(Number(e.target.value) || 0)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">วันหมดอายุของคูปอง</label>
                <input
                  type="date"
                  value={cpExpiry}
                  onChange={(e) => setCpExpiry(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#EAF2EC] mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCouponModal(false);
                    setEditingCoupon(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingCoupon ? 'บันทึกการแก้ไข' : 'ยืนยันออกรหัสคูปอง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE/EDIT PROMOTION DIALOG */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-sm font-bold text-[#2F3E34] mb-4">
              {editingPromotion ? 'แก้ไขแคมเปญโปรโมชั่น' : 'สร้างแคมเปญโปรโมชั่นใหม่'}
            </h3>

            <form onSubmit={handlePromoSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ชื่อแคมเปญ / สิทธิประโยชน์</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มะลิออยส์ซื้อ 1 แถม 1 เพื่อคนรักความสงบ"
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">ประเภทสิทธิ์การโปรโมต</label>
                <select
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value as any)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                >
                  <option value="bogo">ซื้อ 1 แถม 1 ชิ้นเป้าหมาย (BOGO)</option>
                  <option value="discount_percent">ลด % ทั้งบิลเมื่อจ่ายถึงเป้า</option>
                  <option value="discount_amount">ลดจำนวนเงิน (฿) ทั้งบิลเมื่อจ่ายถึงเป้า</option>
                  <option value="happy_hour">ช่วงเวลาพิเศษ (Happy Hour)</option>
                </select>
              </div>

              {promoType !== 'bogo' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">
                      {promoType === 'discount_percent' ? 'สัดส่วนลด (%)' : 'จำนวนเงินส่วนลด (฿)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0.01}
                      value={promoValue}
                      onChange={(e) => setPromoValue(Number(e.target.value) || 0)}
                      className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">ยอดซื้อขั้นต่ำ (บาท)</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={promoMinSpend}
                      onChange={(e) => setPromoMinSpend(Number(e.target.value) || 0)}
                      className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">วันเริ่มจัดรายการ</label>
                  <input
                    type="date"
                    value={promoStart}
                    onChange={(e) => setPromoStart(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">วันสิ้นสุดรายการ</label>
                  <input
                    type="date"
                    value={promoEnd}
                    onChange={(e) => setPromoEnd(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">รายละเอียดเพิ่มเติม</label>
                <textarea
                  placeholder="รายละเอียดแคมเปญสำหรับแสดงในรายการโปรโมชั่น..."
                  value={promoDescription}
                  onChange={(e) => setPromoDescription(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] h-16 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#EAF2EC] mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPromoModal(false);
                    setEditingPromotion(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingPromotion ? 'บันทึกการแก้ไข' : 'ยืนยันปล่อยแคมเปญ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG FOR COUPON DELETIONS */}
      {deleteCouponTargetId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-[#E57373] mb-3" />
            <h4 className="text-sm font-bold text-[#2F3E34] mb-1">ยืนยันการทำลายคูปอง?</h4>
            <p className="text-[10px] text-[#2F3E34]/60 mb-5 leading-relaxed">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ คูปองส่วนลดโค้ดนี้จะถูกระงับและลบออกจากระบบทันที
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteCouponTargetId(null)}
                className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteCouponTargetId) {
                    deleteCoupon(deleteCouponTargetId);
                    setDeleteCouponTargetId(null);
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

      {/* CUSTOM CONFIRMATION DIALOG FOR PROMOTION DELETIONS */}
      {deletePromoTargetId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-[#E57373] mb-3" />
            <h4 className="text-sm font-bold text-[#2F3E34] mb-1">ยืนยันการลบโปรโมชั่น?</h4>
            <p className="text-[10px] text-[#2F3E34]/60 mb-5 leading-relaxed">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ แคมเปญจัดสิทธิประโยชน์นี้จะถูกลบออกจากระบบถาวร
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeletePromoTargetId(null)}
                className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deletePromoTargetId) {
                    deletePromotion(deletePromoTargetId);
                    setDeletePromoTargetId(null);
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
