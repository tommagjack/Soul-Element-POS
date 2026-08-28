/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Product, ProductCategory, getProxyImage } from '../types';
import {
  Plus,
  Edit2,
  Trash2,
  Tag,
  Search,
  ChevronDown,
  ChevronUp,
  Inbox,
  AlertCircle,
  FileCheck2,
  Boxes,
  Upload
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    suppliers,
    addProduct,
    editProduct,
    deleteProduct,
    addCategory,
    editCategory,
    deleteCategory,
    showToast
  } = useDb();

  // Search, Filter and Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'sku' | 'name' | 'stock' | 'price'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modals Toggles
  const [showProdModal, setShowProdModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Custom Confirmation Dialog
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetType, setDeleteTargetType] = useState<'product' | 'category'>('product');

  // Category Manager State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Product Form Fields
  const [formBarcode, setFormBarcode] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formCostPrice, setFormCostPrice] = useState(0);
  const [formSellingPrice, setFormSellingPrice] = useState(0);
  const [formMemberPrice, setFormMemberPrice] = useState(0);
  const [formUnit, setFormUnit] = useState('ขวด');
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formMinStock, setFormMinStock] = useState(5);
  const [formStockQty, setFormStockQty] = useState(0);
  const [formType, setFormType] = useState<'product' | 'service'>('product');
  const [formDescription, setFormDescription] = useState('');

  // Handle Sort Toggle
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'newest' ? 'desc' : 'asc');
    }
  };

  // Filtered and Sorted Products list
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCatFilter === 'all' || p.category_id === selectedCatFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'newest') {
      const idxA = products.findIndex(p => p.id === a.id);
      const idxB = products.findIndex(p => p.id === b.id);
      comp = idxA - idxB;
    } else if (sortBy === 'sku') comp = a.sku.localeCompare(b.sku);
    else if (sortBy === 'name') comp = a.name.localeCompare(b.name);
    else if (sortBy === 'stock') comp = a.stock_qty - b.stock_qty;
    else if (sortBy === 'price') comp = a.selling_price - b.selling_price;
    return sortOrder === 'asc' ? comp : -comp;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Open Product Form for creating
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormBarcode(Math.floor(1000000000000 + Math.random() * 9000000000000).toString()); // random barcode prefix
    setFormSku(`EO-${Math.random().toString(36).substr(2, 4).toUpperCase()}`);
    setFormName('');
    setFormImage('https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=200');
    setFormCategoryId(categories[0]?.id || '');
    setFormCostPrice(100);
    setFormSellingPrice(250);
    setFormMemberPrice(220);
    setFormUnit('ขวด');
    setFormSupplierId(suppliers[0]?.id || '');
    setFormMinStock(5);
    setFormStockQty(10);
    setFormType('product');
    setFormDescription('');
    setShowProdModal(true);
  };

  // Open Product Form for editing
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormBarcode(prod.barcode);
    setFormSku(prod.sku);
    setFormName(prod.name);
    setFormImage(prod.image);
    setFormCategoryId(prod.category_id);
    setFormCostPrice(prod.cost_price);
    setFormSellingPrice(prod.selling_price);
    setFormMemberPrice(prod.member_price);
    setFormUnit(prod.unit);
    setFormSupplierId(prod.supplier_id);
    setFormMinStock(prod.min_stock);
    setFormStockQty(prod.stock_qty);
    setFormType(prod.type || 'product');
    setFormDescription(prod.description || '');
    setShowProdModal(true);
  };

  // Submit Product Form
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBarcode.trim() || !formSku.trim() || !formName.trim()) {
      showToast('⚠️ กรุณากรอกรหัส บาร์โค้ด และชื่อสินค้าให้ครบถ้วน', 'warning');
      return;
    }
    if (formSellingPrice <= formCostPrice) {
      showToast('⚠️ คำเตือน: ราคาขายต่ำกว่าหรือเท่ากับราคาทุนสปา', 'warning');
    }

    const payload = {
      barcode: formBarcode,
      sku: formSku,
      name: formName,
      image: formImage,
      category_id: formCategoryId,
      cost_price: Number(formCostPrice) || 0,
      selling_price: Number(formSellingPrice) || 0,
      member_price: Number(formMemberPrice) || 0,
      unit: formUnit,
      supplier_id: formSupplierId,
      min_stock: formType === 'service' ? 0 : (Number(formMinStock) || 0),
      stock_qty: formType === 'service' ? 999999 : (Number(formStockQty) || 0),
      type: formType,
      status: 'active' as const,
      description: formDescription
    };

    if (editingProduct) {
      editProduct(editingProduct.id, payload);
    } else {
      addProduct({ ...payload, initial_stock: payload.stock_qty });
    }
    setShowProdModal(false);
  };

  // Delete Action triggers confirmation dialog
  const triggerDeleteConfirm = (id: string, type: 'product' | 'category') => {
    setDeleteTargetId(id);
    setDeleteTargetType(type);
  };

  const handleExecuteDelete = () => {
    if (!deleteTargetId) return;

    if (deleteTargetType === 'product') {
      deleteProduct(deleteTargetId);
    } else {
      deleteCategory(deleteTargetId);
    }
    setDeleteTargetId(null);
  };

  // Category CRUD
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('⚠️ กรุณาระบุชื่อหมวดหมู่ที่ต้องการเปิด', 'warning');
      return;
    }

    if (editingCatId) {
      editCategory(editingCatId, newCatName, newCatDesc);
      setEditingCatId(null);
    } else {
      addCategory(newCatName, newCatDesc);
    }
    setNewCatName('');
    setNewCatDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Sub-header Buttons block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2.5 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> <span>เพิ่มสินค้าใหม่</span>
          </button>
          <button
            onClick={() => {
              setEditingCatId(null);
              setNewCatName('');
              setNewCatDesc('');
              setShowCatModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#EAF2EC] hover:bg-gray-50 text-[#2F3E34] font-semibold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Tag className="w-4 h-4 text-[#8FB996]" /> <span>จัดการหมวดหมู่สินค้า</span>
          </button>
        </div>

        {/* Real-time search and filter tools */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#2F3E34]/35" />
            <input
              type="text"
              placeholder="ค้นหาบาร์โค้ด / SKU / ชื่อสินค้า..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl pl-10 pr-4 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
            />
          </div>

          <select
            value={selectedCatFilter}
            onChange={(e) => {
              setSelectedCatFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] font-medium focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
          >
            <option value="all">ทุกหมวดหมู่สินค้า</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-white border border-[#EAF2EC] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAF7] border-b border-[#EAF2EC] text-[#2F3E34]/60 text-[11px] font-bold tracking-wider uppercase">
                <th className="py-4 px-5">รูปสินค้า</th>
                <th className="py-4 px-4 cursor-pointer hover:bg-gray-100/50" onClick={() => toggleSort('sku')}>
                  <div className="flex items-center gap-1">
                    <span>SKU / บาร์โค้ด</span>
                    {sortBy === 'sku' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:bg-gray-100/50" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>ชื่อสินค้า / บริการ</span>
                    {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="py-4 px-4">หมวดหมู่</th>
                <th className="py-4 px-4 cursor-pointer hover:bg-gray-100/50" onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-1">
                    <span>ราคาขาย (บาท)</span>
                    {sortBy === 'price' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:bg-gray-100/50" onClick={() => toggleSort('stock')}>
                  <div className="flex items-center gap-1">
                    <span>ยอดคงเหลือ</span>
                    {sortBy === 'stock' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="py-4 px-4">ผู้จำหน่าย</th>
                <th className="py-4 px-5 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2EC] text-xs">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map(p => {
                  const catName = categories.find(c => c.id === p.category_id)?.name || 'ทั่วไป';
                  const supName = suppliers.find(s => s.id === p.supplier_id)?.company_name || 'ไม่ระบุ';
                  const isLowStock = p.stock_qty <= p.min_stock;
                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAF7]/30 transition-all">
                      <td className="py-3 px-5 shrink-0">
                        <img
                          src={getProxyImage(p.image) || 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=200'}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-[#EAF2EC]"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#2F3E34]">{p.sku}</p>
                        <p className="text-[10px] text-[#2F3E34]/40 font-mono">BC: {p.barcode}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#2F3E34] line-clamp-1 max-w-[200px]">
                          {p.name}
                          {p.type === 'service' && <span className="ml-2 text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-bold uppercase">Service</span>}
                        </p>
                        <p className="text-[10px] text-[#2F3E34]/50 font-medium line-clamp-1 max-w-[200px]">{p.description || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-[#2F3E34]/70">
                        <span className="bg-[#8FB996]/10 text-[#8FB996] px-2 py-1 rounded-md text-[10px] font-semibold">
                          {catName.split(' (')[0]}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        <p className="text-[#2F3E34]">฿{p.selling_price.toLocaleString()}</p>
                        <p className="text-[10px] text-[#2F3E34]/40">สมาชิก: ฿{p.member_price.toLocaleString()}</p>
                      </td>
                      <td className="py-3 px-4">
                        {p.type === 'product' ? (
                          <>
                            <p className={`font-semibold font-mono ${isLowStock ? 'text-[#E57373]' : 'text-[#2F3E34]'}`}>
                              {p.stock_qty} {p.unit}
                            </p>
                            {isLowStock && (
                              <span className="text-[9px] text-[#E57373] bg-[#E57373]/10 px-1.5 py-0.5 rounded-full font-bold">
                                ต่ำกว่าขั้นต่ำ {p.min_stock}
                              </span>
                            )}
                          </>
                        ) : (
                          <p className="text-[#2F3E34]/40 font-semibold italic">ไม่จำกัด</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#2F3E34]/50 truncate max-w-[120px]" title={supName}>
                        {supName}
                      </td>
                      <td className="py-3 px-5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200/60 text-[#2F3E34]/70 transition-colors cursor-pointer inline-flex"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDeleteConfirm(p.id, 'product')}
                          className="p-1.5 rounded-lg bg-[#E57373]/10 hover:bg-[#E57373]/20 text-[#E57373] transition-colors cursor-pointer inline-flex"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#2F3E34]/40">
                    <Inbox className="w-12 h-12 mx-auto mb-2 text-[#8FB996] opacity-60" />
                    <p className="text-sm font-semibold">ไม่พบข้อมูลผลิตภัณฑ์สุขภาพสะสม</p>
                    <p className="text-xs mt-1">กรุณากดปุ่มเพิ่มสินค้าใหม่เพื่อวางตลาดผลิตภัณฑ์สุขภาพ</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-[#F8FAF7] border-t border-[#EAF2EC] px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-[#2F3E34]/50">หน้า {currentPage} จากทั้งหมด {totalPages} หน้า</span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl border border-[#EAF2EC] bg-white text-[#2F3E34] text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                ก่อนหน้า
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl border border-[#EAF2EC] bg-white text-[#2F3E34] text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD/EDIT PRODUCT DRAWER */}
      {showProdModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#EAF2EC] mb-4 shrink-0">
              <h3 className="text-sm font-bold text-[#2F3E34]">
                {editingProduct ? 'อัปเดตข้อมูลรายละเอียดสินค้าสุขภาพ' : 'เพิ่มผลิตภัณฑ์สุขภาพใหม่เข้าระบบ'}
              </h3>
              <button onClick={() => setShowProdModal(false)} className="text-gray-400 hover:text-black font-semibold p-1">✕</button>
            </div>

            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Type Selection */}
              <div className="flex gap-2 p-1 bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl mb-2">
                <button
                  type="button"
                  onClick={() => setFormType('product')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formType === 'product' ? 'bg-[#8FB996] text-white shadow-sm' : 'text-[#2F3E34]/50 hover:bg-gray-100'}`}
                >
                  สินค้า (Product)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('service')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formType === 'service' ? 'bg-[#8FB996] text-white shadow-sm' : 'text-[#2F3E34]/50 hover:bg-gray-100'}`}
                >
                  บริการ (Service)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">รหัส SKU คลัง</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">รหัสบาร์โค้ดสินค้า (Barcode)</label>
                  <input
                    type="text"
                    required
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ชื่อสินค้าสุขภาพที่แสดงในบิล</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">หมวดหมู่สินค้า</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="ขวด, กล่อง, ซอง..."
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ราคาทุนสปา (บาท)</label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ราคาขายหน้าร้าน (บาท)</label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ราคาเฉพาะสมาชิก (บาท)</label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={formMemberPrice}
                    onChange={(e) => setFormMemberPrice(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ผู้ผลิต / คู่ค้าส่งสินค้า</label>
                  <select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.company_name}</option>
                    ))}
                  </select>
                </div>

                {formType === 'product' && (
                  <>
                    <div>
                      <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">เกณฑ์ขั้นต่ำเตือนใกล้หมด</label>
                      <input
                        type="number"
                        value={formMinStock}
                        onChange={(e) => setFormMinStock(Number(e.target.value) || 0)}
                        className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">
                        {editingProduct ? 'จำนวนสต๊อกปัจจุบัน' : 'สต็อกสินค้าเริ่มต้น'}
                      </label>
                      <input
                        type="number"
                        value={formStockQty}
                        onChange={(e) => setFormStockQty(Number(e.target.value) || 0)}
                        className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] font-bold text-[#8FB996]"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">รูปภาพตัวสินค้า (URL แหล่งอ้างอิง หรืออัปโหลด)</label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="วาง URL รูปภาพที่นี่ หรือกดไอคอนขวาเพื่ออัปโหลด"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        className="flex-1 text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                      />
                      <label className="w-10 h-10 bg-[#8FB996] text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#8FB996]/90 shrink-0 shadow-sm transition-colors">
                        <Upload className="w-4 h-4" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 1 * 1024 * 1024) {
                                alert('❌ ขนาดไฟล์รูปภาพต้องไม่เกิน 1MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => setFormImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {formImage && (
                      <div className="w-10 h-10 rounded-xl border border-[#EAF2EC] bg-white overflow-hidden flex items-center justify-center shrink-0">
                        <img src={getProxyImage(formImage)} alt="Preview" className="max-w-full max-h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">รายละเอียดสรรพคุณสินค้าสุขภาพ</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-[#EAF2EC] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProdModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer text-center"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-xs font-bold shadow-md cursor-pointer text-center"
                >
                  {editingProduct ? 'บันทึกการแก้ไขข้อมูล' : 'บันทึกเปิดสินค้าใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CATEGORY MANAGER DRAWER */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-lg animate-fade-in flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAF2EC] mb-4 shrink-0">
              <h3 className="text-sm font-bold text-[#2F3E34]">จัดการหมวดหมู่สินค้าสุขภาพหลัก</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-black font-semibold p-1">✕</button>
            </div>

            {/* List and CRUD of Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
              {/* Category form */}
              <form onSubmit={handleCategorySubmit} className="space-y-3.5 bg-[#F8FAF7] rounded-xl p-4 border border-[#EAF2EC] shrink-0 self-start">
                <h4 className="text-[11px] font-bold text-[#8FB996] uppercase">
                  {editingCatId ? 'แก้ไขหมวดหมู่ที่มีอยู่' : 'สร้างหมวดหมู่ใหม่'}
                </h4>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-semibold block mb-1">ชื่อหมวดหมู่สุขภาพ (เช่น ชาสมุนไพร)</label>
                  <input
                    type="text"
                    required
                    placeholder="ระบุชื่อภาษาไทย..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-semibold block mb-1">คำอธิบายหมวดหมู่</label>
                  <textarea
                    rows={2}
                    placeholder="ระบุรายละเอียดสั้นๆ..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full text-xs bg-white border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div className="flex gap-1.5 pt-1">
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={() => { setEditingCatId(null); setNewCatName(''); setNewCatDesc(''); }}
                      className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 text-[10px] font-bold rounded-lg cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    {editingCatId ? 'บันทึก' : 'ยืนยันเพิ่ม'}
                  </button>
                </div>
              </form>

              {/* List table */}
              <div className="overflow-y-auto max-h-full pr-1 space-y-2">
                {categories.map(c => (
                  <div key={c.id} className="p-3 bg-white border border-[#EAF2EC] rounded-xl flex items-center justify-between hover:shadow-sm transition-all">
                    <div>
                      <p className="text-xs font-bold text-[#2F3E34]">{c.name}</p>
                      <p className="text-[10px] text-[#2F3E34]/50 font-medium leading-relaxed mt-0.5">{c.description || 'ไม่มีคำอธิบาย'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingCatId(c.id);
                          setNewCatName(c.name);
                          setNewCatDesc(c.description || '');
                        }}
                        className="p-1 rounded-md text-[#2F3E34]/50 hover:bg-[#8FB996]/10 hover:text-[#8FB996] cursor-pointer"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => triggerDeleteConfirm(c.id, 'category')}
                        className="p-1 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowCatModal(false)}
              className="mt-4 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-xs font-semibold rounded-xl cursor-pointer shrink-0"
            >
              ปิดหน้าต่างจัดการ
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: STANDARD RELIABLE POPUP ON DELETIONS */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-xs animate-fade-in text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-[#E57373] mb-3" />
            <h4 className="text-sm font-bold text-[#2F3E34] mb-1">ยืนยันการลบข้อมูลนี้?</h4>
            <p className="text-[10px] text-[#2F3E34]/60 mb-5 leading-relaxed">
              {deleteTargetType === 'product'
                ? 'หากลบสินค้า ข้อมูลสินค้าในสต็อกจะสูญหายถาวร แต่หากมีประวัติการขายสินค้าชิ้นนี้ ระบบจะเพียงแค่ทำการปิดใช้งานสินค้าให้ปลอดภัยแทน'
                : 'ไม่สามารถกู้คืนข้อมูลหมวดหมู่นี้ได้หลังจากกดยืนยันการทำงาน'}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleExecuteDelete}
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
