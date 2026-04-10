// ==========================================
// 系統設定與 API Key 管理組件
// ==========================================

import { useState } from 'react';
import { X, Key, ShieldCheck, AlertCircle, Cpu, Book, Newspaper, Plus, Trash2, Smartphone, Copy, Check, RotateCw, Volume2, Database, RefreshCw, Loader2, Link } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, getGeminiModel, setGeminiModel, getSpeechRate, setSpeechRate, getNotionApiKey, setNotionApiKey, getNotionDatabaseId, setNotionDatabaseId } from '../utils/apiKey';
import { getCategorySettings, saveCategorySettings } from '../utils/categories';
import { getUserId, setUserId } from '../utils/userId';
import { syncToNotion } from '../services/api';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [modelInput, setModelInput] = useState(getGeminiModel());
  const [speechRateInput, setSpeechRateInput] = useState(getSpeechRate());
  const [categories, setCategories] = useState(getCategorySettings());
  
  const currentUserId = getUserId();
  const [userIdInput, setUserIdInput] = useState(currentUserId);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // 新增輸入框狀態
  const [newTextbook, setNewTextbook] = useState('');
  const [newMagazine, setNewMagazine] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notion 同步設定
  const [notionApiKey, setNotionApiKeyInput] = useState(getNotionApiKey());
  const [notionDbId, setNotionDbIdInput] = useState(getNotionDatabaseId());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(''); // success, error, or empty
  const [syncMsg, setSyncMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(apiKeyInput);
    setGeminiModel(modelInput);
    setSpeechRate(speechRateInput);
    saveCategorySettings(categories);
    setNotionApiKey(notionApiKey);
    setNotionDatabaseId(notionDbId);
    
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

  const handleSyncNotion = async () => {
    if (!notionApiKey.trim() || !notionDbId.trim()) {
      setSyncStatus('error');
      setSyncMsg('請先填寫上方 Notion API Key 與 Database ID，並點擊彈窗下方「儲存設定」後再試');
      return;
    }
    
    // 先寫入本地確保一致性
    setNotionApiKey(notionApiKey);
    setNotionDatabaseId(notionDbId);

    setIsSyncing(true);
    setSyncStatus('');
    setSyncMsg('同步中，這可能需要一點時間，請稍候...');

    try {
      await syncToNotion(currentUserId, notionApiKey, notionDbId);
      setSyncStatus('success');
      setSyncMsg('✅ 單字庫成功同步至 Notion！');
    } catch (err) {
      setSyncStatus('error');
      setSyncMsg(`❌ 同步失敗: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
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

            <div>
              <label className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-slate-500" /> 朗讀速度設定
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">{speechRateInput}x</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">慢</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={speechRateInput}
                  onChange={(e) => setSpeechRateInput(e.target.value)}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-xs text-slate-400">快</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 italic">※ 此設定將同步套用於單字、例句以及老師筆記的發音。</p>
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

          {/* Notion 同步設定區 */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Database className="w-4 h-4 text-indigo-500"/> Notion 單字本備份與同步</h4>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs sm:text-sm text-blue-800 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-2 text-blue-900"><Key className="w-4 h-4"/> 忘記金鑰了嗎？</p>
                <ul className="list-disc leading-relaxed pl-5 space-y-1.5 text-blue-700/90 font-medium">
                  <li>API Key: 前往 <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900 text-blue-800 inline-flex items-center">Notion 開發者平台 <Link className="w-3 h-3 ml-0.5" /></a>，點擊「單字 APP 同步助手」&gt; Secrets 取得。</li>
                  <li>Database ID: 打開您建立好的 Notion 單字庫，複製該頁面的網址，網址中 **最長的那 32 位英數字** 即是 ID。</li>
                </ul>
                <p className="mt-3 text-[11px] opacity-80 italic">提示：只要填寫一次，瀏覽器就會自動本機記下。不需要每次都輸入哦！</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Notion API Key (Internal Integration Secret)</label>
                  <input
                    type="password"
                    value={notionApiKey}
                    onChange={(e) => setNotionApiKeyInput(e.target.value)}
                    placeholder="secret_..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono text-sm shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Notion Database ID</label>
                  <input
                    type="text"
                    value={notionDbId}
                    onChange={(e) => setNotionDbIdInput(e.target.value)}
                    placeholder="32位英數 ID..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono text-sm shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSyncNotion}
                  disabled={isSyncing}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm
                    ${isSyncing ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700 active:scale-[0.98]'}`}
                >
                  {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  {isSyncing ? '正在備份所有單字進 Notion...' : '⬆️ 開始同步單字庫至 Notion'}
                </button>
                {syncMsg && (
                  <div className={`mt-3 p-3 rounded-xl border text-sm font-medium ${syncStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' : syncStatus === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-indigo-50 border-indigo-200 text-indigo-700 flex items-center gap-2'}`}>
                     {syncStatus === '' && isSyncing && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
                     {syncMsg}
                  </div>
                )}
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
