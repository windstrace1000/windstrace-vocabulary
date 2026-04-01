// ==========================================
// SearchTab 查詢頁面組件
// ==========================================

import { useState } from 'react';
import { Search, Loader2, Volume2, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { playAudio } from '../utils/audio';
import ChooseCategoryModal from './ChooseCategoryModal';

export default function SearchTab({
  searchQuery, setSearchQuery, searchResult, isSearching, searchError,
  savedWords, onSearch, onSaveWord
}) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleSaveWithCategory = (categoryData) => {
    onSaveWord({ ...searchResult, category: categoryData });
    setIsCategoryModalOpen(false);
  };

  const isWordSaved = searchResult && savedWords.some(
    w => w.word.toLowerCase() === searchResult.word.toLowerCase()
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* 搜尋表單 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">查詢新單字</h2>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="輸入英文單字..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span className="hidden sm:inline">{isSearching ? '查詢中...' : '查詢'}</span>
          </button>
        </form>
        {searchError && <p className="text-red-500 mt-3 text-sm">{searchError}</p>}
      </div>

      {/* 查詢結果 */}
      {searchResult && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 標題區 */}
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-3xl font-extrabold text-slate-900">{searchResult.word}</h3>
                <button
                  onClick={() => playAudio(searchResult.word)}
                  className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
                  title="聆聽發音"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-md">
                  {searchResult.partOfSpeech}
                </span>
                <span className="text-slate-700 font-medium">{searchResult.translation}</span>
              </div>
            </div>

            {isWordSaved ? (
              <button disabled className="flex items-center gap-1 text-sm font-medium text-emerald-700 bg-emerald-100 px-4 py-2 rounded-lg cursor-default">
                <BookmarkCheck className="w-5 h-5" />
                <span className="hidden sm:inline">已儲存</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
              >
                <BookmarkPlus className="w-5 h-5" />
                <span className="hidden sm:inline">記下來</span>
              </button>
            )}
          </div>

          {/* 詳細資訊 */}
          <div className="p-6 space-y-6">
            {/* 例句 */}
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">例句 Example</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-slate-800 text-lg mb-2 flex items-start gap-2">
                  <span>{searchResult.exampleSentence}</span>
                  <button onClick={() => playAudio(searchResult.exampleSentence)} className="text-slate-400 hover:text-indigo-600 mt-1">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </p>
                <p className="text-slate-500">{searchResult.exampleTranslation}</p>
              </div>
            </div>

            {/* 相關詞形 */}
            {searchResult.relatedForms?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">相關詞形 Forms</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-3 px-4 text-slate-500 font-medium w-1/3">型態</th>
                        <th className="py-3 px-4 text-slate-500 font-medium">單字</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResult.relatedForms.map((form, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-slate-700">{form.formName}</td>
                          <td className="py-3 px-4 font-medium text-indigo-700 flex items-center justify-between">
                            <button onClick={() => onSearch(form.formWord)} className="hover:underline hover:text-indigo-800 text-left transition-colors" title="查詢此單字">
                              {form.formWord}
                            </button>
                            <button onClick={() => playAudio(form.formWord)} className="text-slate-400 hover:text-indigo-600 p-1">
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 形似字 */}
            {searchResult.similarWords?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">形似字 Similar Words</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-3 px-4 text-slate-500 font-medium w-1/3">單字</th>
                        <th className="py-3 px-4 text-slate-500 font-medium">意思</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResult.similarWords.map((sim, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-medium text-indigo-700 flex items-center justify-between">
                            <button onClick={() => onSearch(sim.word)} className="hover:underline hover:text-indigo-800 text-left transition-colors" title="查詢此單字">
                              {sim.word}
                            </button>
                            <button onClick={() => playAudio(sim.word)} className="text-slate-400 hover:text-indigo-600 p-1">
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-slate-700">{sim.meaning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 分類選擇視窗 */}
      <ChooseCategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        wordToSave={searchResult}
        onConfirm={handleSaveWithCategory}
      />
    </div>
  );
}
