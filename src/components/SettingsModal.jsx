// ==========================================
// 系統設定與 API Key 管理組件
// ==========================================

import { useState } from 'react';
import { X, Key, ShieldCheck, AlertCircle, Cpu } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, getGeminiModel, setGeminiModel } from '../utils/apiKey';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [modelInput, setModelInput] = useState(getGeminiModel());
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(apiKeyInput);
    setGeminiModel(modelInput);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Key className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-bold">系統設定</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-5 mb-8">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-700">Gemini API Key</label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-medium"
              >
                前往申請免費金鑰 ↗
              </a>
            </div>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSyB..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
              <Cpu className="w-4 h-4 text-slate-500" /> AI 模型版本
            </label>
            <select
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer"
            >
              <option value="gemini-3-flash-preview">🌟 Gemini 3 Flash 預覽版 (最快最聰明)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash 穩定版</option>
            </select>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="leading-relaxed">
              <strong>隱私與安全提示：</strong>
              <p className="mt-1 text-amber-700">您的 API 金鑰僅會加密儲存在您當前的瀏覽器中（Local Storage），並且不會被記錄或儲存在我們的伺服器資料庫。我們強烈建議您為這個金鑰設定適當的額度限制。</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            {saveSuccess ? (
              <><ShieldCheck className="w-4 h-4" /> 已儲存</>
            ) : (
              '儲存設定'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
