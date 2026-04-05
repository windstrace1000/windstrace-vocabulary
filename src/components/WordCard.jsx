// ==========================================
// WordCard 單字卡片組件（展開/收合）
// ==========================================

import { Volume2, Trash2, X, Book, Newspaper, Coffee } from 'lucide-react';
import { playAudio } from '../utils/audio';
import FormattedTeacherNotes from './FormattedTeacherNotes';

export default function WordCard({ wordData, isExpanded, viewMode, onExpand, onCollapse, onDelete, onSearch }) {
  
  const renderCategoryBadge = (category) => {
    if (!category || category.type === 'lifestyle') {
      return (
        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md flex items-center gap-1 shrink-0">
          <Coffee className="w-3 h-3" /> 生活
        </span>
      );
    }
    if (category.type === 'textbook') {
      return (
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-100 flex items-center gap-1 shrink-0">
          <Book className="w-3 h-3" /> {category.version} B{category.book}{category.unit ? ` U${category.unit}` : ''}
        </span>
      );
    } else if (category.type === 'magazine') {
      return (
        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md border border-amber-100 flex items-center gap-1 shrink-0">
          <Newspaper className="w-3 h-3" /> {category.brand} {category.year}/{category.month}
        </span>
      );
    }
    return null;
  };

  // 展開狀態的完整卡片
  if (isExpanded) {
    return (
      <div
        className={`bg-white rounded-2xl shadow-md border border-slate-100 transition-all duration-300 ring-2 ring-indigo-500 ${
          viewMode === 'grid' ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''
        }`}
      >
        <div className="animate-in fade-in">
          {/* 標題區 */}
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex flex-nowrap justify-between items-start gap-2 sm:gap-4 rounded-t-2xl overflow-hidden">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 sm:gap-3 mb-1">
                <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 break-words leading-tight">{wordData.word}</h3>
                <button onClick={() => playAudio(wordData.word)} className="p-1.5 sm:p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors flex-shrink-0 mt-0.5 sm:mt-1">
                  <Volume2 className="w-5 h-5 sm:w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-lg flex-wrap">
                <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-sm font-semibold rounded-md flex-shrink-0 ${
                  (wordData.partOfSpeech?.toLowerCase() === 'phrase' || wordData.partOfSpeech === '片語')
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {(() => {
                    const pos = wordData.partOfSpeech?.toLowerCase();
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
                    return mapping[pos] || wordData.partOfSpeech;
                  })()}
                </span>
                {(wordData.categories || []).map((cat, idx) => (
                  <span key={idx} className="shrink-0 scale-90 sm:scale-100 origin-left">{renderCategoryBadge(cat)}</span>
                ))}
                <span className="text-slate-700 font-medium text-sm sm:text-lg break-words">{wordData.translation}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 flex-nowrap">
              <button onClick={() => onDelete(wordData.word)} className="flex items-center gap-1 text-[10px] sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-colors whitespace-nowrap">
                <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span className="hidden sm:inline">刪除</span>
              </button>
              <button onClick={onCollapse} className="p-1.5 sm:p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors flex-shrink-0">
                <X className="w-4 h-4 sm:w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 詳細資訊 */}
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">例句 Example</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-slate-800 text-lg mb-2 flex items-start gap-2">
                  <span>{wordData.exampleSentence}</span>
                  <button onClick={() => playAudio(wordData.exampleSentence)} className="text-slate-400 hover:text-indigo-600 mt-1">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </p>
                <p className="text-slate-500">{wordData.exampleTranslation}</p>
              </div>
            </div>

            {wordData.relatedForms?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">相關詞形 Forms</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="py-3 px-4 text-slate-500 font-medium w-1/3">型態</th><th className="py-3 px-4 text-slate-500 font-medium">單字</th></tr></thead>
                    <tbody>
                      {wordData.relatedForms.map((form, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-slate-700">{form.formName}</td>
                          <td className="py-3 px-4 font-medium text-indigo-700 flex items-center justify-between">
                            <button onClick={() => onSearch(form.formWord)} className="hover:underline hover:text-indigo-800 text-left transition-colors">{form.formWord}</button>
                            <button onClick={() => playAudio(form.formWord)} className="text-slate-400 hover:text-indigo-600 p-1"><Volume2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {wordData.similarWords?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">形似字 Similar</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium w-1/3">單字</th><th className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium">意思</th></tr></thead>
                    <tbody>
                      {wordData.similarWords.map((sim, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 sm:px-4 font-medium text-indigo-700">
                            <div className="flex items-center justify-between gap-1">
                              <button onClick={() => onSearch(sim.word)} className="hover:underline hover:text-indigo-800 text-left transition-colors truncate">{sim.word}</button>
                              <button onClick={() => playAudio(sim.word)} className="text-slate-400 hover:text-indigo-600 p-1 flex-shrink-0"><Volume2 className="w-3.5 h-3.5 sm:w-4 h-4" /></button>
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

            {wordData.relatedPhrases?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">相關片語 Phrases</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium w-1/2">片語</th><th className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium">意思</th></tr></thead>
                    <tbody>
                      {wordData.relatedPhrases.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 sm:px-4 font-medium text-indigo-700">
                            <div className="flex items-center justify-between gap-1">
                              <button onClick={() => onSearch(item.phrase)} className="hover:underline hover:text-indigo-800 text-left transition-colors break-words">{item.phrase}</button>
                              <button onClick={() => playAudio(item.phrase)} className="text-slate-400 hover:text-indigo-600 p-1 flex-shrink-0"><Volume2 className="w-3.5 h-3.5 sm:w-4 h-4" /></button>
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

            {/* 老師講解卡片 (WordCard 也有) */}
            {wordData.teacherExplanation && (
              <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 overflow-hidden mt-6">
                <div className="p-4 border-b border-indigo-100 bg-indigo-50/80 flex items-center gap-3">
                  <span className="text-xl">👩‍🏫</span>
                  <h3 className="text-base font-bold text-indigo-900">老師筆記</h3>
                </div>
                <div className="p-4 sm:p-6 prose-slate max-w-none">
                  <FormattedTeacherNotes text={wordData.teacherExplanation} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 收合狀態 - 網格模式
  if (viewMode === 'grid') {
    return (
      <div onClick={onExpand} className="bg-white rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md cursor-pointer group p-5 flex flex-col h-full">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate leading-tight">{wordData.word}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ${
                (wordData.partOfSpeech?.toLowerCase() === 'phrase' || wordData.partOfSpeech === '片語')
                ? 'bg-purple-50 text-purple-600'
                : 'bg-indigo-50 text-indigo-600'
              }`}>
                {(() => {
                  const pos = wordData.partOfSpeech?.toLowerCase();
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
                  return mapping[pos] || wordData.partOfSpeech;
                })()}
              </span>
              {(wordData.categories || []).map((cat, idx) => (
                <span key={idx} className="shrink-0">{renderCategoryBadge(cat)}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); playAudio(wordData.word); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"><Volume2 className="w-4 h-4" /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(wordData.word); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <p className="text-slate-700 font-medium mb-3">{wordData.translation}</p>
        <div className="text-sm text-slate-500 line-clamp-2 italic mb-auto">"{wordData.exampleSentence}"</div>
        <div className="mt-4 text-center text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">點擊展開</div>
      </div>
    );
  }

  // 收合狀態 - 清單模式
  return (
    <div onClick={onExpand} className="bg-white rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md cursor-pointer group p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className="w-auto sm:w-40 flex-shrink-0 flex flex-col justify-center min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate leading-tight">{wordData.word}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {(wordData.categories || []).map((cat, idx) => (
              <span key={idx} className="shrink-0">{renderCategoryBadge(cat)}</span>
            ))}
          </div>
        </div>
        <div className="hidden sm:block flex-shrink-0 w-20">
          <span className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded ${
            (wordData.partOfSpeech?.toLowerCase() === 'phrase' || wordData.partOfSpeech === '片語')
            ? 'bg-purple-50 text-purple-600'
            : 'bg-indigo-50 text-indigo-600'
          }`}>
            {(() => {
              const pos = wordData.partOfSpeech?.toLowerCase();
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
              return mapping[pos] || wordData.partOfSpeech;
            })()}
          </span>
        </div>
        <div className="flex-1 truncate text-slate-700 font-medium text-sm sm:text-base">
          {wordData.translation}
          <span className="hidden md:inline ml-3 text-sm text-slate-400 font-normal italic truncate">- {wordData.exampleSentence}</span>
        </div>
      </div>
      <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
        <button onClick={(e) => { e.stopPropagation(); playAudio(wordData.word); }} className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"><Volume2 className="w-4 h-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(wordData.word); }} className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
