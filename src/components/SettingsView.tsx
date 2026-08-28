/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { StoreSettings, getProxyImage } from '../types';
import {
  Settings,
  UserCheck,
  RotateCcw,
  Receipt,
  FileText,
  Percent,
  RefreshCw,
  Layers,
  CircleAlert,
  Inbox,
  CreditCard,
  Upload,
  Trash2
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    users,
    currentUser,
    switchCurrentUser,
    resetDatabase,
    forceSync,
    auditLogs,
    showToast,
    githubConnected,
    lastSync
  } = useDb();

  // Form states initialized with database settings
  const [storeName, setStoreName] = useState(settings.store_name);
  const [storePhone, setStorePhone] = useState(settings.phone || '');
  const [storeTaxId, setStoreTaxId] = useState(settings.tax_id || '');
  const [storeAddress, setStoreAddress] = useState(settings.address || '');
  const [storeLogo, setStoreLogo] = useState(settings.logo || '');
  const [vatRate, setVatRate] = useState(settings.vat_rate);
  const [receiptHeader, setReceiptHeader] = useState(settings.receipt_header || '');
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer || '');
  const [bankName, setBankName] = useState(settings.bank_name || '');
  const [accountNo, setAccountNo] = useState(settings.account_no || '');
  const [accountName, setAccountName] = useState(settings.account_name || '');
  const [qrCodeUrl, setQrCodeUrl] = useState(settings.qr_code_url || '');

  // Synchronize local states when settings change (e.g. after loading from Firestore)
  React.useEffect(() => {
    setStoreName(settings.store_name);
    setStorePhone(settings.phone || '081-111-2222');
    setStoreTaxId(settings.tax_id || '');
    setStoreAddress(settings.address || '');
    setStoreLogo(settings.logo || '');
    setVatRate(settings.vat_rate);
    setReceiptHeader(settings.receipt_header || '');
    setReceiptFooter(settings.receipt_footer || '');
    setBankName(settings.bank_name || '');
    setAccountNo(settings.account_no || '');
    setAccountName(settings.account_name || '');
    setQrCodeUrl(settings.qr_code_url || '');
  }, [settings]);

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !storePhone.trim()) {
      showToast('⚠️ กรุณาระบุชื่อสปา และเบอร์โทรศัพท์ติดต่อของร้านค้า', 'warning');
      return;
    }

    const updatedSettings: StoreSettings = {
      ...settings,
      store_name: storeName,
      phone: storePhone,
      tax_id: storeTaxId,
      address: storeAddress,
      logo: storeLogo,
      vat_rate: Number(vatRate) || 0,
      receipt_header: receiptHeader,
      receipt_footer: receiptFooter,
      bank_name: bankName,
      account_no: accountNo,
      account_name: accountName,
      qr_code_url: qrCodeUrl
    };

    updateSettings(updatedSettings);
  };

  const handleResetDB = async () => {
    await resetDatabase();
  };

  return (
    <div className="space-y-6">
      
      {/* 3 Grid Column Layout: 2 cols for settings, 1 col for active user swapper and reset options */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: SHOP SETTINGS (2 cols wide) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-[#EAF2EC] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#2F3E34] flex items-center gap-2 pb-3.5 border-b border-[#EAF2EC] mb-5">
              <Settings className="w-4.5 h-4.5 text-[#8FB996]" />
              <span>การตั้งค่ารายละเอียดร้านค้าและการคำนวณภาษี (Store Settings)</span>
            </h3>

            <form onSubmit={handleSettingsSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ชื่อร้านค้า (Store Name)</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">เบอร์โทรศัพท์ติดต่อของร้าน</label>
                  <input
                    type="text"
                    required
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <input
                    type="text"
                    placeholder="เช่น 1234567890123"
                    value={storeTaxId}
                    onChange={(e) => setStoreTaxId(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">อัตราภาษีมูลค่าเพิ่ม VAT (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value) || 0)}
                      className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl pl-3 pr-10 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                    />
                    <div className="absolute right-3 top-2 text-xs font-mono text-gray-400 font-bold">%</div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ที่อยู่จดทะเบียนร้านค้า</label>
                  <textarea
                    rows={2}
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">URL รูปภาพโลโก้ร้าน (Store Logo Image URL)</label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="วาง URL รูปภาพที่นี่ หรือกดไอคอนขวาเพื่ออัปโหลด"
                        value={storeLogo}
                        onChange={(e) => setStoreLogo(e.target.value)}
                        className="flex-1 text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                      />
                      <div className="flex gap-1">
                        <label className="w-10 h-10 bg-[#8FB996] text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#8FB996]/90 shrink-0 shadow-sm transition-colors" title="อัปโหลดรูปภาพ">
                          <Upload className="w-4 h-4" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  showToast('❌ ขนาดไฟล์ต้องไม่เกิน 2MB', 'error');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => setStoreLogo(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {storeLogo && (
                          <button
                            onClick={() => setStoreLogo('')}
                            className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 shrink-0 transition-colors"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {storeLogo && (
                      <div className="w-10 h-10 rounded-xl border border-[#EAF2EC] bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                        <img 
                          src={getProxyImage(storeLogo)} 
                          alt="Logo Preview" 
                          className="max-w-full max-h-full object-contain" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Error';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAF2EC]">
                <h4 className="text-xs font-bold text-[#2F3E34] flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4 text-[#8FB996]" />
                  <span>การจัดรูปแบบหัวและท้ายบิลใบเสร็จ (Receipt Text)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-[#2F3E34]/55 font-semibold block mb-1">ข้อความหัวสลิปใบเสร็จ (Header)</label>
                    <input
                      type="text"
                      placeholder="เช่น ยินดีต้อนรับสู่ Moku Onsen"
                      value={receiptHeader}
                      onChange={(e) => setReceiptHeader(e.target.value)}
                      className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#2F3E34]/55 font-semibold block mb-1">ข้อความขอบคุณท้ายสลิปใบเสร็จ (Footer)</label>
                    <input
                      type="text"
                      placeholder="เช่น ขอบคุณที่มาอุดหนุน ขอให้ผ่อนคลาย"
                      value={receiptFooter}
                      onChange={(e) => setReceiptFooter(e.target.value)}
                      className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAF2EC]">
                <h4 className="text-xs font-bold text-[#2F3E34] flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-[#8FB996]" />
                  <span>ข้อมูลช่องทางการชำระเงินโอนบัญชี & QR Code (Payment Channel Settings)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-[#2F3E34]/55 font-semibold block mb-1">ชื่อธนาคาร / ช่องทางชำระเงิน (Bank / Payment Channel)</label>
                    <input
                      type="text"
                      placeholder="เช่น ธนาคารกสิกรไทย, พร้อมเพย์, โอนเงิน"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#2F3E34]/55 font-semibold block mb-1">เลขที่บัญชี / เบอร์โทรศัพท์ (Account Number / Phone)</label>
                    <input
                      type="text"
                      placeholder="เช่น 123-4-56789-0 หรือเบอร์โทรศัพท์พร้อมเพย์"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#2F3E34]/55 font-semibold block mb-1">ชื่อบัญชีผู้รับเงิน (Account Name)</label>
                    <input
                      type="text"
                      placeholder="เช่น บจก. โมกข์ ออนเซน แอนด์ อโรมา"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#2F3E34]/55 font-semibold block mb-1">URL รูปภาพ QR Code สำหรับสแกนจ่าย (QR Code Image URL)</label>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="วาง URL รูปภาพที่นี่ หรือกดไอคอนขวาเพื่ออัปโหลด"
                          value={qrCodeUrl}
                          onChange={(e) => setQrCodeUrl(e.target.value)}
                          className="flex-1 text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                        />
                        <div className="flex gap-1">
                          <label className="w-10 h-10 bg-[#8FB996] text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#8FB996]/90 shrink-0 shadow-sm transition-colors" title="อัปโหลด QR Code">
                            <Upload className="w-4 h-4" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    showToast('❌ ขนาดไฟล์ต้องไม่เกิน 2MB', 'error');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => setQrCodeUrl(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {qrCodeUrl && (
                            <button
                              onClick={() => setQrCodeUrl('')}
                              className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 shrink-0 transition-colors"
                              title="ลบ QR Code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {qrCodeUrl && (
                        <div className="w-10 h-10 rounded-xl border border-[#EAF2EC] bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                          <img 
                            src={getProxyImage(qrCodeUrl)} 
                            alt="QR Code Preview" 
                            className="max-w-full max-h-full object-contain" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Error';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8FB996] hover:bg-[#8FB996]/95 text-white text-xs font-bold shadow-md rounded-xl cursor-pointer"
              >
                บันทึกการตั้งค่าระบบร้านทั้งหมด
              </button>
            </form>
          </div>

          {/* Audit Logs block */}
          <div className="bg-white border border-[#EAF2EC] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#2F3E34] flex items-center gap-2 pb-2.5 border-b border-[#EAF2EC]">
              <FileText className="w-4.5 h-4.5 text-[#8FB996]" />
              <span>บันทึกการทำงานของระบบ (System Audit Logs)</span>
            </h3>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {auditLogs.length > 0 ? (
                auditLogs.map(log => (
                  <div key={log.id} className="p-2.5 bg-[#F8FAF7] rounded-xl border border-[#EAF2EC]/60 text-[11px] flex items-start gap-3">
                    <span className="text-[10px] bg-gray-100 text-[#2F3E34]/60 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                      {new Date(log.created_at).toLocaleTimeString('th-TH')}
                    </span>
                    <div className="flex-1">
                      <p className="text-[#2F3E34] font-medium leading-relaxed">{log.action}</p>
                      <p className="text-[9px] text-[#2F3E34]/40 mt-0.5 font-mono">ผู้ปฏิบัติการ: {log.user_fullname} | บันทึก ID: {log.id}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-300">
                  <Inbox className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <span>ไม่มีระบบบันทึกความปลอดภัยในขณะนี้</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SWITCH OPERATORS AND DB WIPE */}
        <div className="space-y-6">
          
          {/* Operator Swapper testing console */}
          <div className="glass-card border border-[#EAF2EC] rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-[#2F3E34] flex items-center gap-2 pb-1">
              <UserCheck className="w-4.5 h-4.5 text-[#8FB996]" />
              <span>เครื่องทดสอบผู้ปฏิบัติงานหน้าร้าน (Simulation Console)</span>
            </h4>
            <p className="text-[11px] text-[#2F3E34]/55 leading-relaxed">
              สลับผู้ใช้งานจริงของสปา เพื่อตรวจสอบว่าบทบาท (เช่น แคชเชียร์, พนักงานคลัง, นักบัญชี) ถูกจำกัดการเข้าถึงอย่างปลอดภัยจริงตามที่ตั้งค่าไว้
            </p>

            <div className="space-y-2 pt-2">
              {users.map(u => {
                const isActive = u.id === currentUser?.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchCurrentUser(u.id);
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#8FB996]/15 border-[#8FB996] text-[#2F3E34] font-semibold shadow-sm'
                        : 'bg-white border-[#EAF2EC] text-[#2F3E34]/70 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{u.fullname}</p>
                      <p className="text-[9px] text-[#2F3E34]/40 font-mono">บทบาท: {u.role.toUpperCase()}</p>
                    </div>
                    {isActive && (
                      <span className="text-[9px] bg-[#8FB996] text-white px-2 py-0.5 rounded-full font-bold">
                        เข้าสู่ระบบ
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cloud Synchronization card */}
          <div className="bg-white border border-[#EAF2EC] rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-[#2F3E34] flex items-center gap-2 pb-1 border-b border-[#EAF2EC]/50">
              <RefreshCw className="w-4.5 h-4.5 text-[#8FB996]" />
              <span>ซิงค์ข้อมูลกับระบบคลาวด์ (Cloud Sync)</span>
            </h4>
            <p className="text-[11px] text-[#2F3E34]/55 leading-relaxed">
              หากคุณพบว่าข้อมูลไม่ตรงกับเครื่องอื่น หรือข้อมูลที่แก้ไขหายไปหลังรีเฟรช คุณสามารถกดปุ่มนี้เพื่อดึงข้อมูลล่าสุดจากระบบ Cloud (Firebase) มาทับข้อมูลในเครื่องนี้ได้ทันที
            </p>
            <button
              onClick={() => forceSync()}
              className="w-full p-3 rounded-xl border border-[#8FB996] bg-[#8FB996]/5 text-[#2F3E34] text-xs font-bold hover:bg-[#8FB996]/10 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> <span>ดึงข้อมูลล่าสุดจาก Cloud (Force Cloud Sync)</span>
            </button>
          </div>

          {/* GitHub Integration card */}
          <div className="bg-white border border-[#EAF2EC] rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-[#2F3E34] flex items-center gap-2 pb-1 border-b border-[#EAF2EC]/50">
              <svg className="w-4.5 h-4.5 text-[#2F3E34]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              <span>เชื่อมต่อ GitHub เพื่อสำรองข้อมูล (GitHub Sync)</span>
            </h4>
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-[#2F3E34]/55 leading-relaxed">
                เชื่อมต่อกับบัญชี GitHub ของคุณเพื่อสำรองข้อมูลการขายและสต็อกสินค้าไปยัง Repository แบบอัตโนมัติ เพื่อความปลอดภัยของข้อมูลสูงสุด
              </p>
              {githubConnected && (
                <div className="shrink-0 text-right">
                  <div className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold border border-green-200">เชื่อมต่อแล้ว</div>
                  {lastSync && <div className="text-[9px] text-gray-400 mt-1">ล่าสุด: {new Date(lastSync).toLocaleDateString()}</div>}
                </div>
              )}
            </div>

            <button
              onClick={() => showToast('ระบบกำลังเตรียมการเชื่อมต่อ GitHub OAuth...', 'info')}
              className={`w-full p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-sm ${
                githubConnected 
                  ? 'bg-white border-[#EAF2EC] text-[#2F3E34] hover:bg-gray-50' 
                  : 'bg-[#2F3E34] border-[#2F3E34] text-white hover:bg-[#2F3E34]/90'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              <span>{githubConnected ? 'รีเฟรชการเชื่อมต่อ GitHub' : 'เชื่อมต่อ GitHub สำหรับสำรองข้อมูล'}</span>
            </button>
          </div>

          {/* System Wipe box */}
          <div className="bg-red-50/40 border border-red-100 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-red-700 flex items-center gap-2">
              <CircleAlert className="w-4.5 h-4.5 text-red-500" />
              <span>เขตอันตรายสำหรับผู้ดูแล (Danger Zone)</span>
            </h4>
            <p className="text-[11px] text-red-700/60 leading-relaxed">
              <strong>เตรียมความพร้อมใช้งานจริง:</strong> ล้างข้อมูลบิลขายทดสอบและสต็อกตัวอย่างทั้งหมดออก เพื่อเริ่มนับหนึ่งใหม่กับการใช้งานจริงในร้านของคุณ
            </p>

            <button
              onClick={handleResetDB}
              className="w-full py-2.5 bg-[#E57373] hover:bg-[#E57373]/95 text-white text-xs font-bold shadow-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> <span>ล้างข้อมูลระบบและเริ่มใหม่ (Production Reset)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
