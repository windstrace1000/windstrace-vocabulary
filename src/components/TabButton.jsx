// ==========================================
// 桌面版分頁按鈕組件
// ==========================================

export default function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
        active
          ? 'bg-white text-indigo-700 shadow-sm'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
