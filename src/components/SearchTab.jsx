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
    const existingWord = searchResult && savedWords.find(
      w => w.word.toLowerCase() === searchResult.word.toLowerCase()
    );
    
    // 如果已經存過，就把新的 category 加進原本的 categories 陣列中
    let newCategories = existingWord ? [...(existingWord.categories || [])] : [];
    
    // 檢查是否已存在相同的分類
    const isDuplicate = newCategories.some(c => JSON.stringify(c) === JSON.stringify(categoryData));
    if (!isDuplicate) {
      newCategories.push(categoryData);
    }

    onSaveWord({ 
      ...(existingWord || searchResult), 
      category: newCategories 
    });
    setIsCategoryModalOpen(false);
  };

  const isWordSaved = searchResult && savedWords.some(
    w => w.word.toLowerCase() === searchResult.word.toLowerCase()
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* 搜尋表單 */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">查詢新單字</h2>
        <form onSubmit={handleSubmit} className="flex flex-nowrap items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="輸入英文單字..."
            className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-indigo-100 h-full"
          >
            {isSearching ? <Loader2 className="w-4 h-4 sm:w-5 h-5 animate-spin" /> : <Search className="w-4 h-4 sm:w-5 h-5" />}
            <span className="text-sm sm:text-base">{isSearching ? (window.innerWidth < 640 ? '...' : '查詢中...') : '查詢'}</span>
          </button>
        </form>
        {searchError && <p className="text-red-500 mt-3 text-sm">{searchError}</p>}
      </div>

      {/* 查詢結果 */}
      {searchResult && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 標題區 */}
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex flex-nowrap justify-between items-start gap-2 sm:gap-4 overflow-hidden rounded-t-2xl">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 sm:gap-3 mb-1">
                <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 break-words leading-tight">{searchResult.word}</h3>
                <button
                  onClick={() => playAudio(searchResult.word)}
                  className="p-1.5 sm:p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors flex-shrink-0 mt-0.5 sm:mt-1"
                  title="聆聽發音"
                >
                  <Volume2 className="w-5 h-5 sm:w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-lg flex-wrap">
                <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-sm font-semibold rounded-md flex-shrink-0 ${
                  (searchResult.partOfSpeech?.toLowerCase() === 'phrase' || searchResult.partOfSpeech === '片語')
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {(() => {
                    const pos = searchResult.partOfSpeech?.toLowerCase();
                    const mapping = {
                      'phrase': '片語',
                      'n.': '名詞', 'n': '名詞', 'noun': '名詞',
                      'v.': '動詞', 'v': '動詞', 'verb': '動詞',
                      'adj.': '形容詞', 'adj': '形容詞', 'adjective': '形容詞',
                      'adv.': '副詞', 'adv': '副詞', 'adverb': '副詞',
                      'prep.': '介系詞', 'prep': '介系詞', 'preposition': '介系詞',
                      'conj.': '連接詞', 'conj': '連接詞', 'conjunction': '連接詞',
                      'pron.': '代名詞', 'pron': '代名詞', 'pronoun': '代名詞',
                      'art.': '冠詞', 'art': '冠詞', 'article': '冠詞',
                      'int.': '感嘆詞', 'int': '感嘆詞', 'interjection': '感嘆詞',
                      'aux.': '助動詞', 'aux': '助動詞', 'auxiliary': '助動詞',
                    };
                    return mapping[pos] || searchResult.partOfSpeech;
                  })()}
                </span>
                <span className="text-slate-700 font-medium text-sm sm:text-lg break-words">{searchResult.translation}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className={`flex items-center justify-center gap-1 text-[10px] sm:text-sm font-medium px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg transition-colors flex-shrink-0 ml-auto ${
                isWordSaved 
                  ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200' 
                  : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              {isWordSaved ? <BookmarkCheck className="w-4 h-4 sm:w-5 h-5" /> : <BookmarkPlus className="w-4 h-4 sm:w-5 h-5" />}
              <span>{isWordSaved ? (window.innerWidth < 640 ? '加分類' : '+ 加入其他分類') : '記下來'}</span>
            </button>
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
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium w-1/3">型態</th><th className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium">單字</th></tr></thead>
                    <tbody>
                      {searchResult.relatedForms.map((form, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 sm:px-4 text-slate-700">{form.formName}</td>
                          <td className="py-2.5 px-3 sm:px-4 font-medium text-indigo-700">
                            <div className="flex items-center justify-between gap-1">
                              <button onClick={() => onSearch(form.formWord)} className="hover:underline hover:text-indigo-800 text-left transition-colors truncate">{form.formWord}</button>
                              <button onClick={() => playAudio(form.formWord)} className="text-slate-400 hover:text-indigo-600 p-1 flex-shrink-0"><Volume2 className="w-4 h-4" /></button>
                            </div>
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
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">形似字 Similar</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium w-1/3">單字</th><th className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium">意思</th></tr></thead>
                    <tbody>
                      {searchResult.similarWords.map((sim, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 sm:px-4 font-medium text-indigo-700">
                            <div className="flex items-center justify-between gap-1">
                              <button onClick={() => onSearch(sim.word)} className="hover:underline hover:text-indigo-800 text-left transition-colors truncate">{sim.word}</button>
                              <button onClick={() => playAudio(sim.word)} className="text-slate-400 hover:text-indigo-600 p-1 flex-shrink-0"><Volume2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 text-slate-700">{sim.meaning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 相關片語 */}
            {searchResult.relatedPhrases?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">相關片語 Phrases</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium w-1/2">片語</th><th className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium">意思</th></tr></thead>
                    <tbody>
                      {searchResult.relatedPhrases.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 sm:px-4 font-medium text-indigo-700">
                            <div className="flex items-center justify-between gap-1">
                              <button onClick={() => onSearch(item.phrase)} className="hover:underline hover:text-indigo-800 text-left transition-colors break-words">{item.phrase}</button>
                              <button onClick={() => playAudio(item.phrase)} className="text-slate-400 hover:text-indigo-600 p-1 flex-shrink-0"><Volume2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 text-slate-700">{item.meaning}</td>
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
