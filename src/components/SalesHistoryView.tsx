import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Sale, SaleItem, Customer, Product } from '../types';
import {
  Search,
  Clock,
  User,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  Printer,
  Edit3,
  Trash2,
  Calendar,
  X,
  Check,
  Plus,
  Minus,
  Info,
  Tag,
  Receipt,
  Download,
  RefreshCw
} from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const {
    sales,
    customers,
    products,
    settings,
    currentUser,
    deleteSale,
    editSale,
    showToast,
    forceSync
  } = useDb();

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await forceSync();
    } catch (err) {
      showToast('❌ ไม่สามารถซิงค์ข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Selected Sale for Details Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Selected Sale for Delete Confirm Modal
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected Sale for Edit Modal
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'promptpay' | 'transfer' | 'credit' | 'wallet'>('cash');
  const [editItems, setEditItems] = useState<SaleItem[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editDiscountVal, setEditDiscountVal] = useState<number>(0);
  const [editDiscountType, setEditDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [editReceivedAmount, setEditReceivedAmount] = useState<number>(0);

  // Helper: Find Customer Name
  const getCustomerName = (custId?: string) => {
    if (!custId) return 'ลูกค้าทั่วไป (Walk-in)';
    const cust = customers.find(c => c.id === custId);
    return cust ? cust.fullname : 'ไม่พบข้อมูลลูกค้า';
  };

  // Helper: Payment Method Localization
  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'เงินสด (Cash)';
      case 'promptpay': return 'พร้อมเพย์ (PromptPay)';
      case 'transfer': return 'โอนเงิน (Transfer)';
      case 'credit': return 'บัตรเครดิต (Credit Card)';
      case 'wallet': return 'ทรูมันนี่ (TrueWallet)';
      default: return method;
    }
  };

  const getPaymentBadgeClass = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-[#6CBF84]/10 text-[#6CBF84] border-[#6CBF84]/20';
      case 'promptpay': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'transfer': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'credit': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'wallet': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  // Filter & Sort Sales (Newest first)
  const filteredSales = [...(sales || [])]
    .filter(sale => {
      if (!sale) return false;
      
      // Search by Sale ID or Customer name
      const custName = getCustomerName(sale.customer_id).toLowerCase();
      const safeId = (sale.id || "").toLowerCase();
      const safeNotes = (sale.notes || "").toLowerCase();
      const safeUser = (sale.user_fullname || "").toLowerCase();
      const safeCreatedAt = sale.created_at || "";

      const matchesSearch =
        safeId.includes(searchQuery.toLowerCase()) ||
        custName.includes(searchQuery.toLowerCase()) ||
        safeNotes.includes(searchQuery.toLowerCase()) ||
        safeUser.includes(searchQuery.toLowerCase());

      // Filter by Payment Method
      const matchesPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter;

      // Filter by Date (YYYY-MM-DD match with sale.created_at ISO string)
      const matchesDate = !dateFilter || safeCreatedAt.startsWith(dateFilter);

      return matchesSearch && matchesPayment && matchesDate;
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

  // Pagination Calculations
  const totalItems = filteredSales.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Re-run Pagination guards if out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // View Receipt Handler
  const handleOpenDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  };

  // Delete Handler
  const handleOpenDelete = (sale: Sale) => {
    setSaleToDelete(sale);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (saleToDelete) {
      deleteSale(saleToDelete.id);
      setShowDeleteModal(false);
      setSaleToDelete(null);
    }
  };

  // Edit Sale Handlers
  const handleOpenEdit = (sale: Sale) => {
    setEditingSale(sale);
    setEditCustomerId(sale.customer_id || '');
    setEditPaymentMethod(sale.payment_method);
    setEditItems([...sale.items]);
    setEditNotes(sale.notes || '');
    setEditReceivedAmount(sale.received_amount || 0);
    // Deduce custom manual discount from old fields if any
    setEditDiscountVal(sale.discount_amount || 0);
    setEditDiscountType('fixed');
    setShowEditModal(true);
  };

  const handleUpdateQty = (pId: string, delta: number) => {
    setEditItems(prev => {
      return prev.map(item => {
        if (item.product_id === pId) {
          const newQty = Math.max(1, item.qty + delta);
          return {
            ...item,
            qty: newQty,
            total: newQty * item.price - item.discount
          };
        }
        return item;
      });
    });
  };

  const handleRemoveItem = (pId: string) => {
    if (editItems.length <= 1) {
      showToast('⚠️ ต้องมีสินค้าเหลืออย่างน้อย 1 รายการในการแก้ไข หากไม่มีสินค้ากรุณาใช้ฟังก์ชัน "ลบบิล"', 'warning');
      return;
    }
    setEditItems(prev => prev.filter(item => item.product_id !== pId));
  };

  const handleAddProductToEdit = (prod: Product) => {
    const isMember = !!editCustomerId;
    const price = isMember ? prod.member_price : prod.selling_price;
    const existing = editItems.find(i => i.product_id === prod.id);

    if (existing) {
      handleUpdateQty(prod.id, 1);
    } else {
      const newItem: SaleItem = {
        id: `edit-item-${Math.random().toString(36).substr(2, 9)}`,
        product_id: prod.id,
        qty: 1,
        price: price,
        discount: 0,
        total: price
      };
      setEditItems(prev => [...prev, newItem]);
      showToast(`➕ เพิ่มสินค้า "${prod.name}" เข้าสู่การแก้ไขเรียบร้อย`, 'info');
    }
  };

  // Calculate temporary totals for Editing
  const calculateEditTotals = () => {
    const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    let manualDiscount = 0;
    if (editDiscountVal > 0) {
      if (editDiscountType === 'percent') {
        manualDiscount = Math.round(subtotal * (editDiscountVal / 100) * 100) / 100;
      } else {
        manualDiscount = editDiscountVal;
      }
    }

    const totalDiscount = manualDiscount;
    const finalAmount = Math.max(0, subtotal - totalDiscount);
    const vatRate = settings.vat_rate || 0;
    const vatAmount = vatRate > 0 ? Math.round(finalAmount * (vatRate / (100 + vatRate)) * 100) / 100 : 0;

    return {
      subtotal,
      totalDiscount,
      finalAmount: Math.round(finalAmount * 100) / 100,
      vatAmount
    };
  };

  const editTotals = calculateEditTotals();
  const editChangeAmount = Math.max(0, editReceivedAmount - editTotals.finalAmount);

  const saveEditedSale = () => {
    if (!editingSale) return;

    if (editPaymentMethod === 'cash' && editReceivedAmount < editTotals.finalAmount) {
      showToast('⚠️ จำนวนเงินที่รับมาต้องไม่ต่ำกว่ายอดรวมสุทธิ', 'warning');
      return;
    }

    const updatedSale: Sale = {
      ...editingSale,
      customer_id: editCustomerId || undefined,
      payment_method: editPaymentMethod,
      items: editItems,
      discount_amount: editTotals.totalDiscount,
      vat_amount: editTotals.vatAmount,
      total_amount: editTotals.subtotal,
      final_amount: editTotals.finalAmount,
      received_amount: editPaymentMethod === 'cash' ? editReceivedAmount : editTotals.finalAmount,
      change_amount: editPaymentMethod === 'cash' ? editChangeAmount : 0,
      notes: editNotes.trim() || undefined
    };

    editSale(editingSale.id, updatedSale);
    setShowEditModal(false);
    setEditingSale(null);
  };

  // Print Window Helper
  const handlePrint = (sale: Sale) => {
    showToast('🖨 ส่งใบเสร็จไปยังคิวงานพิมพ์เรียบร้อย...', 'success');
    
    // Create hidden printing element
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('⚠️ โปรดเปิดอนุญาตให้เบราว์เซอร์เปิดหน้าต่างป๊อปอัพเพื่อดูตัวอย่างพิมพ์', 'warning');
      return;
    }

    const itemsHtml = sale.items.map(item => {
      const pName = products.find(p => p.id === item.product_id)?.name || 'สินค้า';
      return `
        <tr>
          <td style="padding: 4px 0;">
            ${pName}<br/>
            <span style="font-size: 11px; color: #555;">${item.qty} ชิ้น x ฿${item.price.toLocaleString()}</span>
          </td>
          <td align="right" style="vertical-align: bottom; padding: 4px 0;">฿${item.total.toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    const customerDetails = sale.customer_id 
      ? `<div style="display: flex; justify-content: space-between;"><span>สมาชิก:</span><span>${getCustomerName(sale.customer_id)}</span></div>`
      : '';

    const taxIdHtml = settings.tax_id 
      ? `<div style="text-align: center; font-size: 11px; color: #444;">เลขผู้เสียภาษี: ${settings.tax_id}</div>` 
      : '';

    const logoHtml = settings.logo
      ? `<div style="text-align: center; margin-bottom: 8px;"><img src="${settings.logo}" style="max-height: 50px; object-contain: contain;" referrerpolicy="no-referrer" /></div>`
      : '';

    const vatHtml = settings.vat_rate > 0
      ? `
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #555;">
          <span>ฐานภาษี (Vat. Excluded):</span>
          <span>฿${(sale.final_amount - sale.vat_amount).toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #555; margin-bottom: 4px;">
          <span>ภาษีมูลค่าเพิ่ม (VAT Included ${settings.vat_rate}%):</span>
          <span>฿${sale.vat_amount.toLocaleString()}</span>
        </div>
      `
      : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt - ${sale.id}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; }
            }
            body { font-family: 'Courier New', Courier, monospace; max-width: 300px; margin: 20px auto; padding: 15px; border: 1px solid #eee; }
            h4 { margin: 4px 0; text-align: center; font-family: sans-serif; }
            p { margin: 3px 0; text-align: center; font-size: 11px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            .total-row { font-weight: bold; font-size: 13px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${logoHtml}
          <h4>${settings.store_name}</h4>
          <p>${settings.address || ''}</p>
          ${taxIdHtml}
          <div class="divider"></div>
          
          <div style="font-size: 11px; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between;"><span>เลขที่บิล:</span><span>${sale.id}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>วันที่:</span><span>${new Date(sale.created_at).toLocaleString('th-TH')}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>พนักงาน:</span><span>${sale.user_fullname}</span></div>
            ${customerDetails}
          </div>
          
          <div class="divider"></div>
          
          <table>
            ${itemsHtml}
          </table>
          
          <div class="divider"></div>
          
          <div style="line-height: 1.5;">
            <div style="display: flex; justify-content: space-between;">
              <span>ยอดรวม:</span>
              <span>฿${sale.total_amount.toLocaleString()}</span>
            </div>
            ${sale.discount_amount > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span>ส่วนลด:</span>
                <span>-฿${sale.discount_amount.toLocaleString()}</span>
              </div>
            ` : ''}
            ${vatHtml}
            <div class="divider"></div>
            <div style="display: flex; justify-content: space-between;" class="total-row">
              <span>ยอดสุทธิ:</span>
              <span>฿${sale.final_amount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>รับเงิน (${getPaymentLabel(sale.payment_method)}):</span>
              <span>฿${sale.received_amount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>เงินทอน:</span>
              <span>฿${sale.change_amount.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          <p style="font-family: sans-serif; font-size: 10px;">ขอบคุณที่ไว้วางใจใช้บริการ</p>
          <p style="font-family: sans-serif; font-size: 9px; color: #666;">พิมพ์ซ้ำเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in" id="sales-history-view-wrapper">
      {/* Top Banner & Summary Card */}
      <div className="bg-white rounded-2xl border border-[#EAF2EC] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-[#2F3E34] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#8FB996]" />
            <span>ประวัติรายการธุรกรรมการขาย</span>
          </h3>
          <p className="text-xs text-[#2F3E34]/55 mt-1 leading-relaxed max-w-xl">
            ตรวจสอบข้อมูลประวัติยอดขาย รายละเอียดใบเสร็จรับเงิน และแก้ไขข้อผิดพลาดในการขายหน้าร้าน 
            มีระบบตรวจเช็คคืนคลังสินค้าและคืนคะแนนแต้มสมาชิกอัตโนมัติเมื่อยกเลิกรายการ
          </p>
        </div>

        {/* Small Analytics Widget */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold cursor-pointer shadow-sm ${
              isSyncing 
                ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed' 
                : 'bg-white border-[#EAF2EC] text-[#2F3E34] hover:bg-[#F8FAF7]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังซิงค์...' : 'ดึงข้อมูลล่าสุด'}</span>
          </button>

          <div className="bg-[#8FB996]/5 border border-[#8FB996]/15 rounded-xl px-4 py-2.5 text-center shrink-0">
            <span className="text-[10px] text-[#2F3E34]/50 font-bold block uppercase tracking-wide">ยอดขายรวมบิลที่เลือก</span>
            <span className="text-base font-mono font-extrabold text-[#2F3E34]">
              ฿{filteredSales.reduce((sum, s) => sum + s.final_amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-[#8FB996]/10 border border-[#8FB996]/20 rounded-xl px-4 py-2.5 text-center shrink-0">
            <span className="text-[10px] text-[#8FB996] font-bold block uppercase tracking-wide">จำนวนธุรกรรมทั้งหมด</span>
            <span className="text-base font-mono font-extrabold text-[#8FB996]">
              {totalItems} บิล
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="relative md:col-span-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2F3E34]/35" />
          <input
            type="text"
            placeholder="ค้นหาเลขบิลบาร์โค้ด, ชื่อลูกค้าสมาชิก, หมายเหตุ..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl pl-10 pr-4 py-2.5 text-[#2F3E34] placeholder-[#2F3E34]/40 focus:outline-none focus:ring-1 focus:ring-[#8FB996] font-sans"
          />
        </div>

        {/* Payment Type Filter */}
        <div className="md:col-span-3">
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-2.5 text-[#2F3E34] font-medium focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
          >
            <option value="all">💳 ช่องทางชำระเงิน: ทั้งหมด</option>
            <option value="cash">เงินสด (Cash)</option>
            <option value="promptpay">พร้อมเพย์ (PromptPay)</option>
            <option value="transfer">โอนเงิน (Transfer)</option>
            <option value="credit">บัตรเครดิต (Credit Card)</option>
            <option value="wallet">ทรูมันนี่ (TrueWallet)</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="md:col-span-3 relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-2.5 text-[#2F3E34] font-medium focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
          />
        </div>

        {/* Reset Buttons */}
        <div className="md:col-span-1">
          <button
            onClick={() => {
              setSearchQuery('');
              setPaymentFilter('all');
              setDateFilter('');
              setCurrentPage(1);
            }}
            className="w-full h-full text-xs bg-gray-100 hover:bg-gray-200 text-[#2F3E34]/65 font-bold rounded-xl py-2.5 cursor-pointer transition-all border border-[#EAF2EC]"
          >
            ล้าง
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#EAF2EC] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAF7] border-b border-[#EAF2EC] text-[10px] text-[#2F3E34]/50 font-bold uppercase tracking-wider">
                <th className="py-4 px-5">วัน-เวลาขาย (Date/Time)</th>
                <th className="py-4 px-5">เลขที่บิลใบเสร็จ (Receipt ID)</th>
                <th className="py-4 px-5">สมาชิกผู้ซื้อ (Member)</th>
                <th className="py-4 px-5">พนักงานแคชเชียร์ (Staff)</th>
                <th className="py-4 px-5">การชำระเงิน (Payment)</th>
                <th className="py-4 px-5 text-center">จำนวนสินค้า (Qty)</th>
                <th className="py-4 px-5 text-right">ยอดชำระสุทธิ (Total)</th>
                <th className="py-4 px-5 text-center">จัดการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2EC]/55 text-[13px]">
              {paginatedSales.length > 0 ? (
                paginatedSales.map((sale) => {
                  const totalQty = (sale.items || []).reduce((sum, item) => sum + item.qty, 0);
                  return (
                    <tr key={sale.id} className="hover:bg-[#F8FAF7]/40 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-[#2F3E34]/70">
                          <Clock className="w-3.5 h-3.5 text-[#2F3E34]/30" />
                          <span>{sale.created_at ? new Date(sale.created_at).toLocaleString('th-TH') : 'ไม่ระบุเวลา'}</span>
                        </div>
                      </td>

                      {/* Receipt ID */}
                      <td className="py-3 px-5 font-mono text-[12px] font-bold text-[#2F3E34]">
                        {sale.id}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#8FB996]" />
                          <span className="font-medium text-xs">{getCustomerName(sale.customer_id)}</span>
                        </div>
                      </td>

                      {/* Cashier/Staff */}
                      <td className="py-3 px-5 text-xs text-[#2F3E34]/70">
                        {sale.user_fullname}
                      </td>

                      {/* Payment Badge */}
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getPaymentBadgeClass(sale.payment_method)}`}>
                          {getPaymentLabel(sale.payment_method).split(' ')[0]}
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="py-3 px-5 text-center font-mono font-semibold text-xs text-[#2F3E34]/75">
                        {totalQty} ชิ้น
                      </td>

                      {/* Total Net Price */}
                      <td className="py-3 px-5 text-right font-mono font-bold text-[#2F3E34]">
                        ฿{sale.final_amount.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-center gap-1">
                          {/* View details */}
                          <button
                            onClick={() => handleOpenDetails(sale)}
                            title="ดูใบเสร็จ"
                            className="p-1.5 rounded-lg bg-[#8FB996]/5 hover:bg-[#8FB996]/15 text-[#8FB996] transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Print */}
                          <button
                            onClick={() => handlePrint(sale)}
                            title="พิมพ์สลิปใบเสร็จ"
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit (only available if role is owner or manager) */}
                          <button
                            onClick={() => handleOpenEdit(sale)}
                            disabled={currentUser.role !== 'owner' && currentUser.role !== 'manager'}
                            title={currentUser.role === 'owner' || currentUser.role === 'manager' ? 'แก้ไขบิล' : 'ไม่มีสิทธิ์เข้าถึงเพื่อแก้ไข'}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              currentUser.role === 'owner' || currentUser.role === 'manager'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                                : 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleOpenDelete(sale)}
                            disabled={currentUser.role !== 'owner' && currentUser.role !== 'manager'}
                            title={currentUser.role === 'owner' || currentUser.role === 'manager' ? 'ยกเลิกบิลและลบ' : 'ไม่มีสิทธิ์เข้าถึงเพื่อลบ'}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              currentUser.role === 'owner' || currentUser.role === 'manager'
                                ? 'bg-red-50 hover:bg-red-100 text-red-500'
                                : 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                        <Receipt className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#2F3E34]">
                          {searchQuery || paymentFilter !== 'all' || dateFilter 
                            ? '🔍 ไม่พบข้อมูลที่ตรงกับตัวกรองของคุณ' 
                            : 'ยังไม่มีประวัติรายการธุรกรรมการขาย'}
                        </p>
                        <p className="text-xs text-[#2F3E34]/40 max-w-[280px] mx-auto leading-relaxed">
                          {searchQuery || paymentFilter !== 'all' || dateFilter
                            ? 'ลองล้างการค้นหาหรือปรับเปลี่ยนตัวกรองวันที่เพื่อตรวจสอบข้อมูลอีกครั้ง'
                            : 'เมื่อคุณทำรายการขายที่หน้าเครื่อง POS รายการจะมาปรากฏที่นี่โดยอัตโนมัติ'}
                        </p>
                      </div>
                      {(searchQuery || paymentFilter !== 'all' || dateFilter) && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setPaymentFilter('all');
                            setDateFilter('');
                          }}
                          className="mt-2 text-xs font-bold text-[#8FB996] hover:underline cursor-pointer"
                        >
                          ล้างตัวกรองทั้งหมด
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#F8FAF7]/40 border-t border-[#EAF2EC] flex items-center justify-between">
            <span className="text-[11px] text-[#2F3E34]/50 font-bold">
              แสดงหน้า {currentPage} จากทั้งหมด {totalPages} หน้า (รายการ {((currentPage-1)*itemsPerPage)+1}-{Math.min(currentPage*itemsPerPage, totalItems)} จาก {totalItems} รายการ)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-xl border border-[#EAF2EC] cursor-pointer transition-all ${
                  currentPage === 1 ? 'opacity-40 cursor-not-allowed bg-white text-gray-300' : 'bg-white hover:bg-[#F8FAF7] text-[#2F3E34]'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page Number Badges */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-xs font-semibold rounded-xl cursor-pointer transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#8FB996] text-white border border-[#8FB996] shadow-sm'
                        : 'bg-white hover:bg-[#F8FAF7] border border-[#EAF2EC] text-[#2F3E34]/80'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded-xl border border-[#EAF2EC] cursor-pointer transition-all ${
                  currentPage === totalPages ? 'opacity-40 cursor-not-allowed bg-white text-gray-300' : 'bg-white hover:bg-[#F8FAF7] text-[#2F3E34]'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: VIEW DETAILS RECEIPT */}
      {showDetailsModal && selectedSale && (
        <div 
          className="fixed inset-0 bg-[#2F3E34]/35 backdrop-blur-xs flex items-start justify-center z-50 p-4 overflow-y-auto animate-fade-in cursor-pointer"
          onClick={() => {
            setSelectedSale(null);
            setShowDetailsModal(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl w-full max-w-4xl h-[90vh] my-4 md:my-8 flex flex-col overflow-hidden animate-slide-up cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#EAF2EC] flex justify-between items-center bg-white sticky top-0 z-10">
              <span className="text-sm font-bold text-[#2F3E34] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#8FB996]" /> รายละเอียดใบเสร็จ: {selectedSale.id}
              </span>
              <button
                onClick={() => {
                  setSelectedSale(null);
                  setShowDetailsModal(false);
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-[#2F3E34]/40 hover:text-red-500 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30 flex justify-center">
              <div className="bg-white border border-[#EAF2EC] rounded-xl p-5 sm:p-10 text-[#2F3E34]/90 space-y-8 font-mono select-text shadow-sm relative overflow-hidden w-full max-w-2xl">
                {/* Decorative receipt edge */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[#8FB996]/20"></div>
                
                {/* Store Header */}
                <div className="text-center space-y-2 flex flex-col items-center justify-center pt-2">
                  {settings.logo && (
                    <img
                      src={settings.logo}
                      alt="Store Logo"
                      className="max-h-16 max-w-full object-contain mb-2 rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <h4 className="text-base font-bold font-sans text-[#2F3E34]">{settings.store_name}</h4>
                  <p className="text-[11px] font-sans text-[#2F3E34]/60 leading-normal max-w-[240px] mx-auto">{settings.address}</p>
                  {settings.tax_id && <p className="text-[11px] text-[#2F3E34]/50">เลขผู้เสียภาษี: {settings.tax_id}</p>}
                  <div className="w-full border-t border-dashed border-[#2F3E34]/10 my-4"></div>
                </div>

                {/* Sales Metadata */}
                <div className="space-y-1.5 text-[11px] text-[#2F3E34]/70">
                  <div className="flex justify-between">
                    <span className="text-[#2F3E34]/40">เลขที่ใบเสร็จ:</span>
                    <span className="font-bold">{selectedSale.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#2F3E34]/40">วันที่รายการ:</span>
                    <span>{new Date(selectedSale.created_at).toLocaleString('th-TH')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#2F3E34]/40">พนักงานแคชเชียร์:</span>
                    <span>{selectedSale.user_fullname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#2F3E34]/40">สมาชิกร้านค้า:</span>
                    <span className="font-semibold">{getCustomerName(selectedSale.customer_id)}</span>
                  </div>
                </div>

                {/* Products Table list */}
                <div className="space-y-3">
                  <div className="w-full border-t border-dashed border-[#2F3E34]/10 my-4"></div>
                  <table className="w-full text-left leading-relaxed">
                    <thead>
                      <tr className="text-[#2F3E34]/45 border-b border-[#2F3E34]/5 font-bold text-[10px] uppercase tracking-wider">
                        <th className="pb-2">รายการสินค้า</th>
                        <th className="pb-2 text-right">จำนวน</th>
                        <th className="pb-2 text-right">รวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-[#2F3E34]/5">
                      {selectedSale.items.map((item) => {
                        const prod = products.find(p => p.id === item.product_id);
                        return (
                          <tr key={item.id} className="text-[#2F3E34]/85">
                            <td className="py-2.5 pr-2">
                              <span className="font-sans font-bold block text-[12px]">{prod?.name || 'รายการสินค้า'}</span>
                              <div className="flex gap-2 text-[10px] text-[#2F3E34]/50 mt-0.5">
                                <span>฿{item.price.toLocaleString()} / ชิ้น</span>
                                {item.discount > 0 && <span className="text-green-600 font-bold">ลด ฿{item.discount}</span>}
                              </div>
                            </td>
                            <td className="py-2.5 text-right font-bold text-[11px]">{item.qty}</td>
                            <td className="py-2.5 text-right font-bold text-[12px]">฿{item.total.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="w-full border-t border-dashed border-[#2F3E34]/10 my-4"></div>
                </div>

                {/* Financial Breakdowns */}
                <div className="space-y-2 text-[11px] text-[#2F3E34]/70">
                  <div className="flex justify-between">
                    <span>ยอดรวมสินค้า:</span>
                    <span>฿{selectedSale.total_amount.toLocaleString()}</span>
                  </div>
                  {selectedSale.discount_amount > 0 && (
                    <div className="flex justify-between text-green-700 font-bold">
                      <span>ส่วนลดรวม:</span>
                      <span>-฿{selectedSale.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  {settings.vat_rate > 0 && (
                    <div className="bg-gray-50/50 p-2 rounded-lg space-y-1 my-2">
                      <div className="flex justify-between text-[10px] text-[#2F3E34]/40">
                        <span>ฐานภาษี (Vat. Excluded):</span>
                        <span>฿{(selectedSale.final_amount - selectedSale.vat_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#2F3E34]/40">
                        <span>ภาษีมูลค่าเพิ่ม ({settings.vat_rate}%):</span>
                        <span>฿{selectedSale.vat_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-extrabold text-[15px] text-[#2F3E34] pt-3 border-t border-dashed border-[#2F3E34]/20 mt-2">
                    <span>ยอดสุทธิ:</span>
                    <span className="font-mono">฿{selectedSale.final_amount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-[12px] font-bold text-[#8FB996] mt-1">
                    <span>รับเงิน ({getPaymentLabel(selectedSale.payment_method).split(' ')[0]}):</span>
                    <span>฿{selectedSale.received_amount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-[13px] font-extrabold text-amber-600">
                    <span>เงินทอน:</span>
                    <span>฿{selectedSale.change_amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Receipt Footer */}
                <div className="text-center pt-6 border-t border-dashed border-[#2F3E34]/20 space-y-2">
                  <p className="font-sans font-bold text-[12px]">ขอให้ท่านมีสุขภาพกายใจที่ดีและร่มเย็น</p>
                  <p className="font-sans text-[#2F3E34]/40 text-[10px] font-medium tracking-widest uppercase">*** Thank You ***</p>
                  
                  {/* Fake barcode for aesthetic */}
                  <div className="flex justify-center pt-2 opacity-20 grayscale">
                    <div className="h-8 w-40 bg-[repeating-linear-gradient(90deg,#000,#000_1px,#fff_1px,#fff_4px)]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-white border-t border-[#EAF2EC] flex gap-3 sticky bottom-0 z-10">
              <button
                onClick={() => handlePrint(selectedSale)}
                className="flex-1 py-3 bg-[#8FB996] text-white hover:bg-[#7da885] text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4" /> พิมพ์ใบเสร็จ
              </button>
              <button
                onClick={() => {
                  setSelectedSale(null);
                  setShowDetailsModal(false);
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all active:scale-95"
              >
                ปิดหน้าจอ
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL: DELETE SALE CONFIRMATION */}
      {showDeleteModal && saleToDelete && (
        <div className="fixed inset-0 bg-[#2F3E34]/35 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-red-100 shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-5 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-[#2F3E34]">ต้องการยกเลิกและลบบิลคัดออก?</h4>
                <p className="text-xs text-[#2F3E34]/55 font-semibold">บิลใบเสร็จเลขที่: <span className="font-mono text-red-600 font-bold">{saleToDelete.id}</span></p>
              </div>
              
              <div className="bg-red-50/50 rounded-xl p-3.5 border border-red-100/50 text-[11px] text-[#2F3E34]/75 text-left leading-relaxed space-y-1">
                <p className="font-bold text-red-700 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0" /> โปรดทราบเมื่อลบบิลรายการขายนี้แล้ว:
                </p>
                <ul className="list-disc pl-4 space-y-1 mt-1 font-sans">
                  <li>สต็อกสินค้าทั้งหมดในบิลนี้จำนวน <strong className="text-red-700 font-mono">{saleToDelete.items.reduce((sum, i) => sum + i.qty, 0)} ชิ้น</strong> จะถูกคืนเข้าคลังทันที</li>
                  <li>ระบบบัญชีรายรับจากการขายจำนวน <strong className="text-red-700 font-mono">฿{saleToDelete.final_amount.toLocaleString()}</strong> จะถูกปรับลดออก</li>
                  {saleToDelete.customer_id && (
                    <li>คะแนนแต้มสมาชิกผู้ซื้อจะถูกหักคำนวณคืนโดยอัตโนมัติ</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-[#EAF2EC] flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
              >
                ยืนยัน ลบและคืนสต็อก
              </button>
              <button
                onClick={() => {
                  setSaleToDelete(null);
                  setShowDeleteModal(false);
                }}
                className="flex-1 py-2 border border-[#EAF2EC] hover:bg-gray-100 text-xs font-bold rounded-xl text-[#2F3E34]/70 cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SALE */}
      {showEditModal && editingSale && (
        <div className="fixed inset-0 bg-[#2F3E34]/35 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-[#EAF2EC] flex justify-between items-center bg-white">
              <span className="text-xs font-bold text-[#2F3E34] flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-500" /> แก้ไขรายละเอียดการขายบิล: <span className="font-mono text-xs">{editingSale.id}</span>
              </span>
              <button
                onClick={() => {
                  setEditingSale(null);
                  setShowEditModal(false);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 text-[#2F3E34]/40 hover:text-[#2F3E34] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Side: Items & Products list */}
              <div className="lg:col-span-7 space-y-4 flex flex-col min-h-0">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block">รายการสินค้าในบิลนี้ (Products list)</label>
                  <div className="border border-[#EAF2EC] rounded-xl overflow-hidden bg-[#F8FAF7]/30 flex-1 divide-y divide-[#EAF2EC]/60 max-h-72 overflow-y-auto">
                    {editItems.map((item) => {
                      const prod = products.find(p => p.id === item.product_id);
                      return (
                        <div key={item.id} className="p-3 flex items-center justify-between gap-4 bg-white">
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-[#2F3E34] block truncate">{prod?.name || 'ไม่ระบุชื่อสินค้า'}</span>
                            <span className="text-[10px] text-[#2F3E34]/45 font-mono">฿{item.price.toLocaleString()} / ชิ้น</span>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Qty selectors */}
                            <div className="flex items-center border border-[#EAF2EC] rounded-lg bg-[#F8FAF7]">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.product_id, -1)}
                                className="px-2 py-1 text-gray-500 hover:text-black hover:bg-gray-100 rounded-l-lg transition-all"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2.5 font-mono text-xs font-bold text-center min-w-8">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.product_id, 1)}
                                className="px-2 py-1 text-gray-500 hover:text-black hover:bg-gray-100 rounded-r-lg transition-all"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="w-16 text-right font-mono text-xs font-extrabold text-[#2F3E34]">
                              ฿{item.total.toLocaleString()}
                            </span>

                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Product Search Quick List */}
                <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block">เพิ่มสินค้าเข้าในบิลเพิ่มเติม (Add more product)</label>
                  <div className="border border-[#EAF2EC] rounded-xl bg-white overflow-hidden p-3 flex flex-col gap-2 max-h-56">
                    <span className="text-[10px] text-[#2F3E34]/45 block font-bold">คลิกที่สินค้าด้านล่างเพื่อเพิ่มเข้าไป:</span>
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {products.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAddProductToEdit(p)}
                          className="p-2 border border-[#EAF2EC] rounded-xl hover:bg-[#8FB996]/5 text-left text-xs flex items-center justify-between gap-1 transition-all cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold block truncate text-[#2F3E34]">{p.name}</span>
                            <span className="text-[9px] text-[#2F3E34]/50 font-mono">฿{p.selling_price.toLocaleString()} (สต็อก: {p.stock_qty})</span>
                          </div>
                          <Plus className="w-3.5 h-3.5 text-[#8FB996] shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Metadata / Totals & Checkout parameters */}
              <div className="lg:col-span-5 space-y-4 bg-[#F8FAF7]/50 rounded-2xl p-4 border border-[#EAF2EC]">
                {/* Customer Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block">สมาชิกร้านค้า (Customer / Member)</label>
                  <select
                    value={editCustomerId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setEditCustomerId(newId);
                      // Recalculate item prices based on customer membership pricing
                      setEditItems(prev => prev.map(item => {
                        const prod = products.find(p => p.id === item.product_id);
                        if (prod) {
                          const price = newId ? prod.member_price : prod.selling_price;
                          return {
                            ...item,
                            price: price,
                            total: price * item.qty - item.discount
                          };
                        }
                        return item;
                      }));
                    }}
                    className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] font-medium focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  >
                    <option value="">ลูกค้าทั่วไป (Walk-in / Guest)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.fullname} ({c.phone}) - ระดับ {c.tier.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block">ช่องทางการชำระเงิน (Payment Method)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {(['cash', 'promptpay', 'transfer', 'credit', 'wallet'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setEditPaymentMethod(method);
                          if (method !== 'cash') {
                            setEditReceivedAmount(0);
                          }
                        }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-semibold text-center border transition-all cursor-pointer ${
                          editPaymentMethod === method
                            ? 'bg-[#8FB996] border-[#8FB996] text-white shadow-sm'
                            : 'bg-white hover:bg-[#8FB996]/5 border-[#EAF2EC] text-[#2F3E34]/70'
                        }`}
                      >
                        {getPaymentLabel(method).split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom discount setting */}
                <div className="space-y-1.5 border-t border-[#EAF2EC] pt-3">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block">ส่วนลดกำหนดเองเพิ่มเติม (Manual Discount)</label>
                  <div className="flex gap-2">
                    <select
                      value={editDiscountType}
                      onChange={(e) => setEditDiscountType(e.target.value as 'fixed' | 'percent')}
                      className="bg-white border border-[#EAF2EC] rounded-xl px-2 py-1.5 text-xs text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                    >
                      <option value="fixed">บาท (฿)</option>
                      <option value="percent">เปอร์เซ็นต์ (%)</option>
                    </select>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={editDiscountVal || ''}
                      placeholder="เช่น 100"
                      onChange={(e) => setEditDiscountVal(Math.max(0, Number(e.target.value) || 0))}
                      className="flex-1 text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-1.5 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Cash received details if payment method is cash */}
                {editPaymentMethod === 'cash' && (
                  <div className="space-y-1.5 bg-white border border-[#EAF2EC] rounded-xl p-3">
                    <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block">รับเงินสดจากลูกค้า (Cash Received)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        min={0}
                        placeholder="ระบุยอดเงินสด เช่น 1000"
                        value={editReceivedAmount || ''}
                        onChange={(e) => setEditReceivedAmount(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] font-mono font-bold text-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Receipt Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block">หมายเหตุเพิ่มเติม (Notes)</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="เช่น ข้อมูลลูกค้า, บันทึกความผิดพลาด, ข้อมูลกำกับสาเหตุการแก้ไข..."
                    className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] placeholder-[#2F3E34]/40 focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                {/* Summary Totals Calculation Preview */}
                <div className="border-t border-[#EAF2EC] pt-4 space-y-2 text-xs text-[#2F3E34]/70">
                  <div className="flex justify-between font-semibold">
                    <span>รวมมูลค่าสินค้าในบิล (Subtotal):</span>
                    <span className="font-mono">฿{editTotals.subtotal.toLocaleString()}</span>
                  </div>
                  {editTotals.totalDiscount > 0 && (
                    <div className="flex justify-between font-bold text-green-700">
                      <span>หักส่วนลดรวม (Discount):</span>
                      <span className="font-mono">-฿{editTotals.totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {settings.vat_rate > 0 && (
                    <div className="flex justify-between text-[#2F3E34]/50">
                      <span>ภาษีมูลค่าเพิ่ม (VAT Included {settings.vat_rate}%):</span>
                      <span className="font-mono">฿{editTotals.vatAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-[#2F3E34] pt-2 border-t border-[#EAF2EC] mt-1">
                    <span>ยอดสุทธิใหม่ (Net Total):</span>
                    <span className="font-mono text-base text-[#8FB996]">฿{editTotals.finalAmount.toLocaleString()}</span>
                  </div>
                  {editPaymentMethod === 'cash' && (
                    <div className="flex justify-between text-xs text-amber-700 font-bold pt-1 border-t border-dashed border-gray-200 mt-1">
                      <span>คำนวณเงินทอน (Change):</span>
                      <span className="font-mono text-sm">฿{editChangeAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-gray-50 border-t border-[#EAF2EC] flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingSale(null);
                  setShowEditModal(false);
                }}
                className="px-4 py-2 border border-[#EAF2EC] hover:bg-gray-100 text-xs font-semibold rounded-xl text-[#2F3E34]/70 cursor-pointer"
              >
                ยกเลิกแก้ไข
              </button>
              <button
                onClick={saveEditedSale}
                className="px-5 py-2 bg-[#8FB996] text-white hover:bg-[#8FB996]/95 text-xs font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
