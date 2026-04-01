// ==========================================
// 刪除確認彈窗組件
// ==========================================

import { Trash2 } from 'lucide-react';

export default function DeleteModal({ wordToDelete, onCancel, onConfirm }) {
  if (!wordToDelete) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-slate-900 mb-2">確認刪除</h3>
        <p className="text-slate-600 mb-6">
          確定要將「<span className="font-bold text-indigo-600">{wordToDelete.word}</span>」從單字本中刪除嗎？此動作無法復原。
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            確認刪除
          </button>
        </div>
      </div>
    </div>
  );
}
