/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { User, RolePermission } from '../types';
import {
  Shield,
  UserPlus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Check,
  X,
  UserCheck,
  KeyRound,
  Inbox,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Camera,
  Upload,
  User as UserIcon
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const {
    users,
    roles,
    addUser,
    editUser,
    deleteUser,
    updateRolePermissions,
    showToast,
    currentUser
  } = useDb();

  // Pagination & Deletions State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [deleteUserTargetId, setDeleteUserTargetId] = useState<string | null>(null);

  // Active role selected in the permissions matrix
  const [selectedMatrixRole, setSelectedMatrixRole] = useState<string>('cashier');

  // Staff Form state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formFullname, setFormFullname] = useState('');
  const [formRole, setFormRole] = useState('cashier');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formLockPin, setFormLockPin] = useState('');
  const [formAvatar, setFormAvatar] = useState('');

  // Submit User
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formFullname.trim()) {
      showToast('⚠️ กรุณาระบุรหัสพนักงาน และชื่อผู้ใช้งานจริง', 'warning');
      return;
    }

    const payload = {
      username: formUsername.trim().toLowerCase(),
      fullname: formFullname,
      role: formRole,
      phone: formPhone || undefined,
      email: formEmail || undefined,
      lock_pin: formLockPin || undefined,
      avatar: formAvatar || undefined
    };

    if (editingUser) {
      editUser(editingUser.id, payload);
    } else {
      addUser(payload);
    }
    setShowUserModal(false);
  };

  // Open User add/edit forms
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormFullname('');
    setFormRole('cashier');
    setFormPhone('');
    setFormEmail('');
    setFormLockPin('');
    setFormAvatar('');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormFullname(u.fullname);
    setFormRole(u.role);
    setFormPhone(u.phone || '');
    setFormEmail(u.email || '');
    setFormLockPin(u.lock_pin || '');
    setFormAvatar(u.avatar || '');
    setShowUserModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('❌ ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'manager':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'accountant':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'warehouse':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'cashier':
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getRoleLabelThai = (role: string) => {
    switch (role) {
      case 'owner': return 'เจ้าของร้าน (Owner)';
      case 'manager': return 'ผู้จัดการ (Manager)';
      case 'accountant': return 'นักบัญชี (Accountant)';
      case 'warehouse': return 'พนักงานคลัง (Warehouse)';
      case 'cashier': default: return 'แคชเชียร์ (Cashier)';
    }
  };

  // Find permissions payload for the chosen matrix role
  const selectedPermission = roles.find(p => p.role === selectedMatrixRole);

  const modulesThai = [
    { key: 'pos' as const, label: 'เปิดใช้งาน ระบบ POS หน้าร้านค้า' },
    { key: 'stock' as const, label: 'เปิดใช้งาน การจัดการและตรวจสต็อกสินค้า' },
    { key: 'products' as const, label: 'เปิดใช้งาน รายการผลิตภัณฑ์และการตั้งราคา' },
    { key: 'customers' as const, label: 'เปิดใช้งาน ประวัติและระดับแต้มสมาชิก CRM' },
    { key: 'finance' as const, label: 'เปิดใช้งาน สมุดบันทึกบัญชีรายรับ-รายจ่าย' },
    { key: 'users' as const, label: 'เปิดใช้งาน การแก้ไขสิทธิ์และบทบาทพนักงาน' },
    { key: 'settings' as const, label: 'เปิดใช้งาน ตั้งค่าร้านค้าและพิมพ์สลิปใบเสร็จ' }
  ];

  const handleTogglePermission = (field: keyof RolePermission['permissions']) => {
    if (!selectedPermission) return;
    const currentVal = selectedPermission.permissions[field];
    const updatedPerms = {
      ...selectedPermission.permissions,
      [field]: !currentVal
    };
    updateRolePermissions(selectedPermission.id, updatedPerms);
  };

  // Sorting and Pagination calculation (Newest first)
  const sortedUsers = [...users].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  const totalUserItems = sortedUsers.length;
  const totalUserPages = Math.ceil(totalUserItems / itemsPerPage) || 1;
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* 2-Columns grid: Left is Staff List, Right is Role Permissions Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: STAFF LIST (Spans 2 columns) */}
        <div className="xl:col-span-2 space-y-5 bg-white border border-[#EAF2EC] rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F8FAF7] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#2F3E34]">ข้อมูลรายชื่อพนักงานหน้าร้าน (Store Staffs)</h3>
              <p className="text-xs text-[#2F3E34]/50">ลงทะเบียน แก้ไขบทบาทหน้าที่ของพนักงานที่มีสิทธิ์ล็อกอินใช้งานเครื่อง</p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="px-4 py-2.5 bg-[#8FB996] hover:bg-[#8FB996]/95 text-white transition-all rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4" /> <span>เพิ่มพนักงานคนใหม่</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAF7] border-b border-[#EAF2EC] text-[#2F3E34]/60 text-[11px] font-bold tracking-wider">
                  <th className="py-3.5 px-4">ชื่อ-นามสกุลพนักงาน</th>
                  <th className="py-3.5 px-3">รหัสพนักงาน (ID)</th>
                  <th className="py-3.5 px-3">รหัสล็อคจอ (PIN)</th>
                  <th className="py-3.5 px-3">ระดับปฏิบัติงาน</th>
                  <th className="py-3.5 px-3">เบอร์ติดต่อ</th>
                  <th className="py-3.5 px-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2EC] text-xs">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[#F8FAF7]/30 transition-all">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#8FB996]/10 text-[#8FB996] flex items-center justify-center font-bold text-xs uppercase">
                            {u.username.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2F3E34]">{u.fullname}</p>
                            <p className="text-[10px] text-[#2F3E34]/40 font-mono">{u.email || 'ไม่มีข้อมูลอีเมล'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-[#2F3E34]/60">
                        {u.username}
                      </td>
                      <td className="py-3 px-3">
                        {u.lock_pin ? (
                          <span className="flex items-center gap-1 text-[#8FB996] font-mono font-bold">
                            <Lock className="w-2.5 h-2.5" /> {u.lock_pin}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic text-[10px]">ไม่ได้ตั้งค่า</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getRoleBadgeColor(u.role)}`}>
                          {getRoleLabelThai(u.role).split(' (')[0]}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#2F3E34]/60">
                        {u.phone || '-'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-[#2F3E34]/60 transition-colors inline-flex cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (u.id === currentUser?.id) {
                              showToast('❌ ไม่สามารถลบบทบาทตนเองในขณะปฏิบัติการอยู่ได้', 'error');
                              return;
                            }
                            setDeleteUserTargetId(u.id);
                          }}
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
                      <Inbox className="w-10 h-10 mx-auto mb-2 text-[#8FB996] opacity-60" />
                      <span>ไม่มีข้อมูลพนักงานแสดงในขณะนี้</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalUserPages > 1 && (
            <div className="border-t border-[#EAF2EC] pt-4 flex items-center justify-between text-xs text-[#2F3E34]/60">
              <p>แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalUserItems)} จากทั้งหมด {totalUserItems} รายการ</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-[#2F3E34] px-2">หน้า {currentPage} / {totalUserPages}</span>
                <button
                  type="button"
                  disabled={currentPage === totalUserPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalUserPages))}
                  className="p-1.5 rounded-lg border border-[#EAF2EC] bg-white hover:bg-gray-50 text-[#2F3E34]/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INTERACTIVE PERMISSIONS MATRIX */}
        <div className="space-y-6">
          <div className="glass-card border border-[#EAF2EC] rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-[#2F3E34] flex items-center gap-2 pb-2 border-b border-[#EAF2EC]/50">
              <Shield className="w-4.5 h-4.5 text-[#8FB996]" />
              <span>การกำหนดสิทธิ์การเข้าถึง (Access Matrix)</span>
            </h4>

            {/* Select role selector */}
            <div>
              <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">เลือกสิทธิ์ที่ต้องการตั้งค่า</label>
              <select
                value={selectedMatrixRole}
                onChange={(e) => setSelectedMatrixRole(e.target.value)}
                className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] font-medium focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
              >
                <option value="owner">เจ้าของร้าน (Owner)</option>
                <option value="manager">ผู้จัดการ (Manager)</option>
                <option value="cashier">พนักงานแคชเชียร์ (Cashier)</option>
                <option value="warehouse">เจ้าหน้าที่คลังสินค้า (Warehouse)</option>
                <option value="accountant">ผู้ตรวจสอบบัญชี (Accountant)</option>
              </select>
            </div>

            {/* Interactive check boxes */}
            <div className="space-y-2.5 pt-2">
              <p className="text-[10px] text-[#2F3E34]/40 font-bold uppercase tracking-wide">สิทธิ์ของกลุ่มพาร์ทเนอร์นี้ ({selectedMatrixRole.toUpperCase()})</p>
              {selectedPermission ? (
                modulesThai.map(m => {
                  const isChecked = selectedPermission.permissions[m.key];
                  return (
                    <div
                      key={m.key}
                      onClick={() => handleTogglePermission(m.key)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                        isChecked
                          ? 'bg-[#8FB996]/6 border-[#8FB996]/30 text-[#2F3E34]'
                          : 'bg-[#F8FAF7]/80 border-[#EAF2EC] text-[#2F3E34]/50'
                      }`}
                    >
                      <span className="font-semibold leading-normal">{m.label}</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isChecked
                          ? 'bg-[#8FB996] border-[#8FB996] text-white'
                          : 'bg-white border-gray-300 text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-400">
                  ไม่พบบทบาทที่เลือก
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD/EDIT STAFF */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto animate-fade-in">
            <h3 className="text-sm font-bold text-[#2F3E34] mb-4">
              {editingUser ? 'ปรับปรุงประวัติการจ้างงาน' : 'ลงทะเบียนสิทธิ์พนักงานใหม่'}
            </h3>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              {/* Avatar Selection */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-[#8FB996]/10 border-2 border-[#8FB996]/20 flex items-center justify-center overflow-hidden mb-2">
                    {formAvatar ? (
                      <img src={formAvatar} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-[#8FB996]/40" />
                    )}
                  </div>
                  <label className="absolute bottom-1 right-0 w-8 h-8 bg-[#8FB996] text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-[#2F3E34]/40 font-medium">คลิกไอคอนเพื่อเปลี่ยนรูปโปรไฟล์</p>
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">รหัสล็อกอินผู้ปฏิบัติงาน (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น somchai.c"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] lowercase"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">ชื่อจริง-นามสกุลพนักงาน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={formFullname}
                  onChange={(e) => setFormFullname(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold uppercase block mb-1">บทบาทหน้าที่หลัก</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                >
                  <option value="owner">เจ้าของร้าน (Owner)</option>
                  <option value="manager">ผู้จัดการสปา (Manager)</option>
                  <option value="cashier">พนักงานหน้าร้าน (Cashier)</option>
                  <option value="warehouse">ผู้จัดการฝ่ายคลังสินค้า (Warehouse)</option>
                  <option value="accountant">พนักงานตรวจสอบบัญชี (Accountant)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">เบอร์ติดต่อมือถือ</label>
                  <input
                    type="text"
                    placeholder="08X-XXX-XXXX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">รหัสล็อคหน้าจอ (PIN)</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="เลข 4-6 หลัก"
                    value={formLockPin}
                    onChange={(e) => setFormLockPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#2F3E34]/55 font-bold block mb-1">อีเมลติดต่อ</label>
                <input
                  type="email"
                  placeholder="staff@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full text-xs bg-[#F8FAF7] border border-[#EAF2EC] rounded-xl px-3 py-2 text-[#2F3E34] focus:outline-none focus:ring-1 focus:ring-[#8FB996]"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#EAF2EC] mt-6">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#8FB996] hover:bg-[#8FB996]/90 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingUser ? 'บันทึกแก้ไขข้อมูล' : 'บันทึกจดสิทธิ์ทำงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG FOR STAFF DELETIONS */}
      {deleteUserTargetId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#EAF2EC] shadow-2xl p-6 w-full max-w-sm animate-fade-in text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-[#E57373] mb-3" />
            <h4 className="text-sm font-bold text-[#2F3E34] mb-1">ยืนยันการลบสิทธิ์พนักงาน?</h4>
            <p className="text-[10px] text-[#2F3E34]/60 mb-5 leading-relaxed">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ พนักงานท่านนี้จะไม่สามารถล็อกอินเข้าสู่ระบบได้อีกต่อไป
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteUserTargetId(null)}
                className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteUserTargetId) {
                    deleteUser(deleteUserTargetId);
                    setDeleteUserTargetId(null);
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
