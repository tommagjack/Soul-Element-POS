/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useDb } from '../context/DbContext';
import { IncomeExpense } from '../types';
import * as XLSX from 'xlsx';
import {
  Wallet,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Inbox,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  Upload,
  Image,
  AlertCircle
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const {
    financials,
    addFinancialRecord,
    addMultipleFinancialRecords,
    deleteFinancialRecord,
    editFinancialRecord,
    showToast
  } = useDb();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Dialog state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFin, setEditingFin] = useState<IncomeExpense | null>(null);
  const [deleteFinTargetId, setDeleteFinTargetId] = useState<string | null>(null);

  const [finType, setFinType] = useState<'income' | 'expense'>('expense');
  const [finCategory, setFinCategory] = useState('ค่าเช่า');
  const [finAmount, setFinAmount] = useState<number>(0);
  const [finDesc, setFinDesc] = useState('');
  const [finImage, setFinImage] = useState('');
  const [finDate, setFinDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Financial categorizations
  const categoriesMap = {
    income: ['รายได้ค่าบริการสปา', 'รายรับจากการจัดงานสุขภาพ', 'ดอกเบี้ยเงินฝาก', 'อื่นๆ'],
    expense: ['ค่าเช่าที่ตั้งร้าน', 'ค่าน้ำประปา', 'ค่าไฟฟ้าส่วนรวม', 'ค่าขนส่งและไปรษณีย์', 'เงินเดือนและสวัสดิการ', 'ซื้อสินค้าคลังสุขภาพ', 'ค่าซ่อมบำรุง', 'อื่นๆ']
  };

  // Switch categories when type changes
  const handleTypeChange = (type: 'income' | 'expense') => {
    setFinType(type);
    setFinCategory(categoriesMap[type][0]);
  };

  const handleOpenEditFin = (fin: IncomeExpense) => {
    setEditingFin(fin);
    setFinType(fin.type);
    setFinCategory(fin.category);
    setFinAmount(fin.amount);
    setFinDesc(fin.description);
    setFinImage(fin.ref_image || '');
    setFinDate(new Date(fin.created_at).toISOString().split('T')[0]);
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingFin(null);
    setFinAmount(0);
    setFinDesc('');
    setFinImage('');
    setFinDate(new Date().toISOString().split('T')[0]);
  };

  const handleFinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finAmount <= 0) {
      showToast('⚠️ จำนวนเงินสะสมต้องมากกว่าศูนย์', 'warning');
      return;
    }
    if (!finDesc.trim()) {
      showToast('⚠️ กรุณาระบุคำอธิบายสั้นๆ ของใบเสร็จนี้', 'warning');
      return;
    }

    const payload = {
      type: finType,
      category: finCategory,
      amount: Number(finAmount) || 0,
      description: finDesc,
      ref_image: finImage || undefined,
      created_at: finDate ? new Date(finDate).toISOString() : new Date().toISOString()
    };

    if (editingFin) {
      editFinancialRecord(editingFin.id, payload);
    } else {
      addFinancialRecord(payload);
    }
    setShowFormModal(false);
    
    // Reset fields
    setEditingFin(null);
    setFinAmount(0);
    setFinDesc('');
    setFinImage('');
    setFinDate(new Date().toISOString().split('T')[0]);
  };

  const handleExportExcel = () => {
    try {
      if (financials.length === 0) {
        showToast('⚠️ ไม่มีข้อมูลรายรับ-รายจ่ายที่จะส่งออก', 'warning');
        return;
      }
      
      const exportData = financials.map((f, idx) => ({
        'ลำดับ': financials.length - idx,
        'วันเวลาบันทึก': new Date(f.created_at).toLocaleString('th-TH'),
        'ประเภท': f.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        'หมวดหมู่': f.category,
        'จำนวนเงิน (บาท)': f.amount,
        'คำอธิบาย': f.description,
        'ผู้ลงบันทึก': f.user_fullname
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [
        { wch: 8 },  // ลำดับ
        { wch: 22 }, // วันเวลาบันทึก
        { wch: 12 }, // ประเภท
        { wch: 20 }, // หมวดหมู่
        { wch: 18 }, // จำนวนเงิน
        { wch: 35 }, // คำอธิบาย
        { wch: 20 }  // ผู้ลงบันทึก
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "สมุดรายรับรายจ่าย");
      
      XLSX.writeFile(wb, `รายงานรายรับรายจ่าย_${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}.xlsx`);
      showToast('📊 ส่งออกรายงานรายรับ-รายจ่าย Excel สำเร็จ', 'success');
    } catch (err) {
      console.error(err);
      showToast('❌ เกิดข้อผิดพลาดในการส่งออก Excel', 'error');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          'ประเภท': 'รายรับ',
          'หมวดหมู่': 'รายได้ค่าบริการสปา',
          'จำนวนเงิน (บาท)': 1500,
          'คำอธิบาย': 'ลูกค้าเข้าใช้บริการสปานวดอโรมา 2 ชั่วโมง'
        },
        {
          'ประเภท': 'รายจ่าย',
          'หมวดหมู่': 'ค่าน้ำประปา',
          'จำนวนเงิน (บาท)': 350,
          'คำอธิบาย': 'ค่าน้ำประปาประจำสัปดาห์แรกของเดือน'
        },
        {
          'ประเภท': 'รายจ่าย',
          'หมวดหมู่': 'ค่าซ่อมบำรุง',
          'จำนวนเงิน (บาท)': 1200,
          'คำอธิบาย': 'ชำระค่าซ่อมก๊อกน้ำห้องน้ำชั้นสอง'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const colWidths = [
        { wch: 15 }, // ประเภท
        { wch: 25 }, // หมวดหมู่
        { wch: 20 }, // จำนวนเงิน
        { wch: 45 }  // คำอธิบาย
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template_รายรับรายจ่าย");
      
      XLSX.writeFile(wb, "เทมเพลต_นำเข้ารายรับรายจ่าย.xlsx");
      showToast('📥 ดาวน์โหลดเทมเพลต Excel เรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.error(err);
      showToast('❌ เกิดข้อผิดพลาดในการดาวน์โหลดเทมเพลต', 'error');
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        if (!evt.target || !evt.target.result) {
          showToast('❌ ไม่สามารถอ่านข้อมูลไฟล์ได้', 'error');
          return;
        }
        
        const data = new Uint8Array(evt.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          showToast('⚠️ ไฟล์ Excel ไม่มีแผ่นงาน (Worksheet)', 'warning');
          return;
        }
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json(worksheet);
        
        if (rawRows.length === 0) {
          showToast('⚠️ ไฟล์ Excel ไม่มีแถวข้อมูลใดๆ', 'warning');
          return;
        }
        
        const parsedRecords: Omit<IncomeExpense, 'id' | 'created_at' | 'user_fullname'>[] = [];
        let skippedCount = 0;
        
        rawRows.forEach((row: any) => {
          const typeStr = row['ประเภท'] || row['type'] || row['Type'] || '';
          const categoryStr = row['หมวดหมู่'] || row['category'] || row['Category'] || '';
          const amountVal = row['จำนวนเงิน (บาท)'] || row['จำนวนเงิน'] || row['amount'] || row['Amount'];
          const descriptionStr = row['คำอธิบาย'] || row['รายละเอียด'] || row['description'] || row['Description'] || '';
          
          const category = categoryStr ? categoryStr.toString().trim() : 'อื่นๆ';
          const description = descriptionStr ? descriptionStr.toString().trim() : '';
          
          let type: 'income' | 'expense' = 'expense';
          if (typeStr) {
            const typeLower = typeStr.toString().toLowerCase().trim();
            if (typeLower === 'income' || typeLower === 'รายรับ' || typeLower === 'รับ' || typeLower === 'inflow') {
              type = 'income';
            } else if (typeLower === 'expense' || typeLower === 'รายจ่าย' || typeLower === 'จ่าย' || typeLower === 'outflow') {
              type = 'expense';
            }
          }
          
          let amount = 0;
          if (amountVal !== undefined && amountVal !== null) {
            if (typeof amountVal === 'number') {
              amount = amountVal;
            } else {
              const cleanNum = amountVal.toString().replace(/[^0-9.-]/g, '');
              amount = parseFloat(cleanNum) || 0;
            }
          }
          
          if (amount > 0) {
            parsedRecords.push({
              type,
              category,
              amount,
              description
            });
          } else {
            skippedCount++;
          }
        });
        
        if (parsedRecords.length === 0) {
          showToast('⚠️ ไม่พบรายการที่สมบูรณ์ (ต้องระบุประเภท หมวดหมู่ และจำนวนเงิน > 0)', 'warning');
        } else {
          addMultipleFinancialRecords(parsedRecords);
          if (skippedCount > 0) {
            showToast(`⚠️ นำเข้าสำเร็จ ${parsedRecords.length} รายการ (ข้ามแถวที่ไม่สมบูรณ์ ${skippedCount} แถว)`, 'warning', 6000);
          }
        }
      } catch (err) {
        console.error(err);
        showToast('❌ รูปแบบไฟล์ไม่ถูกต้องหรือระบบขัดข้องในการอ่านไฟล์', 'error');
      } finally {
        e.target.value = '';
      }
    };
    
    reader.onerror = () => {
      showToast('❌ ไม่สามารถเปิดไฟล์นี้ได้', 'error');
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Calculated stats
  const totalInflows = financials.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalOutflows = financials.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const netProfit = totalInflows - totalOutflows;

  // Sorting & Pagination calculation
  const sortedFinancials = [...financials].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const totalItems = sortedFinancials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedFinancials = sortedFinancials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card rounded-xl p-5 border border-[#EAF2EC] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#2F3E34]/55 uppercase tracking-wider">รายรับสะสมรวม (Inflows)</p>
            <h3 className="text-xl font-bold text-[#6CBF84] mt-1 font-mono">฿{totalInflows.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#6CBF84]/15 text-[#6CBF84] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-[#EAF2EC] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#2F3E34]/55 uppercase tracking-wider">รายจ่ายดำเนินการรวม (Outflows)</p>
            <h3 className="text-xl font-bold text-[#E57373] mt-1 font-mono">฿{totalOutflows.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E57373]/15 text-[#E57373] flex items-center justify-center shrink-0">
            <TrendingDown className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-[#EAF2EC] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#2F3E34]/55 uppercase tracking-wider">กำไรดำเนินการสุทธิ</p>
            <h3 className={`text-xl font-black mt-1 font-mono ${netProfit >= 0 ? 'text-[#8FB996]' : 'text-[#E57373]'}`}>
              ฿{netProfit.toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#8FB996]/15 text-[#8FB996] flex items-center justify-center shrink-0">
            <Wallet className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Control row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#2F3E34]">สมุดบัญชีรายรับ-รายจ่ายของร้านค้า (Financial Journal)</h3>
          <p className="text-xs text-[#2F3E34]/50">ลงบันทึกบัญชีรายจ่ายอื่นๆ นอกเหนือจากยอดขายหน้าร้านโดยตรงอย่างเป็นสากล</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Hidden File Input for Excel Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx, .xls"
            className="hidden"
          />

          <button
            onClick={() => {
              handleTypeChange('expense');
              setShowFormModal(true);
            }}
            className="px-3.5 py-2.5 bg-[#8FB996] hover:bg-[#8FB996]/95 text-white transition-all rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> <span>ลงบันทึกใหม่</span>
          </button>
          
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-white border border-[#EAF2EC] hover:bg-gray-50 text-[#2F3E34]/80 transition-all rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="ส่งออกสมุดรายรับ-รายจ่ายเป็นไฟล์ Excel (.xlsx) รองรับภาษาไทยสมบูรณ์"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> <span>ส่งออก Excel</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 bg-white border border-[#EAF2EC] hover:bg-gray-50 text-[#2F3E34]/80 transition-all rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="นำเข้าข้อมูลจากไฟล์ Excel (.xlsx) และสแกนคอลัมน์ภาษาไทยอัตโนมัติ"
          >
            <Upload className="w-4 h-4 text-blue-500" /> <span>นำเข้า Excel</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2.5 bg-white border border-[#EAF2EC] hover:bg-gray-50 text-[#2F3E34]/60 transition-all rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="ดาวน์โหลดเทมเพลตไฟล์ Excel สำหรับป้อนข้อมูลภาษาไทย"
          >
            <Download className="w-4 h-4 text-gray-400" /> <span>ดาวน์โหลดเทมเพลต</span>
          </button>
        </div>
      </div>

      {/* Financial records list table */}
      <div className="bg-white border border-[#EAF2EC] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAF7] border-b border-[#EAF2EC] text-[#2F3E34]/60 text-[11px] font-bold tracking-wider">
                <th className="py-4 px-5">วันเวลาลงบัญชี</th>
                <th className="py-4 px-4">หมวดหมู่รายการ</th>
                <th className="py-4 px-4">ประเภทบัญชี</th>
                <th className="py-4 px-4">จำนวนเงิน</th>
                <th className="py-4 px-4">คำอธิบายประกอบใบเสร็จ</th>
                <th className="py-4 px-4">เอกสารอ้างอิง/บิลแนบ</th>
                <th className="py-4 px-5 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2EC] text-xs">
              {paginatedFinancials.length > 0 ? (
                paginatedFinancials.map(fin => (
                  <tr key={fin.id} className="hover:bg-[#F8FAF7]/30 transition-all">
                    <td className="py-3 px-5 text-[#2F3E34]/50 font-mono">
                      {new Date(fin.created_at).toLocaleString('th-TH')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2F3E34]">
                      {fin.category}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        fin.type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {fin.type === 'income' ? 'รายรับ (Inflow)' : 'รายจ่าย (Outflow)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm">
                      <span className={fin.type === 'income' ? 'text-[#6CBF84]' : 'text-[#E57373]'}>
                        {fin.type === 'income' ? '+' : '-'}฿{fin.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#2F3E34]/70 font-sans max-w-xs truncate" title={fin.description}>
                      {fin.description}
                    </td>
                    <td className="py-3 px-4">
                      {fin.ref_image ? (
                        <button
                          type="button"
                          onClick={() => {
                            showToast('🖼 แสดงตัวอย่างบิลแนบขนาดใหญ่เรียบร้อย', 'info');
                          }}
                          className="text-[10px] text-[#8FB996] font-semibold hover:underline flex items-center gap-1.5"
                        >
                          <Image className="w-3.5 h-3.5" /> <span>ดูรูปภาพบิลแนบ</span>
                        </button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right space-x-1.5">
                      {fin.category !== 'รายรับจากการขาย' && fin.category !== 'ซื้อสินค้า' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditFin(fin)}
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-[#2F3E34]/60 transition-colors inline-flex cursor-pointer"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteFinTargetId(fin.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors inline-flex cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-semibold italic">สร้างโดยระบบ</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#2F3E34]/40">
                    <Inbox className="w-12 h-12 mx-auto mb-2 text-[#8FB996] opacity-60" />
                    <p className="text-sm font-semibold">ไม่มีข้อมูลสมุดบันทึกรายรับรายจ่ายสะสม</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="bg-[#F8FAF7]/40 border-t border-[#EAF2EC] px-5 py-4 flex items-center justify-between text-xs text-[#2F3E34]/60">
            <p>แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} จากทั้งหมด {totalItems} รายการ</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-[#2F3E34] px-2">หน้า {currentPage} / {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL FOR ADDING/EDITING RECORD */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-sm font-bold text-[#2F3E34] mb-4">
              {editingFin ? 'แก้ไขข้อมูลสมุดรายรับ-รายจ่าย' : 'ลงบันทึกสมุดรายรับ-รายจ่าย'}
            </h3>

            <form onSubmit={handleFinSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`py-2 rounded-xl border font-bold text-xs ${
                    finType === 'income' ? 'bg-[#8FB996]/10 border-[#8FB996] text-[#8FB996]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  รายรับ (Income)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`py-2 rounded-xl border font-bold text-xs ${
                    finType === 'expense' ? 'bg-[#E57373]/10 border-[#E57373] text-[#E57373]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  รายจ่าย (Expense)
                </button>
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">วันที่รายการ (Date)</label>
                <input
                  type="date"
                  required
                  value={finDate}
                  onChange={(e) => setFinDate(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">หมวดหมู่บัญชี</label>
                <select
                  value={finCategory}
                  onChange={(e) => setFinCategory(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                >
                  {categoriesMap[finType].map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  required
                  step="any"
                  min={0.01}
                  placeholder="0.00"
                  value={finAmount || ''}
                  onChange={(e) => setFinAmount(Number(e.target.value) || 0)}
                  className="w-full text-base font-bold font-mono text-center bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">คำอธิบายเพิ่มเติม / ความจำเป็น</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ชำระค่าไฟฟ้าประจำเดือนมิถุนายน"
                  value={finDesc}
                  onChange={(e) => setFinDesc(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">แนบรูปถ่ายใบเสร็จ / บิลจริง (จำลอง URL)</label>
                <input
                  type="text"
                  placeholder="ป้อน URL บิล (ถ้ามี)"
                  value={finImage}
                  onChange={(e) => setFinImage(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#EAF2EC] mt-6">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingFin ? 'บันทึกแก้ไขบัญชี' : 'บันทึกลงบัญชีสำเร็จ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: STANDARD RELIABLE POPUP ON DELETIONS */}
      {deleteFinTargetId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-[#E57373] mb-3" />
            <h4 className="text-sm font-bold text-[#2F3E34] mb-1">ยืนยันการลบรายการบัญชีนี้?</h4>
            <p className="text-[10px] text-[#2F3E34]/60 mb-5 leading-relaxed">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลบันทึกรายการทางบัญชีที่เลือกจะถูกลบออกถาวร
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteFinTargetId(null)}
                className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteFinTargetId) {
                    deleteFinancialRecord(deleteFinTargetId);
                    setDeleteFinTargetId(null);
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
