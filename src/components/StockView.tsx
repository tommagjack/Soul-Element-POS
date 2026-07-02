/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Supplier, Product } from '../types';
import {
  Boxes,
  Plus,
  History,
  CornerDownRight,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  UserPlus,
  RefreshCw,
  Search,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export const StockView: React.FC = () => {
  const {
    products,
    suppliers,
    stockMovements,
    purchases,
    receivePurchase,
    adjustStock,
    addSupplier,
    editSupplier,
    deleteSupplier,
    showToast,
    currentUser
  } = useDb();

  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<'movements' | 'receive' | 'suppliers'>('movements');

  // Pagination & Deletions State
  const [currentPageMovements, setCurrentPageMovements] = useState(1);
  const [currentPageSuppliers, setCurrentPageSuppliers] = useState(1);
  const itemsPerPage = 20;
  const [deleteSupTargetId, setDeleteSupTargetId] = useState<string | null>(null);

  // Supplier Form Modals
  const [showSupModal, setShowSupModal] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Stock Adjustment Form states
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjProductId, setAdjProductId] = useState('');
  const [adjQty, setAdjQty] = useState(0);
  const [adjReason, setAdjReason] = useState('');
  const [adjType, setAdjType] = useState<'in' | 'out' | 'adjust'>('adjust');

  // Purchase Receipt (รับสินค้าเข้า) State
  const [recSupplierId, setRecSupplierId] = useState('');
  const [recItems, setRecItems] = useState<{ product_id: string; qty: number; cost_price: number }[]>([
    { product_id: '', qty: 10, cost_price: 100 }
  ]);

  // Open Supplier Form
  const handleOpenAddSup = () => {
    setEditingSup(null);
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setShowSupModal(true);
  };

  const handleOpenEditSup = (sup: Supplier) => {
    setEditingSup(sup);
    setSupName(sup.company_name);
    setSupContact(sup.contact_name);
    setSupPhone(sup.phone);
    setSupEmail(sup.email || '');
    setSupAddress(sup.address || '');
    setShowSupModal(true);
  };

  const handleSupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supContact.trim() || !supPhone.trim()) {
      showToast('⚠️ กรุณากรอกข้อมูลคู่ค้า (ชื่อ, ผู้ติดต่อ, โทรศัพท์) ให้ครบถ้วน', 'warning');
      return;
    }

    const payload = {
      company_name: supName,
      contact_name: supContact,
      phone: supPhone,
      email: supEmail,
      address: supAddress
    };

    if (editingSup) {
      editSupplier(editingSup.id, payload);
    } else {
      addSupplier(payload);
    }
    setShowSupModal(false);
  };

  // Adjust Stock Single Product submit
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId) {
      showToast('⚠️ กรุณาเลือกสินค้าสุขภาพที่ต้องการปรับสต็อก', 'warning');
      return;
    }
    if (adjQty === 0 && adjType !== 'adjust') {
      showToast('⚠️ จำนวนความเปลี่ยนแปลงในสต็อกต้องไม่ใช่ศูนย์', 'warning');
      return;
    }

    adjustStock(adjProductId, adjQty, adjReason || 'ปรับสต็อกโดยพนักงาน', adjType);
    setShowAdjustModal(false);
    setAdjProductId('');
    setAdjQty(0);
    setAdjReason('');
  };

  // Purchase Receipt Multi-items action
  const addRecItem = () => {
    setRecItems(prev => [...prev, { product_id: '', qty: 10, cost_price: 100 }]);
  };

  const removeRecItem = (idx: number) => {
    setRecItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRecItem = (idx: number, field: string, val: any) => {
    const updated = [...recItems];
    updated[idx] = { ...updated[idx], [field]: val };
    
    // Auto-fill cost price if product changes
    if (field === 'product_id') {
      const prod = products.find(p => p.id === val);
      if (prod) {
        updated[idx].cost_price = prod.cost_price;
      }
    }
    setRecItems(updated);
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recSupplierId) {
      showToast('⚠️ กรุณาระบุคู่ค้าผู้จัดส่งสินค้าให้ชัดเจน', 'warning');
      return;
    }
    const invalidItems = recItems.some(i => !i.product_id || i.qty <= 0 || i.cost_price < 0);
    if (invalidItems) {
      showToast('⚠️ ข้อมูลรายการรับเข้าไม่สมบูรณ์ (ต้องระบุสินค้า จำนวน และราคาทุนบวก)', 'warning');
      return;
    }

    receivePurchase(recSupplierId, recItems);
    
    // Reset form
    setRecSupplierId('');
    setRecItems([{ product_id: '', qty: 10, cost_price: 100 }]);
    setActiveSubTab('movements'); // return to history
  };

  // Sort and Paginated movements (Newest first)
  const sortedMovements = [...stockMovements].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
  const totalMovItems = sortedMovements.length;
  const totalMovPages = Math.ceil(totalMovItems / itemsPerPage) || 1;
  const paginatedMovements = sortedMovements.slice((currentPageMovements - 1) * itemsPerPage, currentPageMovements * itemsPerPage);

  // Sort and Paginated suppliers (Newest first)
  const sortedSuppliers = [...suppliers].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
  const totalSupItems = sortedSuppliers.length;
  const totalSupPages = Math.ceil(totalSupItems / itemsPerPage) || 1;
  const paginatedSuppliers = sortedSuppliers.slice((currentPageSuppliers - 1) * itemsPerPage, currentPageSuppliers * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Tab Switchers */}
      <div className="flex gap-2.5 shrink-0 border-b border-[#EAF2EC] pb-2">
        {[
          { id: 'movements', label: 'ความเคลื่อนไหวสต็อกล่าสุด', icon: History },
          { id: 'receive', label: 'รับสินค้าเข้าสต็อกใหม่', icon: Truck },
          { id: 'suppliers', label: 'จัดการข้อมูลผู้จัดจำหน่าย/คู่ค้า', icon: ClipboardList }
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

      {/* SUBTAB 1: MOVEMENTS HISTORY */}
      {activeSubTab === 'movements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#2F3E34]">บันทึกการเคลื่อนไหวสต็อกสินค้า (Stock Movements)</h3>
              <p className="text-xs text-[#2F3E34]/50">ประวัติเข้า-ออกและการปรับสต็อกโดยพนักงานคลังสินค้าอย่างละเอียด</p>
            </div>
            <button
              onClick={() => {
                setAdjProductId(products[0]?.id || '');
                setAdjQty(10);
                setAdjReason('ปรับสต็อกตามการตรวจสอบประจำปี');
                setAdjType('adjust');
                setShowAdjustModal(true);
              }}
              className="px-4 py-2.5 bg-[#8FB996]/10 text-[#8FB996] hover:bg-[#8FB996] hover:text-white transition-all rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> <span>ปรับยอดสต็อกด่วน</span>
            </button>
          </div>

          <div className="bg-white border border-[#EAF2EC] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAF7] border-b border-[#EAF2EC] text-[#2F3E34]/60 text-[11px] font-bold tracking-wider">
                    <th className="py-4 px-5">วันเวลาทำรายการ</th>
                    <th className="py-4 px-4">ชื่อสินค้าสุขภาพ</th>
                    <th className="py-4 px-4">ประเภทเคลื่อนไหว</th>
                    <th className="py-4 px-4">ปริมาณเปลี่ยนแปลง</th>
                    <th className="py-4 px-4">ยอดสต็อกหลังปรับ</th>
                    <th className="py-4 px-4">ผู้รับผิดชอบทำรายการ</th>
                    <th className="py-4 px-5">หมายเหตุ/สาเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2EC] text-xs">
                  {paginatedMovements.length > 0 ? (
                    paginatedMovements.map(move => {
                      const prod = products.find(p => p.id === move.product_id);
                      return (
                        <tr key={move.id} className="hover:bg-[#F8FAF7]/30 transition-all">
                          <td className="py-3 px-5 text-[#2F3E34]/50 font-mono">
                            {new Date(move.created_at).toLocaleString('th-TH')}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#2F3E34]">
                            {prod ? prod.name : 'สินค้าถูกลบ'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              move.type === 'in'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : move.type === 'out'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {move.type === 'in' ? 'นำเข้าสต็อก' : move.type === 'out' ? 'เบิกออก/ขาย' : 'ปรับยอดโดยตรง'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            {move.type === 'in' ? '+' : move.type === 'out' ? '-' : ''}
                            {move.qty} {prod?.unit || 'ชิ้น'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#2F3E34]/60">
                            {move.balance_qty} {prod?.unit || 'ชิ้น'}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#2F3E34]/70">
                            {move.user_fullname}
                          </td>
                          <td className="py-3 px-5 text-[#2F3E34]/50 leading-relaxed font-sans max-w-xs truncate">
                            {move.reason}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-[#2F3E34]/40">
                        <History className="w-12 h-12 mx-auto mb-2 text-[#8FB996] opacity-60" />
                        <p className="text-sm font-semibold">ไม่มีบันทึกประวัติความเคลื่อนไหวสต็อกในคลังขณะนี้</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalMovPages > 1 && (
              <div className="border-t border-[#EAF2EC] p-4 flex items-center justify-between text-xs text-[#2F3E34]/60 bg-white">
                <p>แสดง {(currentPageMovements - 1) * itemsPerPage + 1} - {Math.min(currentPageMovements * itemsPerPage, totalMovItems)} จากทั้งหมด {totalMovItems} รายการ</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPageMovements === 1}
                    onClick={() => setCurrentPageMovements(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-[#2F3E34] px-2">หน้า {currentPageMovements} / {totalMovPages}</span>
                  <button
                    type="button"
                    disabled={currentPageMovements === totalMovPages}
                    onClick={() => setCurrentPageMovements(prev => Math.min(prev + 1, totalMovPages))}
                    className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: PURCHASE RECEIVE (รับสินค้าเข้าสต็อกใหม่) */}
      {activeSubTab === 'receive' && (
        <div className="bg-white border border-[#EAF2EC] rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#2F3E34]">ใบจัดซื้อและนำของเข้าสต็อก (Purchase Receipt Form)</h3>
            <p className="text-xs text-[#2F3E34]/50">เมื่อนำสินค้าสุขภาพมาลงสต็อกเพิ่ม กรุณากรอกรายละเอียดเพื่อบันทึกต้นทุนรายจ่ายของร้านโดยอัตโนมัติ</p>
          </div>

          <form onSubmit={handlePurchaseSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">เลือกผู้ผลิต / คู่ค้าผู้จัดส่งสินค้า</label>
                <select
                  required
                  value={recSupplierId}
                  onChange={(e) => setRecSupplierId(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] font-medium focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                >
                  <option value="">-- กรุณาเลือกคู่ค้าส่งสินค้า --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.company_name} ({s.contact_name})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product lists receive fields */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#F8FAF7]">
                <h4 className="text-xs font-bold text-[#2F3E34]">รายการผลิตภัณฑ์ที่ต้องการนำเข้าสต็อก</h4>
                <button
                  type="button"
                  onClick={addRecItem}
                  className="text-xs text-[#8FB996] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>เพิ่มสินค้าเข้าไปในแถว</span>
                </button>
              </div>

              {recItems.map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-end gap-3 p-4 rounded-xl bg-[#F8FAF7] border border-[#EAF2EC] relative">
                  <div className="flex-1 w-full">
                    <label className="text-[9px] text-[#2F3E34]/40 font-bold uppercase block mb-0.5">เลือกผลิตภัณฑ์สุขภาพ</label>
                    <select
                      required
                      value={item.product_id}
                      onChange={(e) => updateRecItem(idx, 'product_id', e.target.value)}
                      className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-1.5 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                    >
                      <option value="">-- กรุณาเลือกสินค้าสุขภาพ --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (คงเหลือ: {p.stock_qty} {p.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full md:w-32">
                    <label className="text-[9px] text-[#2F3E34]/40 font-bold block mb-0.5">จำนวนรับเข้า</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateRecItem(idx, 'qty', Number(e.target.value) || 0)}
                      className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                    />
                  </div>

                  <div className="w-full md:w-36">
                    <label className="text-[9px] text-[#2F3E34]/40 font-bold block mb-0.5">ราคาทุนใหม่ต่อชิ้น (บาท)</label>
                    <input
                      type="number"
                      required
                      step="any"
                      min={0}
                      value={item.cost_price}
                      onChange={(e) => updateRecItem(idx, 'cost_price', Number(e.target.value) || 0)}
                      className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                    />
                  </div>

                  {recItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecItem(idx)}
                      className="p-2 text-[#E57373] hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total value block */}
            <div className="pt-4 border-t border-[#EAF2EC] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <p className="text-[10px] text-[#2F3E34]/50 uppercase font-semibold">มูลค่าต้นทุนซื้อสินค้าคลังสุทธิ</p>
                <h4 className="text-xl font-bold font-mono text-[#2F3E34]">
                  ฿{recItems.reduce((sum, item) => sum + (item.qty * item.cost_price), 0).toLocaleString()} บาท
                </h4>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setRecItems([{ product_id: '', qty: 10, cost_price: 100 }]);
                    setActiveSubTab('movements');
                  }}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิกทำรายการ
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  ยืนยันตรวจรับสินค้าเข้าสต็อก
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: SUPPLIERS DIRECTORY */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#2F3E34]">ผู้ผลิตและพันธมิตรจัดส่งสินค้าสุขภาพ (Suppliers Catalogue)</h3>
              <p className="text-xs text-[#2F3E34]/50">เชื่อมโยงและบริหารข้อมูลพาร์ทเนอร์ ผู้จัดส่งน้ำมันหอม ใบชา และสินค้าเทียนธรรมชาติ</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddSup}
              className="px-4 py-2.5 bg-[#8FB996] hover:bg-[#8FB996]/95 text-white transition-all rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> <span>ลงทะเบียนคู่ค้าใหม่</span>
            </button>
          </div>

          {paginatedSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedSuppliers.map(sup => (
                <div key={sup.id} className="glass-card border border-[#EAF2EC] rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#8FB996]/10 text-[#8FB996] flex items-center justify-center shrink-0">
                        <Truck className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#2F3E34] line-clamp-1">{sup.company_name}</h4>
                        <p className="text-[10px] text-[#2F3E34]/55 font-semibold">ผู้ติดต่อ: {sup.contact_name}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-[#2F3E34]/60 pt-2 border-t border-[#EAF2EC]/50 font-mono">
                      <p className="flex justify-between"><span>โทรศัพท์:</span> <span className="font-sans font-semibold text-[#2F3E34]">{sup.phone}</span></p>
                      <p className="flex justify-between"><span>อีเมล:</span> <span className="text-right truncate max-w-[150px]">{sup.email || '-'}</span></p>
                      <p className="flex flex-col text-left mt-1 pt-1 font-sans">
                        <span className="text-[9px] font-bold text-[#2F3E34]/40 uppercase">ที่อยู่สำนักงาน</span>
                        <span className="text-[11px] mt-0.5 text-[#2F3E34]/75 leading-relaxed line-clamp-2">{sup.address || '-'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-[#EAF2EC]/30">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSup(sup)}
                      className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 text-[#2F3E34]/70 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-[#EAF2EC] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> <span>แก้ไขคู่ค้า</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteSupTargetId(sup.id)}
                      className="py-1.5 px-3 bg-red-50 hover:bg-red-100/70 text-red-600 rounded-lg text-xs cursor-pointer inline-flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#EAF2EC] rounded-2xl p-12 text-center text-[#2F3E34]/40">
              <Truck className="w-12 h-12 mx-auto mb-2 text-[#8FB996] opacity-60" />
              <p className="text-sm font-semibold">ไม่พบข้อมูลรายชื่อคู่ค้าแสดงในระบบ</p>
            </div>
          )}

          {/* Pagination controls for suppliers */}
          {totalSupPages > 1 && (
            <div className="border-t border-[#EAF2EC] pt-4 flex items-center justify-between text-xs text-[#2F3E34]/60">
              <p>แสดง {(currentPageSuppliers - 1) * itemsPerPage + 1} - {Math.min(currentPageSuppliers * itemsPerPage, totalSupItems)} จากทั้งหมด {totalSupItems} รายการ</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPageSuppliers === 1}
                  onClick={() => setCurrentPageSuppliers(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-[#2F3E34] px-2">หน้า {currentPageSuppliers} / {totalSupPages}</span>
                <button
                  type="button"
                  disabled={currentPageSuppliers === totalSupPages}
                  onClick={() => setCurrentPageSuppliers(prev => Math.min(prev + 1, totalSupPages))}
                  className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: SUPPLIER ADD/EDIT FORM */}
      {showSupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-sm font-bold text-[#2F3E34] mb-4">
              {editingSup ? 'แก้ไขข้อมูลผู้จัดจำหน่าย/คู่ค้า' : 'ลงทะเบียนผู้ผลิตสินค้าใหม่'}
            </h3>

            <form onSubmit={handleSupSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ชื่อบริษัท / ร้านค้าผู้ผลิต</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บริษัท สยามสปาเอสเซนเชียล จำกัด"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ชื่อผู้ติดต่อประสานงาน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คุณกมลชัย ชัยดี"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    required
                    placeholder="081-XXX-XXXX"
                    value={supPhone}
                    onChange={(e) => setFormPhoneCheck(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">อีเมลติดต่อ (Email)</label>
                  <input
                    type="email"
                    placeholder="partner@example.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ที่อยู่จดทะเบียนสำนักงาน</label>
                <textarea
                  rows={2}
                  placeholder="ระบุที่อยู่พร้อมจัดส่งบิลภาษี..."
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#EAF2EC] mt-6">
                <button
                  type="button"
                  onClick={() => setShowSupModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingSup ? 'บันทึกการปรับปรุง' : 'ยืนยันจดทะเบียนคู่ค้า'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK ADJUSTMENT SINGLE FORM */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-sm font-bold text-[#2F3E34] mb-4">ปรับยอดสินค้าสุขภาพในสต็อกชั่วคราว</h3>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">เลือกผลิตภัณฑ์ที่ปรับยอด</label>
                <select
                  required
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (คงเหลือ: {p.stock_qty} {p.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ลักษณะปรับสต็อก</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  >
                    <option value="adjust">ตั้งค่าใหม่ทั้งหมด (Direct Set)</option>
                    <option value="in">นำเข้าเพิ่ม (+ Add)</option>
                    <option value="out">เบิกของออก (- Subtract)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">จำนวนหน่วย (ชิ้น/ขวด)</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={adjQty}
                    onChange={(e) => setAdjQty(Number(e.target.value) || 0)}
                    className="w-full text-xs font-bold font-mono text-center bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ระบุเหตุผลกำกับการลบ/แก้ไข</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ตรวจนับสินค้าหายเสียหาย, นำไปแจกลูกค้าวีไอพี"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#EAF2EC] mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  ยืนยันอัปเดตยอดสต็อก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG FOR SUPPLIER DELETIONS */}
      {deleteSupTargetId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-[#E57373] mb-3" />
            <h4 className="text-sm font-bold text-[#2F3E34] mb-1">ยืนยันการลบรายชื่อคู่ค้า?</h4>
            <p className="text-[10px] text-[#2F3E34]/60 mb-5 leading-relaxed">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ รายชื่อพาร์ทเนอร์จัดจำหน่ายคู่ค้านี้จะถูกนำออกจากระบบถาวร
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteSupTargetId(null)}
                className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteSupTargetId) {
                    deleteSupplier(deleteSupTargetId);
                    setDeleteSupTargetId(null);
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

  // Helper setter to avoid phone code typos
  function setFormPhoneCheck(val: string) {
    setSupPhone(val);
  }
};
