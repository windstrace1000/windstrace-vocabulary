import { useState, useEffect } from 'react';
import { X, Book, Newspaper, Coffee, CheckCircle2 } from 'lucide-react';
import { getCategorySettings } from '../utils/categories';

export default function ChooseCategoryModal({ isOpen, onClose, onConfirm, wordToSave }) {
  const [categoryType, setCategoryType] = useState('lifestyle'); // 'textbook', 'magazine', 'lifestyle'
  const [settings, setSettings] = useState({ textbookVersions: [], magazineBrands: [] });
  
  // 課本狀態
  const [textbookVersion, setTextbookVersion] = useState('');
  const [textbookBook, setTextbookBook] = useState('1'); // 第1~6冊
  const [textbookUnit, setTextbookUnit] = useState('1'); // 第1~12課
  
  // 雜誌狀態
  const [magazineBrand, setMagazineBrand] = useState('');
  const [magazineYear, setMagazineYear] = useState(new Date().getFullYear().toString());
  const [magazineMonth, setMagazineMonth] = useState((new Date().getMonth() + 1).toString());

  useEffect(() => {
    if (isOpen) {
      const currentSettings = getCategorySettings();
      setSettings(currentSettings);
      
      const lastSelectionStr = localStorage.getItem('lastCategorySelection');
      let loadedFromStorage = false;

      if (lastSelectionStr) {
        try {
          const lastSelection = JSON.parse(lastSelectionStr);
          if (lastSelection.type) {
            setCategoryType(lastSelection.type);
            loadedFromStorage = true;
          }
          
          if (lastSelection.type === 'textbook') {
            if (currentSettings.textbookVersions.includes(lastSelection.version)) {
              setTextbookVersion(lastSelection.version);
            } else if (currentSettings.textbookVersions.length > 0) {
              setTextbookVersion(currentSettings.textbookVersions[0]);
            }
            if (lastSelection.book) setTextbookBook(String(lastSelection.book));
            if (lastSelection.unit) setTextbookUnit(String(lastSelection.unit));
            
            if (currentSettings.magazineBrands.length > 0) {
              setMagazineBrand(currentSettings.magazineBrands[0]);
            }
          } else if (lastSelection.type === 'magazine') {
            if (currentSettings.magazineBrands.includes(lastSelection.brand)) {
              setMagazineBrand(lastSelection.brand);
            } else if (currentSettings.magazineBrands.length > 0) {
              setMagazineBrand(currentSettings.magazineBrands[0]);
            }
            if (lastSelection.year) setMagazineYear(String(lastSelection.year));
            if (lastSelection.month) setMagazineMonth(String(lastSelection.month));
            
            if (currentSettings.textbookVersions.length > 0) {
              setTextbookVersion(currentSettings.textbookVersions[0]);
            }
          } else {
            // lifestyle 或其他
            if (currentSettings.textbookVersions.length > 0) {
              setTextbookVersion(currentSettings.textbookVersions[0]);
            }
            if (currentSettings.magazineBrands.length > 0) {
              setMagazineBrand(currentSettings.magazineBrands[0]);
            }
          }
        } catch (e) {
          console.error('Failed to parse last category selection', e);
          loadedFromStorage = false;
        }
      }
      
      if (!loadedFromStorage) {
        // 設定初始預設選項
        if (currentSettings.textbookVersions.length > 0 && !textbookVersion) {
          setTextbookVersion(currentSettings.textbookVersions[0]);
        }
        if (currentSettings.magazineBrands.length > 0 && !magazineBrand) {
          setMagazineBrand(currentSettings.magazineBrands[0]);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    let categoryData = { type: categoryType };
    
    if (categoryType === 'textbook') {
      categoryData = {
        type: 'textbook',
        version: textbookVersion,
        book: textbookBook,
        unit: textbookUnit
      };
    } else if (categoryType === 'magazine') {
      categoryData = {
        type: 'magazine',
        brand: magazineBrand,
        year: magazineYear,
        month: magazineMonth
      };
    }

    // 將最近一次的選擇儲存到 localStorage，以便下次開啟時預設選取
    localStorage.setItem('lastCategorySelection', JSON.stringify(categoryData));

    onConfirm(categoryData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">儲存單字至...</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {wordToSave && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col items-center">
            <span className="text-2xl font-black text-indigo-900 mb-1">{wordToSave.word}</span>
            <span className="text-indigo-700 font-medium">{wordToSave.translation}</span>
          </div>
        )}

        <div className="space-y-4 mb-8">
          
          {/* 大分類選擇 */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setCategoryType('textbook')}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                categoryType === 'textbook' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
              }`}
            >
              <Book className="w-6 h-6" />
              <span className="text-sm font-semibold">課本</span>
            </button>
            <button
              onClick={() => setCategoryType('magazine')}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                categoryType === 'magazine' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
              }`}
            >
              <Newspaper className="w-6 h-6" />
              <span className="text-sm font-semibold">雜誌</span>
            </button>
            <button
              onClick={() => setCategoryType('lifestyle')}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                categoryType === 'lifestyle' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
              }`}
            >
              <Coffee className="w-6 h-6" />
              <span className="text-sm font-semibold">生活</span>
            </button>
          </div>

          <div className="h-44 overflow-hidden pt-2">
            {/* 課本細項 */}
            {categoryType === 'textbook' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">學校版本</label>
                  <select
                    value={textbookVersion}
                    onChange={(e) => setTextbookVersion(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {settings.textbookVersions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                    {settings.textbookVersions.length === 0 && <option value="" disabled>請先至設定新增版本</option>}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">冊數</label>
                    <select
                      value={textbookBook}
                      onChange={(e) => setTextbookBook(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6].map(b => (
                        <option key={b} value={b}>第 {b} 冊</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">第幾課</label>
                    <select
                      value={textbookUnit}
                      onChange={(e) => setTextbookUnit(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {Array.from({length: 20}, (_, i) => i + 1).map(u => (
                        <option key={u} value={u}>第 {u} 課</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 雜誌細項 */}
            {categoryType === 'magazine' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">雜誌品牌</label>
                  <select
                    value={magazineBrand}
                    onChange={(e) => setMagazineBrand(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {settings.magazineBrands.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                    {settings.magazineBrands.length === 0 && <option value="" disabled>請先至設定新增雜誌品牌</option>}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">年份</label>
                    <input
                      type="number"
                      value={magazineYear}
                      onChange={(e) => setMagazineYear(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">月份</label>
                    <select
                      value={magazineMonth}
                      onChange={(e) => setMagazineMonth(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m} 月</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 生活細項 */}
            {categoryType === 'lifestyle' && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-in fade-in slide-in-from-right-4 pb-8">
                <Coffee className="w-12 h-12 mb-3 opacity-20" />
                <p>適合日常生活中遇到的單字</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              (categoryType === 'textbook' && !textbookVersion) ||
              (categoryType === 'magazine' && !magazineBrand)
            }
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            確認儲存
          </button>
        </div>
      </div>
    </div>
  );
}
