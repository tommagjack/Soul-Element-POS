/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDb } from '../context/DbContext';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CircleAlert,
  Inbox,
  UserCheck,
  Coins,
  ArrowUpRight,
  PackageX,
  PlusCircle,
  FileCheck2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const DashboardView: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { sales, products, categories, financials, auditLogs } = useDb();

  // Helper date parsing
  const isToday = (dateStr: string) => {
    const today = new Date().toDateString();
    return new Date(dateStr).toDateString() === today;
  };

  const isThisMonth = (dateStr: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  // Metrics Calculations
  const salesToday = sales.filter(s => isToday(s.created_at));
  const salesThisMonth = sales.filter(s => isThisMonth(s.created_at));

  const revenueToday = salesToday.reduce((sum, s) => sum + s.final_amount, 0);
  const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + s.final_amount, 0);

  const billsTodayCount = salesToday.length;
  const totalProductsCount = products.length;
  const lowStockProducts = products.filter(p => p.type === 'product' && p.stock_qty <= p.min_stock && p.status === 'active');

  // Profit calculation (revenue minus COGS / cost of goods sold)
  const calculateCOGSMargin = (saleList: typeof sales) => {
    return saleList.reduce((sum, s) => {
      const cogs = s.items.reduce((itemSum, item) => {
        const prod = products.find(p => p.id === item.product_id);
        const cost = prod ? prod.cost_price : item.price * 0.5; // fallback 50% cost if product not found
        return itemSum + (cost * item.qty);
      }, 0);
      return sum + (s.final_amount - cogs);
    }, 0);
  };

  const profitThisMonth = calculateCOGSMargin(salesThisMonth);

  // Incomes & Expenses (excluding standard sales and purchase expenses to avoid double counting, or including them for raw summary)
  const totalIncomes = financials.filter(f => f.type === 'income' && isThisMonth(f.created_at)).reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = financials.filter(f => f.type === 'expense' && isThisMonth(f.created_at)).reduce((sum, f) => sum + f.amount, 0);

  // 1. Chart Data: Daily Sales and Profits Trend (Current Month)
  const getDailySalesTrendData = () => {
    const dayMap: { [key: string]: { sales: number; profit: number } } = {};
    const last10Days: string[] = [];
    
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      dayMap[dateKey] = { sales: 0, profit: 0 };
      last10Days.push(dateKey);
    }

    sales.forEach(s => {
      const dateKey = new Date(s.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      if (dayMap[dateKey] !== undefined) {
        dayMap[dateKey].sales += s.final_amount;
        
        // calculate profit
        const cogs = s.items.reduce((sum, item) => {
          const prod = products.find(p => p.id === item.product_id);
          const cost = prod ? prod.cost_price : item.price * 0.5;
          return sum + (cost * item.qty);
        }, 0);
        dayMap[dateKey].profit += (s.final_amount - cogs);
      }
    });

    return last10Days.map(day => ({
      name: day,
      'ยอดขาย (บาท)': Math.round(dayMap[day].sales),
      'กำไรสุทธิ (บาท)': Math.round(dayMap[day].profit)
    }));
  };

  const chartSalesTrend = getDailySalesTrendData();

  // 2. Chart Data: Best Selling Products
  const getBestSellersData = () => {
    const countMap: { [key: string]: { name: string; qty: number } } = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          if (!countMap[prod.id]) {
            countMap[prod.id] = { name: prod.name, qty: 0 };
          }
          countMap[prod.id].qty += item.qty;
        }
      });
    });

    return Object.values(countMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map(item => ({
        name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
        'จำนวนที่ขายได้': item.qty
      }));
  };

  const bestSellers = getBestSellersData();

  // 3. Chart Data: Best Selling Categories
  const getCategoryShareData = () => {
    const shareMap: { [key: string]: number } = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          const cat = categories.find(c => c.id === prod.category_id);
          const catName = cat ? cat.name : 'ทั่วไป';
          shareMap[catName] = (shareMap[catName] || 0) + item.total;
        }
      });
    });

    const colors = ['#8FB996', '#A1CBB4', '#B4DDD2', '#C6EFEC', '#D7E8D4'];
    return Object.entries(shareMap).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  };

  const categoryShare = getCategoryShareData();

  return (
    <div className="space-y-6">
      {/* 4 Block Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="glass-card rounded-xl p-5 border border-white/40 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#2F3E34]/50 tracking-wide uppercase">ยอดขายวันนี้</p>
              <h3 className="text-2xl font-bold text-[#2F3E34] mt-1 font-mono">
                ฿{revenueToday.toLocaleString()}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#8FB996]/10 text-[#8FB996] flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] font-semibold text-[#8FB996]">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>ยอดขายจริงตามวันทำการล่าสุด</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card rounded-xl p-5 border border-white/40 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#2F3E34]/50 tracking-wide uppercase">ยอดขายเดือนนี้</p>
              <h3 className="text-2xl font-bold text-[#2F3E34] mt-1 font-mono">
                ฿{revenueThisMonth.toLocaleString()}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#6CBF84]/10 text-[#6CBF84] flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] font-semibold text-[#6CBF84]">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>เติบโตอย่างมั่นคงจากลูกค้าสุขภาพ</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card rounded-xl p-5 border border-white/40 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#2F3E34]/50 tracking-wide uppercase">กำไรขั้นต้น (เดือนนี้)</p>
              <h3 className="text-2xl font-bold text-[#6CBF84] mt-1 font-mono">
                ฿{profitThisMonth.toLocaleString()}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] font-semibold text-amber-600">
            <span>คำนวณสุทธิหลังหักต้นทุนสินค้า</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card rounded-xl p-5 border border-white/40 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#2F3E34]/50 tracking-wide uppercase">จำนวนธุรกรรม (บิลวันนี้)</p>
              <h3 className="text-2xl font-bold text-[#2F3E34] mt-1 font-mono">
                {billsTodayCount} บิล
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#EBCB8B]/10 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] font-semibold text-[#2F3E34]/50">
            <span>แคชเชียร์ให้บริการปกติตลอดวัน</span>
          </div>
        </div>
      </div>

      {/* Finance Summary Sub-grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card rounded-xl p-4 flex items-center gap-4 border border-[#EAF2EC]">
          <div className="w-10 h-10 rounded-full bg-[#8FB996]/10 text-[#8FB996] flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#2F3E34]/50 font-medium">รายรับนอกการขายอื่นๆ (เดือนนี้)</p>
            <p className="text-base font-bold text-[#2F3E34] font-mono">฿{totalIncomes.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-4 border border-[#EAF2EC]">
          <div className="w-10 h-10 rounded-full bg-[#E57373]/10 text-[#E57373] flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#2F3E34]/50 font-medium">รายจ่ายดำเนินการทั้งหมด (เดือนนี้)</p>
            <p className="text-base font-bold text-[#E57373] font-mono">฿{totalExpenses.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-4 border border-[#EAF2EC]">
          <div className="w-10 h-10 rounded-full bg-[#6CBF84]/10 text-[#6CBF84] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#2F3E34]/50 font-medium">รายการพัสดุในระบบ</p>
            <p className="text-base font-bold text-[#2F3E34] font-mono">{totalProductsCount} รายการ</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Graph (2 Columns on large screen) */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6 border border-[#EAF2EC] flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-[#2F3E34]">แนวโน้มยอดขายและกำไรสุทธิ</h4>
              <p className="text-[11px] text-[#2F3E34]/50">เปรียบเทียบสถิติการขายและกำไรในช่วง 10 วันล่าสุด</p>
            </div>
            <div className="flex gap-4 text-[10px] font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#8FB996] inline-block"></span>ยอดขาย</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#6CBF84] inline-block"></span>กำไรสุทธิ</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSalesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8FB996" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8FB996" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6CBF84" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6CBF84" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF2EC" />
                <XAxis dataKey="name" stroke="#2F3E34" strokeOpacity={0.4} fontSize={10} tickLine={false} />
                <YAxis stroke="#2F3E34" strokeOpacity={0.4} fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #EAF2EC',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontFamily: 'Noto Sans Thai, sans-serif'
                  }}
                />
                <Area type="monotone" dataKey="ยอดขาย (บาท)" stroke="#8FB996" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="กำไรสุทธิ (บาท)" stroke="#6CBF84" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share (Pie Chart) */}
        <div className="glass-card rounded-xl p-6 border border-[#EAF2EC] flex flex-col h-[380px]">
          <div>
            <h4 className="text-sm font-semibold text-[#2F3E34]">สัดส่วนยอดขายตามหมวดหมู่</h4>
            <p className="text-[11px] text-[#2F3E34]/50">การกระจายตัวของรายได้จำแนกตามหมวดหมู่สินค้าหลัก</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center relative">
            {categoryShare.length > 0 ? (
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={categoryShare}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryShare.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `฿${value.toLocaleString()}`}
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #EAF2EC',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-[#2F3E34]/40 py-10">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <span>ไม่มีข้อมูลการขายสินค้าแยกตามหมวดหมู่</span>
              </div>
            )}
          </div>
          <div className="mt-2 space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
            {categoryShare.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[#2F3E34]/80 truncate max-w-[130px]">{item.name}</span>
                </div>
                <span className="font-semibold text-[#2F3E34] font-mono">฿{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Best Sellers Bar Chart */}
        <div className="glass-card rounded-xl p-6 border border-[#EAF2EC] flex flex-col h-[380px]">
          <div>
            <h4 className="text-sm font-semibold text-[#2F3E34]">5 อันดับสินค้าสุขภาพขายดี</h4>
            <p className="text-[11px] text-[#2F3E34]/50">จัดอันดับตามจำนวนปริมาณที่ชำระเงินหน้าร้านสำเร็จ</p>
          </div>
          <div className="flex-1 min-h-0 mt-4">
            {bestSellers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellers} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#2F3E34" strokeOpacity={0.6} fontSize={10} width={90} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #EAF2EC',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="จำนวนที่ขายได้" fill="#8FB996" radius={[0, 8, 8, 0]} barSize={16}>
                    {bestSellers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#8FB996' : '#A1CBB4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-center items-center justify-center text-center text-xs text-[#2F3E34]/40">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <span>ไม่มีประวัติการขายสินค้าสุขภาพสะสม</span>
              </div>
            )}
          </div>
        </div>

        {/* Stock Alerts (Low Stock Warning) */}
        <div className="glass-card rounded-xl p-6 border border-[#EAF2EC] flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div>
              <h4 className="text-sm font-semibold text-[#2F3E34]">แจ้งเตือนสินค้าใกล้หมด ({lowStockProducts.length})</h4>
              <p className="text-[11px] text-[#2F3E34]/50">สินค้ารายการสุขภาพที่จำเป็นต้องวางแผนจัดซื้อรับเข้า</p>
            </div>
            {lowStockProducts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#E57373] animate-ping"></span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=200'}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-[#EAF2EC]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#2F3E34] line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-[#2F3E34]/40 font-mono">บาร์โค้ด: {p.barcode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#E57373] font-mono">{p.stock_qty} {p.unit}</p>
                    <p className="text-[9px] text-[#2F3E34]/40">ขั้นต่ำ: {p.min_stock} {p.unit}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#2F3E34]/40">
                <FileCheck2 className="w-10 h-10 mx-auto mb-2 text-[#6CBF84] opacity-80" />
                <span>ไม่มีสินค้าต่ำกว่าเกณฑ์สต็อกขั้นต่ำยอดเยี่ยม!</span>
              </div>
            )}
          </div>
          {lowStockProducts.length > 0 && (
            <button
              onClick={() => setActiveTab('stock')}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer text-center"
            >
              สั่งซื้อสินค้า / รับของเข้าสต็อกตอนนี้
            </button>
          )}
        </div>

        {/* Recent Activity Log */}
        <div className="glass-card rounded-xl p-6 border border-[#EAF2EC] flex flex-col h-[380px]">
          <div className="mb-3 shrink-0">
            <h4 className="text-sm font-semibold text-[#2F3E34]">ประวัติเหตุการณ์ระบบ</h4>
            <p className="text-[11px] text-[#2F3E34]/50">บันทึกประวัติการปรับปรุงสต็อกและงานขายเรียลไทม์</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 font-mono">
            {auditLogs.slice(0, 10).map((log, idx) => (
              <div key={idx} className="text-[11px] border-b border-[#EAF2EC]/50 pb-2 flex gap-2">
                <span className="text-[#8FB996] font-semibold shrink-0">
                  {new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div>
                  <p className="text-[#2F3E34] font-sans font-semibold leading-relaxed">
                    {log.action} <span className="text-xs text-[#2F3E34]/40 font-normal">โดย {log.user_fullname}</span>
                  </p>
                  <p className="text-[#2F3E34]/60 text-[10px] font-sans mt-0.5 leading-relaxed">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
