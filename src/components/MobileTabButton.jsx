// ==========================================
// 手機版底部分頁按鈕組件
// ==========================================

import React from 'react';

export default function MobileTabButton({ active, onClick, icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full py-2 relative transition-colors ${
        active ? 'text-indigo-600' : 'text-slate-400'
      }`}
    >
      <div className="relative">
        {React.cloneElement(icon, { className: 'w-6 h-6 mb-1' })}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
