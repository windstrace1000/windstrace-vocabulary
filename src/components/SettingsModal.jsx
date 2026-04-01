// ==========================================
// 系統設定與 API Key 管理組件
// ==========================================

import { useState } from 'react';
import { X, Key, ShieldCheck, AlertCircle, Cpu, Book, Newspaper, Plus, Trash2, Smartphone, Copy, Check, RotateCw } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, getGeminiModel, setGeminiModel } from '../utils/apiKey';
import { getCategorySettings, saveCategorySettings } from '../utils/categories';
import { getUserId, setUserId } from '../utils/userId';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [modelInput, setModelInput] = useState(getGeminiModel());
  const [categories, setCategories] = useState(getCategorySettings());
  
  const currentUserId = getUserId();
  const [userIdInput, setUserIdInput] = useState(currentUserId);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // 新增輸入框狀態
  const [newTextbook, setNewTextbook] = useState('');
  const [newMagazine, setNewMagazine] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(apiKeyInput);
    setGeminiModel(modelInput);
    saveCategorySettings(categories);
    
    const idChanged = userIdInput.trim() !== currentUserId && userIdInput.trim() !== '';
    if (idChanged) {
      setUserId(userIdInput);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
      if (idChanged) {
        window.location.reload();
      }
    }, 1500);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(userIdInput);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  const generateRandomId = () => {
    const newId = crypto.randomUUID().split('-')[0];
    setUserIdInput(newId);
  };

  const addCategory = (type) => {
    if (type === 'textbook' && newTextbook.trim()) {
      if (!categories.textbookVersions.includes(newTextbook.trim())) {
        setCategories(prev => ({
          ...prev,
          textbookVersions: [...prev.textbookVersions, newTextbook.trim()]
        }));
      }
      setNewTextbook('');
    } else if (type === 'magazine' && newMagazine.trim()) {
      if (!categories.magazineBrands.includes(newMagazine.trim())) {
        setCategories(prev => ({
          ...prev,
          magazineBrands: [...prev.magazineBrands, newMagazine.trim()]
        }));
      }
      setNewMagazine('');
    }
  };

  const removeCategory = (type, itemToRemove) => {
    if (type === 'textbook') {
      setCategories(prev => ({
        ...prev,
        textbookVersions: prev.textbookVersions.filter(item => item !== itemToRemove)
      }));
    } else {
      setCategories(prev => ({
        ...prev,
        magazineBrands: prev.magazineBrands.filter(item => item !== itemToRemove)
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-slate-800">
            <Key className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg sm:text-xl font-bold">系統設定</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-8">
          
          {/* AI 設定區 */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">AI 設定</h4>
            
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
                <option value="gemini-3.1-flash-lite-preview">⚡ Gemini 3.1 Flash Lite (最新省電版)</option>
                <option value="gemini-3-flash-preview">🌟 Gemini 3 Flash 預覽版 (最快最聰明)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash 穩定版</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (輕量版)</option>
              </select>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div className="leading-relaxed">
                <p className="text-amber-700">API 金鑰僅會加密儲存在您的瀏覽器中。我們強烈建議為此金鑰設定適當的額度限制。</p>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 跨裝置同步區 */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">跨裝置同步設定</h4>
            
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-bold text-indigo-800">
                  <Smartphone className="w-4 h-4" /> 自定義同步 ID (帳號代碼)
                </label>
                <div className="flex gap-1.5 sm:gap-2 flex-nowrap items-center">
                  <input
                    type="text"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    placeholder="例如: myword123"
                    className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm sm:text-base font-mono font-bold text-indigo-700 shadow-sm"
                  />
                  <div className="flex gap-1 flex-shrink-0">
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 sm:p-3 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm active:scale-95"
                      title="複製 ID"
                    >
                      {showCopySuccess ? <Check className="w-4 h-4 sm:w-5 h-5 text-green-500" /> : <Copy className="w-4 h-4 sm:w-5 h-5" />}
                    </button>
                    <button 
                      onClick={generateRandomId}
                      className="p-2 sm:p-3 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm active:scale-95"
                      title="隨機產生"
                    >
                      <RotateCw className="w-4 h-4 sm:w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 rounded-xl p-4 text-xs text-slate-600 leading-relaxed border border-indigo-100/50">
                <p className="font-semibold text-indigo-800 mb-1">📢 如何同步？</p>
                <p>在其他裝置填入「同一個同步 ID」，按儲存後就會看到相同的單字本。 ID 本身就是識別證，請設定一組好記但不易被猜到的文字。</p>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* 分類選項設定區 */}
          <section className="space-y-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">單字分類選項設定</h4>
            
            {/* 課本版本設定 */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Book className="w-4 h-4 text-indigo-500" /> 課本版本選項
              </label>
              <div className="flex gap-1.5 sm:gap-2 flex-nowrap items-center">
                <input
                  type="text"
                  value={newTextbook}
                  onChange={(e) => setNewTextbook(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory('textbook')}
                  placeholder="新增版本 (例如：三民)"
                  className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs sm:text-sm"
                />
                <button
                  onClick={() => addCategory('textbook')}
                  disabled={!newTextbook.trim()}
                  className="p-2 sm:px-4 sm:py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.textbookVersions.map(item => (
                  <div key={item} className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm">
                    {item}
                    <button onClick={() => removeCategory('textbook', item)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
            </div>

            {/* 雜誌品牌設定 */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Newspaper className="w-4 h-4 text-indigo-500" /> 雜誌品牌選項
              </label>
              <div className="flex gap-1.5 sm:gap-2 flex-nowrap items-center">
                <input
                  type="text"
                  value={newMagazine}
                  onChange={(e) => setNewMagazine(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory('magazine')}
                  placeholder="新增雜誌 (例如：常春藤)"
                  className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs sm:text-sm"
                />
                <button
                  onClick={() => addCategory('magazine')}
                  disabled={!newMagazine.trim()}
                  className="p-2 sm:px-4 sm:py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.magazineBrands.map(item => (
                  <div key={item} className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm">
                    {item}
                    <button onClick={() => removeCategory('magazine', item)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
          </section>

        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 flex justify-end gap-2 sm:gap-3 shrink-0 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2"
          >
            {saveSuccess ? (
              <><ShieldCheck className="w-4 h-4" /> <span className="whitespace-nowrap">已儲存</span></>
            ) : (
              <span className="whitespace-nowrap">儲存設定</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
