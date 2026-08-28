/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { getProxyImage } from '../types';
import { Lock, Delete, ArrowRight, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LockScreen: React.FC = () => {
  const { currentUser, unlockScreen, showToast, isLocked } = useDb();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  // Clear PIN when error happens
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(false);
        setPin('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleKeyPress = (val: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + val);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pin.length === 0) return;

    const success = unlockScreen(pin);
    if (!success) {
      setError(true);
      showToast('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  // Auto submit when 4 or 6 digits depending on logic, but let's stick to manual or fixed 4 for simplicity
  // Actually, let's allow manual submit with ArrowRight

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 bg-[#F8FAF7]/95 backdrop-blur-md flex flex-col items-center justify-center z-[10000] select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm px-6 flex flex-col items-center"
      >
        {/* User Info */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-white border-2 border-[#8FB996]/20 rounded-full flex items-center justify-center mb-4 mx-auto shadow-sm overflow-hidden">
            {currentUser.avatar ? (
              <img src={getProxyImage(currentUser.avatar)} alt={currentUser.fullname} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon className="w-10 h-10 text-[#8FB996]" />
            )}
          </div>
          <h2 className="text-xl font-bold text-[#2F3E34] tracking-tight mb-1">{currentUser.fullname}</h2>
          <p className="text-xs text-[#2F3E34]/50 font-medium bg-[#8FB996]/10 px-3 py-1 rounded-full inline-block">
            {currentUser.role.toUpperCase()}
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex gap-4 mb-10">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > i 
                  ? 'bg-[#8FB996] border-[#8FB996] scale-110' 
                  : 'border-[#8FB996]/20'
              } ${error ? 'border-red-400 bg-red-400 animate-shake' : ''}`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 rounded-2xl bg-white border border-[#EAF2EC] text-xl font-bold text-[#2F3E34] hover:bg-[#F8FAF7] active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-white border border-[#EAF2EC] flex items-center justify-center text-[#2F3E34]/40 hover:bg-[#F8FAF7] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Delete className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-white border border-[#EAF2EC] text-xl font-bold text-[#2F3E34] hover:bg-[#F8FAF7] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            0
          </button>
          <button
            onClick={() => handleSubmit()}
            className={`h-16 rounded-2xl flex items-center justify-center transition-all shadow-sm cursor-pointer ${
              pin.length > 0 
                ? 'bg-[#8FB996] text-white' 
                : 'bg-white border border-[#EAF2EC] text-[#2F3E34]/20'
            }`}
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        <p className="text-[10px] text-[#2F3E34]/30 font-bold uppercase tracking-widest flex items-center gap-2">
          <Lock className="w-3 h-3" />
          Securely Locked by Soul Element POS
        </p>
      </motion.div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};
