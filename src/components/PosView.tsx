/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDb } from '../context/DbContext';
import { Product, Customer, SaleItem, Coupon, getProxyImage } from '../types';
import {
  Search,
  ShoppingCart,
  Trash2,
  Tag,
  CreditCard,
  QrCode,
  Coins,
  Receipt,
  UserPlus,
  Notebook,
  AlertCircle,
  Download,
  Share2,
  Plus,
  Minus,
  RefreshCw,
  Clock,
  Printer,
  Lock
} from 'lucide-react';

interface CartItem {
  product: Product;
  qty: number;
  discount: number; // Flat discount amount per item unit
  notes: string;
}

export const PosView: React.FC = () => {
  const {
    products,
    categories,
    customers,
    coupons,
    promotions,
    settings,
    recordSale,
    addCustomerPoints,
    showToast,
    currentUser,
    lockScreen
  } = useDb();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scannedBarcode, setScannedBarcode] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);

  // Manual Cart Discount
  const [customDiscountType, setCustomDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [customDiscountValue, setCustomDiscountValue] = useState<number>(0);

  // Notes and Edit Item Modals
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [itemNote, setItemNote] = useState('');
  const [itemDiscount, setItemDiscount] = useState<number>(0);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'promptpay' | 'transfer' | 'credit' | 'wallet'>('cash');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Finished Checkout Receipt
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Barcode Scanner emulation Ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus Barcode Scanner Search initially
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Filter Active Products
  const filteredProducts = products.filter(p => {
    if (p.status !== 'active') return false;
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter Active Coupons
  const activeCouponsList = coupons.filter(c => {
    if (!c.active) return false;
    if (c.expiry_date && new Date(c.expiry_date) < new Date()) return false;
    return true;
  });

  // Emulate Barcode Scan Action (Press Enter on input)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = scannedBarcode.trim();
    if (!barcode) return;

    const match = products.find(p => p.barcode === barcode && p.status === 'active');
    if (match) {
      addToCart(match);
      setScannedBarcode('');
    } else {
      showToast(`❌ ไม่พบสินค้าบาร์โค้ด "${barcode}" หรือสินค้าถูกปิดใช้งาน`, 'error');
    }
  };

  // Quick Action: Add item to cart
  const addToCart = (product: Product) => {
    const isService = product.type === 'service';
    if (!isService && product.stock_qty <= 0) {
      showToast(`⚠️ สินค้า "${product.name}" หมดคลังชั่วคราว`, 'warning');
      return;
    }

    const idx = cart.findIndex(item => item.product.id === product.id);
    if (idx !== -1) {
      const currentQtyInCart = cart[idx].qty;
      if (!isService && currentQtyInCart >= product.stock_qty) {
        showToast(`⚠️ ไม่สามารถเพิ่มได้ เนื่องจากสินค้าในคลังมีเพียง ${product.stock_qty} ชิ้น`, 'warning');
        return;
      }
      const updated = [...cart];
      updated[idx] = { ...updated[idx], qty: currentQtyInCart + 1 };
      setCart(updated);
      showToast(`🛒 เพิ่ม "${product.name}" ลงตะกร้าแล้ว (${updated[idx].qty} ชิ้น)`, 'success');
    } else {
      setCart([...cart, { product, qty: 1, discount: 0, notes: '' }]);
      showToast(`🛒 เพิ่ม "${product.name}" ลงตะกร้าแล้ว`, 'success');
    }
  };

  // Modify cart quantity
  const updateCartQty = (idx: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(idx);
      return;
    }

    const item = cart[idx];
    const isService = item.product.type === 'service';
    if (!isService && newQty > item.product.stock_qty) {
      showToast(`⚠️ สินค้าในสต็อกเหลือเพียง ${item.product.stock_qty} ชิ้น`, 'warning');
      return;
    }

    const updated = [...cart];
    updated[idx] = { ...updated[idx], qty: newQty };
    setCart(updated);
  };

  const removeFromCart = (idx: number) => {
    const item = cart[idx];
    setCart(prev => prev.filter((_, i) => i !== idx));
    showToast(`🗑 นำ "${item.product.name}" ออกจากตะกร้าแล้ว`, 'info');
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setActiveCoupon(null);
    setCouponCode('');
    setReceivedAmount(0);
    setCustomDiscountValue(0);
    setCustomDiscountType('fixed');
    showToast('🧹 เคลียร์ตะกร้าสินค้าเรียบร้อย', 'info');
  };

  // Apply Coupon Code
  const applyCoupon = (codeOverride?: string) => {
    const code = (codeOverride !== undefined ? codeOverride : couponCode).trim().toUpperCase();
    if (!code) {
      setActiveCoupon(null);
      return;
    }

    const match = coupons.find(c => c.code === code && c.active);
    if (!match) {
      showToast('❌ รหัสคูปองไม่ถูกต้อง หรือหมดอายุแล้ว', 'error');
      setActiveCoupon(null);
      return;
    }

    // Check minimum purchase
    const subtotalVal = cart.reduce((sum, item) => {
      const priceToUse = selectedCustomer ? item.product.member_price : item.product.selling_price;
      return sum + (priceToUse * item.qty);
    }, 0);

    if (subtotalVal < match.min_purchase) {
      showToast(`⚠️ ยอดสั่งซื้อขั้นต่ำต้องถึง ฿${match.min_purchase.toLocaleString()} เพื่อเปิดใช้งานโค้ดนี้`, 'warning');
      setActiveCoupon(null);
      return;
    }

    setActiveCoupon(match);
    setCouponCode(match.code);
    showToast(`🎉 โค้ด "${match.code}" พร้อมใช้งานแล้ว!`, 'success');
  };

  // Calculate Totals with Automatic Promotion Engine
  const calculateCartSummary = () => {
    // 1. Base subtotals and individual promotions (BOGO buy 1 get 1, discounts, etc)
    let subtotal = 0;
    let bogoDiscount = 0;
    let promotionDiscount = 0;

    cart.forEach(item => {
      const priceToUse = selectedCustomer ? item.product.member_price : item.product.selling_price;
      const rawTotal = priceToUse * item.qty;
      subtotal += rawTotal;

      // Check BOGO (Buy 1 Get 1) for specific items e.g., lavender oil
      // "promo-1" is lavender oil buy 1 get 1 free
      const bogoPromo = promotions.find(p => p.type === 'bogo' && p.active);
      if (bogoPromo && item.product.id === 'prod-1' && item.qty >= 2) {
        const freeItemsCount = Math.floor(item.qty / 2);
        const freeDiscountValue = freeItemsCount * priceToUse;
        bogoDiscount += freeDiscountValue;
      }

      // Check item percentage discount (Sencha tea gets 10% discount)
      const pctPromo = promotions.find(p => p.id === 'promo-2' && p.active);
      if (pctPromo && item.product.id === 'prod-5') {
        const discountValue = rawTotal * (pctPromo.value / 100);
        promotionDiscount += discountValue;
      }

      // Individual item custom discount
      if (item.discount > 0) {
        promotionDiscount += (item.discount * item.qty);
      }
    });

    // 2. Coupon Discount
    let couponDiscount = 0;
    const preCouponTotal = subtotal - bogoDiscount - promotionDiscount;

    if (activeCoupon) {
      if (activeCoupon.type === 'percent') {
        couponDiscount = preCouponTotal * (activeCoupon.discount_value / 100);
      } else {
        couponDiscount = activeCoupon.discount_value;
      }
    }

    // Happy Hour automatic check (if total >= 1200, apply promo-3 flat 100 discount)
    let autoFlatDiscount = 0;
    const currentTotalAfterAll = preCouponTotal - couponDiscount;
    const flatPromo = promotions.find(p => p.id === 'promo-3' && p.active);
    if (flatPromo && currentTotalAfterAll >= flatPromo.min_purchase) {
      autoFlatDiscount = flatPromo.value;
    }

    // 3. Custom Manual Cart Discount
    let customCartDiscount = 0;
    const preCustomDiscountTotal = Math.max(0, subtotal - bogoDiscount - promotionDiscount - couponDiscount - autoFlatDiscount);
    if (customDiscountValue > 0) {
      if (customDiscountType === 'percent') {
        customCartDiscount = Math.round(preCustomDiscountTotal * (customDiscountValue / 100));
      } else {
        customCartDiscount = customDiscountValue;
      }
    }

    const totalDiscount = bogoDiscount + promotionDiscount + couponDiscount + autoFlatDiscount + customCartDiscount;
    const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);
    
    // VAT rate calculations (included or added)
    const vatRate = settings.vat_rate || 0;
    const vatAmount = subtotalAfterDiscount * (vatRate / (100 + vatRate)); // Included VAT
    const baseAmount = subtotalAfterDiscount - vatAmount;

    return {
      subtotal,
      bogoDiscount,
      promotionDiscount,
      couponDiscount,
      autoFlatDiscount,
      customCartDiscount,
      totalDiscount,
      finalAmount: Math.round(subtotalAfterDiscount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      baseAmount: Math.round(baseAmount * 100) / 100
    };
  };

  const {
    subtotal,
    bogoDiscount,
    promotionDiscount,
    couponDiscount,
    autoFlatDiscount,
    customCartDiscount,
    totalDiscount,
    finalAmount,
    vatAmount,
    baseAmount
  } = calculateCartSummary();

  // Item Modifiers Modal
  const openItemModifier = (idx: number) => {
    setEditingItemIdx(idx);
    setItemNote(cart[idx].notes);
    setItemDiscount(cart[idx].discount);
  };

  const saveItemModifier = () => {
    if (editingItemIdx === null) return;
    const updated = [...cart];
    updated[editingItemIdx] = {
      ...updated[editingItemIdx],
      notes: itemNote,
      discount: Number(itemDiscount) || 0
    };
    setCart(updated);
    setEditingItemIdx(null);
    showToast('ปรับปรุงรายละเอียดสินค้าในตะกร้าแล้ว', 'success');
  };

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      showToast('⚠️ ตะกร้าสินค้าว่างเปล่า กรุณาเลือกสินค้าสุขภาพก่อน', 'warning');
      return;
    }
    setReceivedAmount(finalAmount); // Default to exact amount
    setShowCheckoutModal(true);
  };

  // Execute checkout transaction
  const handleCheckoutSubmit = () => {
    if (paymentMethod === 'cash' && receivedAmount < finalAmount) {
      showToast('⚠️ จำนวนเงินสดที่รับมาไม่ครบถ้วนตามราคาสุทธิ', 'error');
      return;
    }

    setIsProcessingPayment(true);

    // Simulate wellness transaction slow delay
    setTimeout(() => {
      const saleItems: SaleItem[] = cart.map(item => ({
        id: `sitem-${Math.random().toString(36).substr(2, 9)}`,
        product_id: item.product.id,
        qty: item.qty,
        price: selectedCustomer ? item.product.member_price : item.product.selling_price,
        discount: item.discount,
        total: (selectedCustomer ? item.product.member_price : item.product.selling_price) * item.qty - (item.discount * item.qty)
      }));

      const finalReceived = paymentMethod === 'cash' ? receivedAmount : finalAmount;
      const finalChange = paymentMethod === 'cash' ? (receivedAmount - finalAmount) : 0;

      const saleData = {
        customer_id: selectedCustomer?.id,
        items: saleItems,
        discount_amount: totalDiscount,
        vat_amount: vatAmount,
        total_amount: subtotal,
        final_amount: finalAmount,
        payment_method: paymentMethod,
        received_amount: finalReceived,
        change_amount: finalChange,
        coupon_code: activeCoupon?.code,
        notes: `แคชเชียร์จำหน่าย: ${currentUser.fullname}`
      };

      const recorded = recordSale(saleData);

      // Reset cart and store completed sale
      setCompletedSale(recorded);
      setCart([]);
      setSelectedCustomer(null);
      setActiveCoupon(null);
      setCouponCode('');
      setReceivedAmount(0);
      setIsProcessingPayment(false);
      setShowCheckoutModal(false);
      setShowReceiptModal(true);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-130px)] overflow-hidden">
      {/* POS Top Header */}
      <div className="flex items-center justify-between shrink-0 px-1 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8FB996]/10 flex items-center justify-center text-[#8FB996]">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2F3E34] tracking-tight">ระบบจำหน่ายสินค้าหน้าร้าน (POS)</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] text-[#2F3E34]/40 font-medium uppercase tracking-wider">
                กำลังปฏิบัติงาน: {currentUser.fullname} • {new Date().toLocaleDateString('th-TH')}
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={lockScreen}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#EAF2EC] text-[#2F3E34] hover:bg-[#F8FAF7] transition-all text-xs font-bold shadow-sm cursor-pointer group"
        >
          <Lock className="w-4 h-4 text-[#8FB996] group-hover:scale-110 transition-transform" />
          <span>ล็อคหน้าจอ</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
      {/* LEFT SIDE: PRODUCTS GRID CATALOG */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-[#EAF2EC] p-5 h-full overflow-hidden">
        {/* Search and barcode scanner simulator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#2F3E34]/35" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้าสุขภาพ / SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl pl-10 pr-4 py-3 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
            />
          </div>

          <form onSubmit={handleBarcodeSubmit} className="relative flex">
            <QrCode className="w-4 h-4 absolute left-3.5 top-3.5 text-[#2F3E34]/35" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="ยิงบาร์โค้ดสแกนเนอร์..."
              value={scannedBarcode}
              onChange={(e) => setScannedBarcode(e.target.value)}
              className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl pl-10 pr-4 py-3 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] font-mono"
            />
            <button type="submit" className="hidden">ตกลง</button>
          </form>
        </div>

        {/* Category Pill Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 shrink-0 border-b border-[#F8FAF7]">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#8FB996] text-white shadow-sm'
                : 'bg-[#F8FAF7] text-[#2F3E34]/70 hover:bg-[#8FB996]/10'
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#8FB996] text-white shadow-sm'
                  : 'bg-[#F8FAF7] text-[#2F3E34]/70 hover:bg-[#8FB996]/10'
              }`}
            >
              {cat.name.split(' (')[0]} {/* Simple Thai category name */}
            </button>
          ))}
        </div>

        {/* Product Catalog Cards */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map(p => {
                const isLowStock = p.type === 'product' && p.stock_qty <= p.min_stock;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="group bg-[#F8FAF7]/50 hover:bg-white border border-[#EAF2EC] hover:border-[#8FB996]/30 rounded-2xl p-3 text-left transition-all duration-300 flex flex-col justify-between hover:shadow-md cursor-pointer relative"
                  >
                    <div>
                      {/* Image */}
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-white mb-3 relative">
                        <img
                          src={getProxyImage(p.image) || 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=200'}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        {isLowStock && (
                          <span className="absolute top-2 left-2 bg-[#E57373] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            ใกล้หมดคลัง
                          </span>
                        )}
                        {p.stock_qty === 0 && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center text-white text-xs font-bold">
                            สินค้าหมดคลัง
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <h5 className="text-xs font-semibold text-[#2F3E34] line-clamp-2 leading-relaxed mb-1">
                        {p.name}
                      </h5>
                      <p className="text-[10px] text-[#2F3E34]/40 font-mono tracking-wide mb-2">
                        SKU: {p.sku}
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-1 pt-1.5 border-t border-[#EAF2EC]/50 w-full">
                      <div>
                        <p className="text-xs font-extrabold text-[#8FB996] font-mono">
                          ฿{p.selling_price.toLocaleString()}
                        </p>
                        {selectedCustomer && (
                          <p className="text-[9px] text-amber-600 font-bold">
                            สมาชิก: ฿{p.member_price.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <p className="text-[9px] text-[#2F3E34]/40 font-medium font-mono">
                        {p.type === 'service' ? 'บริการไม่จำกัด' : `คงเหลือ: ${p.stock_qty} ${p.unit}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#2F3E34]/40 py-10">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50 text-[#8FB996]" />
              <p className="text-xs">ไม่พบสินค้ารายการสุขภาพที่คุณกำลังค้นหา</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: SHOPPING CART */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-[#EAF2EC] p-5 flex flex-col justify-between h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#F8FAF7] shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#8FB996]" />
              <h4 className="text-xs font-bold text-[#2F3E34]">ตะกร้าจำหน่ายสินค้า ({cart.reduce((sum, item) => sum + item.qty, 0)})</h4>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[10px] text-[#E57373] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>

          {/* Customer Selection dropdown */}
          <div className="py-3 border-b border-[#F8FAF7] shrink-0">
            <label className="text-[10px] text-[#2F3E34]/45 font-bold block mb-1.5 uppercase tracking-wide">
              เลือกลูกค้า / สมาชิกสะสมแต้ม
            </label>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const cust = customers.find(c => c.id === e.target.value);
                setSelectedCustomer(cust || null);
                if (cust) {
                  showToast(`👤 ผูกสมาชิกในบิล: "${cust.fullname}" แล้ว (รับราคาสมาชิกและคะแนนสะสมคูณด้วยระดับ)`, 'success');
                } else {
                  showToast('👤 เปลี่ยนเป็นบิลลูกค้าทั่วไป ไม่สะสมแต้ม', 'info');
                }
              }}
              className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] font-medium focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
            >
              <option value="">-- ลูกค้าทั่วไป (ไม่มีแต้มสะสม) --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.fullname} ({c.phone}) - {c.tier.toUpperCase()} {c.points}แต้ม
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-3.5 space-y-3 pr-1 min-h-0">
            {cart.length > 0 ? (
              cart.map((item, idx) => {
                const itemPrice = selectedCustomer ? item.product.member_price : item.product.selling_price;
                const itemTotal = (itemPrice * item.qty) - (item.discount * item.qty);
                return (
                  <div key={idx} className="flex flex-col p-3 rounded-xl bg-[#F8FAF7]/80 border border-[#EAF2EC]/70 hover:border-[#8FB996]/20 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[#2F3E34] line-clamp-2 leading-relaxed">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] text-[#2F3E34]/40 font-mono mt-0.5">
                          ฿{itemPrice.toLocaleString()} / {item.product.unit}
                          {item.discount > 0 && <span className="text-[#E57373] ml-1.5">(-฿{item.discount} บ.)</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-[#2F3E34]/30 hover:text-[#E57373] transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Modifiers (Notes / Manual Discount Trigger) */}
                    {item.notes && (
                      <p className="text-[9px] bg-[#EBCB8B]/10 text-amber-700 font-semibold px-2 py-0.5 rounded-md mt-1.5 self-start flex items-center gap-1 leading-none">
                        <Notebook className="w-2.5 h-2.5" /> {item.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#EAF2EC]/40">
                      {/* Note & Discount Modifier Action Button */}
                      <button
                        onClick={() => openItemModifier(idx)}
                        className="text-[9px] text-[#8FB996] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>แก้ไขส่วนลด/หมายเหตุ</span>
                      </button>

                      {/* Qty Changer */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateCartQty(idx, item.qty - 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#EAF2EC] flex items-center justify-center text-xs hover:bg-gray-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3 text-[#2F3E34]" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateCartQty(idx, item.qty + 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#EAF2EC] flex items-center justify-center text-xs hover:bg-gray-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-[#2F3E34]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#2F3E34]/30 py-16">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#8FB996]" />
                <p className="text-xs">ตะกร้าจำหน่ายยังว่างเปล่า</p>
                <p className="text-[10px] mt-1 text-[#2F3E34]/40">กรุณาแตะสินค้าสุขภาพทางซ้ายเพื่อทำรายการ</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Summary, Coupon Entry and Checkout button */}
        <div className="shrink-0 border-t border-[#EAF2EC] pt-4 mt-2 space-y-4 bg-white">
          {/* Coupon Entry */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#2F3E34]/60 block">รหัสคูปองส่วนลด (Coupon)</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="รหัสคูปองส่วนลด (เช่น MUJILIFE)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 text-[11px] bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] uppercase"
              />
              <button
                type="button"
                onClick={() => applyCoupon()}
                className="px-3 py-2 rounded-xl bg-[#8FB996]/10 text-[#8FB996] hover:bg-[#8FB996] hover:text-white transition-all text-xs font-semibold cursor-pointer"
              >
                ใช้โค้ด
              </button>
            </div>

            {/* Clickable Active Coupons Selection */}
            {activeCouponsList.length > 0 && (
              <div className="space-y-1 mt-1.5">
                <span className="text-[9px] text-[#2F3E34]/40 block font-bold">คูปองที่เปิดใช้งานอยู่ (คลิกเลือก):</span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto py-0.5">
                  {activeCouponsList.map(cp => {
                    const isSelected = activeCoupon?.id === cp.id;
                    return (
                      <button
                        key={cp.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setActiveCoupon(null);
                            setCouponCode('');
                          } else {
                            applyCoupon(cp.code);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#8FB996] border-[#8FB996] text-white shadow-sm'
                            : 'bg-white hover:bg-[#8FB996]/5 border-[#EAF2EC] text-[#2F3E34]/80'
                        }`}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{cp.code}</span>
                        <span className={`text-[9px] font-normal ${isSelected ? 'text-white/80' : 'text-[#2F3E34]/55'}`}>
                          ({cp.type === 'percent' ? `-${cp.discount_value}%` : `-฿${cp.discount_value}`})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {activeCoupon && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#6CBF84]/10 border border-[#6CBF84]/25 text-[#6CBF84] text-[10px] font-bold">
              <span>🎟 คูปองลดราคาพิเศษ: {activeCoupon.code} ({activeCoupon.type === 'percent' ? `${activeCoupon.discount_value}%` : `฿${activeCoupon.discount_value}`})</span>
              <button type="button" onClick={() => { setActiveCoupon(null); setCouponCode(''); }} className="text-red-500 font-bold text-xs px-1 cursor-pointer">✕</button>
            </div>
          )}

          {/* Manual Custom Discount Entry */}
          <div className="space-y-1.5 border-t border-[#EAF2EC]/60 pt-3">
            <span className="text-[10px] font-bold text-[#2F3E34]/60 block">ส่วนลดกำหนดเองเพิ่มเติม (Manual Discount)</span>
            <div className="flex gap-2 items-center">
              {/* Type Switcher */}
              <div className="flex border border-[#EAF2EC] rounded-xl overflow-hidden bg-[#F8FAF7]">
                <button
                  type="button"
                  onClick={() => {
                    setCustomDiscountType('fixed');
                    setCustomDiscountValue(0);
                  }}
                  className={`px-2 py-1.5 text-[10px] font-bold cursor-pointer transition-all ${
                    customDiscountType === 'fixed'
                      ? 'bg-[#8FB996] text-white shadow-sm'
                      : 'text-[#2F3E34]/60 hover:bg-gray-100'
                  }`}
                >
                  บาท (฿)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomDiscountType('percent');
                    setCustomDiscountValue(0);
                  }}
                  className={`px-2 py-1.5 text-[10px] font-bold cursor-pointer transition-all ${
                    customDiscountType === 'percent'
                      ? 'bg-[#8FB996] text-white shadow-sm'
                      : 'text-[#2F3E34]/60 hover:bg-gray-100'
                  }`}
                >
                  เปอร์เซ็นต์ (%)
                </button>
              </div>

              {/* Input for Value */}
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0}
                  max={customDiscountType === 'percent' ? 100 : undefined}
                  placeholder={customDiscountType === 'percent' ? "ระบุเปอร์เซ็นต์ เช่น 10" : "ระบุจำนวนเงิน เช่น 100"}
                  value={customDiscountValue || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    if (customDiscountType === 'percent' && val > 100) {
                      setCustomDiscountValue(100);
                    } else {
                      setCustomDiscountValue(val);
                    }
                  }}
                  className="w-full text-[11px] bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl pl-3 pr-7 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] font-mono font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#2F3E34]/40">
                  {customDiscountType === 'percent' ? '%' : '฿'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Totals Breakdown */}
          <div className="space-y-1.5 text-xs font-medium text-[#2F3E34]/75">
            <div className="flex justify-between">
              <span>มูลค่าสินค้า</span>
              <span className="font-mono">฿{subtotal.toLocaleString()}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-[#E57373]">
                <span>ส่วนลดและโปรโมชั่นสุขภาพรวม</span>
                <span className="font-mono">-฿{totalDiscount.toLocaleString()}</span>
              </div>
            )}
            {settings.vat_rate > 0 && (
              <>
                <div className="flex justify-between text-[11px] text-[#2F3E34]/40">
                  <span>ฐานภาษีมูลค่าเพิ่ม ({settings.vat_rate}%)</span>
                  <span className="font-mono">฿{baseAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#2F3E34]/40">
                  <span>ภาษีมูลค่าเพิ่ม (VAT Included)</span>
                  <span className="font-mono">฿{vatAmount.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-base font-extrabold text-[#2F3E34] pt-2 border-t border-[#EAF2EC]/60">
              <span>ยอดชำระสุทธิ</span>
              <span className="text-[#8FB996] font-mono text-lg">฿{finalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Primary Action */}
          <button
            onClick={handleOpenCheckout}
            className="w-full py-4 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/95 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
          >
            ดำเนินการชำระเงิน (฿{finalAmount.toLocaleString()})
          </button>
        </div>
      </div>

      {/* MODAL 1: ITEM MODIFIERS (DISCOUNT & NOTES) */}
      {editingItemIdx !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h4 className="text-sm font-bold text-[#2F3E34] mb-3">แก้ไขข้อมูลสินค้าในบิลขาย</h4>
            <p className="text-xs text-[#2F3E34]/50 mb-4">{cart[editingItemIdx].product.name}</p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">ส่วนลดพิเศษต่อชิ้น (บาท)</label>
                <input
                  type="number"
                  step="any"
                  min={0}
                  value={itemDiscount}
                  onChange={(e) => setItemDiscount(Number(e.target.value) || 0)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">หมายเหตุรายละเอียดเพิ่มเติม</label>
                <input
                  type="text"
                  placeholder="เช่น ห่อใบชาแยกชิ้น, ไม่รับถุงพลาสติก"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setEditingItemIdx(null)}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveItemModifier}
                className="flex-1 py-2 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-xs font-semibold cursor-pointer"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHECKOUT MULTI-PAYMENT DRAWER */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-4xl animate-fade-in flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAF2EC] mb-4">
              <h3 className="text-sm font-bold text-[#2F3E34]">หน้าต่างประมวลผลการชำระเงิน</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-[#2F3E34]/40 hover:text-black font-semibold p-1">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Payment Selector and Cash Calculations */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-[#2F3E34]/45 font-bold uppercase block mb-1.5">ช่องทางชำระเงินสุขภาพ</label>
                  <div className="space-y-2">
                    {[
                      { id: 'cash', name: 'เงินสด (Cash)', icon: Coins },
                      { id: 'promptpay', name: 'QR PromptPay', icon: QrCode },
                      { id: 'transfer', name: 'โอนเงินบัญชีธนาคาร (Bank Transfer)', icon: RefreshCw },
                      { id: 'credit', name: 'บัตรเครดิต (Credit Card)', icon: CreditCard },
                      { id: 'wallet', name: 'กระเป๋าเงินอิเล็กทรอนิกส์ (E-Wallet)', icon: Tag }
                    ].map(pay => {
                      const Icon = pay.icon;
                      return (
                        <button
                          key={pay.id}
                          onClick={() => {
                            setPaymentMethod(pay.id as any);
                            if (pay.id !== 'cash') {
                              setReceivedAmount(finalAmount); // exact amount for non-cash
                            }
                          }}
                          className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                            paymentMethod === pay.id
                              ? 'bg-[#8FB996]/10 border-[#8FB996] text-[#8FB996]'
                              : 'border-[#EAF2EC] text-[#2F3E34]/70 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{pay.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic details based on Selected Method */}
              <div className="space-y-4 bg-[#F8FAF7] rounded-xl p-4 border border-[#EAF2EC]">
                <div className="text-center pb-2.5 border-b border-[#EAF2EC]">
                  <p className="text-[11px] text-[#2F3E34]/50">ยอดชำระเงินที่ต้องการ</p>
                  <h4 className="text-2xl font-black text-[#2F3E34] font-mono">฿{finalAmount.toLocaleString()}</h4>
                </div>

                {paymentMethod === 'cash' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">ยอดเงินสดที่ได้รับมา (บาท)</label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={receivedAmount || ''}
                        onChange={(e) => setReceivedAmount(Number(e.target.value) || 0)}
                        className="w-full text-base font-bold font-mono text-center bg-white border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                      />
                    </div>

                    {/* Quick Cash Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {[finalAmount, 100, 500, 1000].map((val, idx) => {
                        let finalVal = val;
                        if (val === 100 && finalAmount > 100) return null; // skip tiny shortcuts
                        return (
                          <button
                            key={idx}
                            onClick={() => setReceivedAmount(val)}
                            className="bg-white hover:bg-gray-100 text-[10px] font-bold border border-[#EAF2EC] py-2 rounded-xl text-center cursor-pointer font-mono"
                          >
                            {val === finalAmount ? 'พอดีบิล' : `฿${val}`}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2.5 border-t border-[#EAF2EC] text-center">
                      <p className="text-[10px] text-[#2F3E34]/45 font-bold">เงินทอนที่ต้องส่งคืน</p>
                      <h4 className={`text-xl font-bold font-mono ${receivedAmount - finalAmount >= 0 ? 'text-[#6CBF84]' : 'text-[#E57373]'}`}>
                        ฿{(receivedAmount - finalAmount >= 0 ? (receivedAmount - finalAmount) : 0).toLocaleString()}
                      </h4>
                    </div>
                  </div>
                ) : (paymentMethod === 'promptpay' || paymentMethod === 'transfer') ? (
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="bg-white rounded-xl border border-[#EAF2EC] p-4 flex flex-col items-center shadow-sm w-full relative">
                      {settings.qr_code_url ? (
                        <div className="w-40 h-40 flex items-center justify-center border border-[#EAF2EC] rounded-xl overflow-hidden bg-white p-1 shadow-inner">
                          <img
                            src={getProxyImage(settings.qr_code_url)}
                            alt="QR Code สำหรับสแกนจ่าย"
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-40 h-40 bg-[#0f345c] flex flex-col items-center justify-center rounded-xl p-3 text-white shadow-inner">
                          <QrCode className="w-20 h-20 mb-1.5" />
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-300">PromptPay QR</span>
                          <span className="text-[11px] font-mono tracking-wider font-bold">฿{finalAmount.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Payment text specifications */}
                      <div className="w-full mt-3 pt-3 border-t border-dashed border-gray-200 text-left space-y-1 text-xs text-[#2F3E34]">
                        <div className="flex justify-between items-center bg-[#8FB996]/5 p-1.5 rounded-lg border border-[#8FB996]/15">
                          <span className="text-[10px] text-gray-500 font-semibold">ช่องทางชำระเงิน</span>
                          <span className="font-bold text-[#8FB996]">{settings.bank_name || (paymentMethod === 'promptpay' ? 'พร้อมเพย์' : 'โอนบัญชี')}</span>
                        </div>
                        {settings.account_no && (
                          <div className="flex justify-between items-center px-1.5 py-1">
                            <span className="text-[10px] text-gray-400 font-semibold">เลขบัญชี/เบอร์โทร</span>
                            <span className="font-mono font-bold text-gray-700 text-xs">{settings.account_no}</span>
                          </div>
                        )}
                        {settings.account_name && (
                          <div className="flex justify-between items-center px-1.5 py-1">
                            <span className="text-[10px] text-gray-400 font-semibold">ชื่อบัญชี</span>
                            <span className="font-semibold text-gray-600 text-xs truncate max-w-[140px]" title={settings.account_name}>{settings.account_name}</span>
                          </div>
                        )}
                        {!settings.bank_name && !settings.account_no && paymentMethod === 'promptpay' && (
                          <div className="flex justify-between items-center px-1.5 py-1">
                            <span className="text-[10px] text-gray-400 font-semibold">เบอร์พร้อมเพย์</span>
                            <span className="font-mono font-bold text-gray-700 text-xs">{settings.promptpay_num}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#2F3E34]/60 font-medium leading-relaxed max-w-[220px]">
                      สแกนจ่ายหรือโอนเงินผ่านรายละเอียดด้านบน และโปรดตรวจสอบยอดสลิปยืนยันตรงตามยอดซื้อสุทธิ
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-[#2F3E34]/50">
                    <Clock className="w-10 h-10 mb-2 text-[#8FB996] animate-spin" />
                    <p className="text-xs font-semibold">ขั้นตอนชำระเงินพิเศษ ({paymentMethod === 'credit' ? 'บัตรเครดิต' : 'วอลเล็ต'})</p>
                    <p className="text-[9px] max-w-[200px] mt-1 leading-relaxed">
                      ลูกค้าส่งหลักฐานสลิป หรือรูดบัตรเครื่องอ่านภายนอก แคชเชียร์ตรวจสอบยอดตรงกันแล้วบันทึก
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6 border-t border-[#EAF2EC] pt-4 shrink-0">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleCheckoutSubmit}
                disabled={isProcessingPayment}
                className="flex-1 py-3 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 disabled:bg-[#8FB996]/50 text-white text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังประมวลผล...</span>
                  </>
                ) : (
                  <span>ยืนยันชำระเงินสำเร็จ</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: COMPLETED RECEIPT MODAL */}
      {showReceiptModal && completedSale && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-start justify-center z-50 p-4 overflow-y-auto animate-fade-in cursor-pointer"
          onClick={() => {
            setShowReceiptModal(false);
            setCompletedSale(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-4xl h-[90vh] my-4 md:my-8 flex flex-col animate-slide-up cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto pr-1 flex justify-center">
              <div className="bg-white border border-[#EAF2EC] rounded-xl p-5 text-[#2F3E34]/90 space-y-5 font-mono select-text shadow-sm relative w-full max-w-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#8FB996]/30"></div>
                
                {/* Store Header Info */}
                <div className="text-center space-y-1 flex flex-col items-center justify-center pt-2">
                  {settings.logo && (
                    <img 
                      src={getProxyImage(settings.logo)} 
                      alt="Store Logo" 
                      className="max-h-14 max-w-full object-contain mb-2 rounded-lg" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <h4 className="text-sm font-bold font-sans text-center">{settings.store_name}</h4>
                  <p className="text-[10px] font-sans text-[#2F3E34]/60 leading-normal text-center max-w-[200px]">{settings.address}</p>
                  {settings.tax_id && <p className="text-[10px] text-[#2F3E34]/50 text-center">เลขผู้เสียภาษี: {settings.tax_id}</p>}
                  <div className="w-full border-t border-dashed border-[#2F3E34]/10 my-3"></div>
                </div>

                {/* Metadata Header */}
                <div className="space-y-1 text-[10px] text-[#2F3E34]/60">
                  <div className="flex justify-between">
                    <span>เลขที่ใบรับเงิน:</span>
                    <span className="font-bold">{completedSale.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>วันที่ทำรายการ:</span>
                    <span>{new Date(completedSale.created_at).toLocaleString('th-TH')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>พนักงานแคชเชียร์:</span>
                    <span>{currentUser.fullname}</span>
                  </div>
                  {selectedCustomer && (
                    <div className="flex justify-between font-bold text-[#8FB996]">
                      <span>สมาชิกรับแต้ม:</span>
                      <span>{selectedCustomer.fullname}</span>
                    </div>
                  )}
                  <div className="w-full border-t border-dashed border-[#2F3E34]/10 my-3"></div>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-2.5">
                  {completedSale.items.map((item: any, idx: number) => {
                    const matchedProd = products.find(p => p.id === item.product_id);
                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-bold text-[#2F3E34] text-[11px]">
                          <span className="font-sans line-clamp-1">{matchedProd?.name || 'รายการสินค้า'}</span>
                          <span className="font-mono">฿{item.total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#2F3E34]/50">
                          <span>{item.qty} {matchedProd?.unit || 'ชิ้น'} x ฿{item.price.toLocaleString()}</span>
                          {item.discount > 0 && <span>ลด: -฿{item.discount * item.qty}</span>}
                        </div>
                      </div>
                    );
                  })}
                  <div className="w-full border-t border-dashed border-[#2F3E34]/10 my-3"></div>
                </div>

                {/* Receipt Calculations */}
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between text-[#2F3E34]/70">
                    <span>มูลค่าสินค้ารวม:</span>
                    <span>฿{completedSale.total_amount.toLocaleString()}</span>
                  </div>
                  {completedSale.discount_amount > 0 && (
                    <div className="flex justify-between text-red-500 font-bold">
                      <span>ส่วนลดโปรโมชั่น:</span>
                      <span>-฿{completedSale.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  {settings.vat_rate > 0 && (
                    <div className="bg-gray-50/50 p-1.5 rounded-lg space-y-0.5 my-1">
                      <div className="flex justify-between text-[9px] text-[#2F3E34]/40">
                        <span>ฐานภาษี (Vat. Excluded):</span>
                        <span>฿{(completedSale.final_amount - completedSale.vat_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-[#2F3E34]/40">
                        <span>ภาษีมูลค่าเพิ่ม ({settings.vat_rate}%):</span>
                        <span>฿{completedSale.vat_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-[16px] text-[#2F3E34] pt-2 border-t border-dashed border-[#2F3E34]/20 mt-1">
                    <span>ยอดสุทธิ:</span>
                    <span className="font-mono">฿{completedSale.final_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#2F3E34]/60 pt-1 text-[11px] font-bold">
                    <span>ชำระผ่าน ({completedSale.payment_method === 'cash' ? 'เงินสด' : 'โอน/พร้อมเพย์'}):</span>
                    <span>฿{completedSale.received_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-600 font-extrabold text-[14px]">
                    <span>เงินทอน:</span>
                    <span>฿{completedSale.change_amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-center pt-5 border-t border-dashed border-[#2F3E34]/20 space-y-1.5">
                  <p className="font-sans font-bold text-[11px]">ขอให้ท่านมีสุขภาพกายใจที่ดีและร่มเย็น</p>
                  <p className="font-sans text-[#2F3E34]/40 text-[9px] font-medium tracking-widest uppercase">*** Thank You ***</p>
                </div>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="grid grid-cols-2 gap-3 mt-6 shrink-0">
              <button
                onClick={() => {
                  showToast('🖨 กำลังพิมพ์ใบเสร็จ (จำลองการทำงานเครื่องพิมพ์)...', 'success');
                }}
                className="py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Printer className="w-4 h-4 text-gray-500" /> <span>พิมพ์สลิป</span>
              </button>
              <button
                onClick={() => {
                  showToast('📥 ดาวน์โหลดไฟล์ใบเสร็จ PDF สำเร็จ', 'success');
                }}
                className="py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Download className="w-4 h-4 text-gray-500" /> <span>ไฟล์ PDF</span>
              </button>
              <button
                onClick={() => {
                  showToast('💬 ส่งใบเสร็จรับเงินให้ลูกค้าผ่านไลน์เรียบร้อย', 'success');
                }}
                className="py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Share2 className="w-4 h-4 text-[#06C755]" /> <span>ส่ง LINE</span>
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setCompletedSale(null);
                }}
                className="py-3 rounded-xl bg-[#8FB996] hover:bg-[#7da885] text-white text-xs font-extrabold shadow-sm cursor-pointer text-center transition-all active:scale-95"
              >
                รายการใหม่
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
