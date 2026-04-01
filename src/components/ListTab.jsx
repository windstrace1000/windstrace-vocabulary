// ==========================================
// ListTab 單字本頁面組件
// ==========================================

import { Search, BookOpen, ArrowUpDown, LayoutGrid, List, CalendarDays } from 'lucide-react';
import WordCard from './WordCard';

export default function ListTab({ vocabulary, onSearch, onDeleteWord }) {
  const {
    savedWords, sortBy, setSortBy, filterText, setFilterText,
    posFilter, setPosFilter, viewMode, setViewMode,
    isGrouped, setIsGrouped, expandedWordId, setExpandedWordId,
    uniquePosList, processedWords, groupedWords,
  } = vocabulary;

  const renderWordCard = (wordData) => (
    <WordCard
      key={wordData.word}
      wordData={wordData}
      isExpanded={expandedWordId === wordData.word}
      viewMode={viewMode}
      onExpand={() => setExpandedWordId(wordData.word)}
      onCollapse={() => setExpandedWordId(null)}
      onDelete={onDeleteWord}
      onSearch={onSearch}
    />
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      {/* 標題與工具列 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex-shrink-0">我的單字本 ({savedWords.length})</h2>

        {savedWords.length > 0 && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
            {/* 搜尋 */}
            <div className="relative flex-1 sm:w-48 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋單字..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* 篩選與排序 */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <select
                value={posFilter}
                onChange={(e) => setPosFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer flex-shrink-0"
              >
                <option value="all">所有詞性</option>
                {uniquePosList.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all flex-shrink-0">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    if (e.target.value.startsWith('alpha')) setIsGrouped(false);
                  }}
                  className="bg-transparent text-slate-700 text-sm focus:outline-none cursor-pointer"
                >
                  <option value="date-desc">最新加入</option>
                  <option value="date-asc">最早加入</option>
                  <option value="alpha-asc">A-Z</option>
                  <option value="alpha-desc">Z-A</option>
                </select>
              </div>

              {/* 檢視模式切換 */}
              <div className="flex bg-slate-200/50 p-1 rounded-xl flex-shrink-0 ml-auto sm:ml-0 items-center">
                <button
                  onClick={() => {
                    const nextGrouped = !isGrouped;
                    setIsGrouped(nextGrouped);
                    if (nextGrouped && !sortBy.startsWith('date')) setSortBy('date-desc');
                  }}
                  className={`p-1.5 rounded-lg transition-colors mr-1 ${isGrouped ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="按日期分區塊"
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="網格檢視"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="清單檢視"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 單字列表 */}
      {savedWords.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">你的單字本還是空的</h3>
          <p className="text-slate-400 mt-1">趕快去「查詢」新增一些單字吧！</p>
        </div>
      ) : processedWords.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">找不到符合的單字</h3>
          <p className="text-slate-400 mt-1">請嘗試其他的搜尋條件或過濾器。</p>
        </div>
      ) : isGrouped && groupedWords ? (
        <div className="space-y-8">
          {groupedWords.map(group => (
            <div key={group.label} className="animate-in fade-in">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-bold text-slate-600 bg-slate-200/50 px-3 py-1 rounded-lg">{group.label}</h3>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start" : "flex flex-col gap-3"}>
                {group.words.map(renderWordCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start" : "flex flex-col gap-3"}>
          {processedWords.map(renderWordCard)}
        </div>
      )}
    </div>
  );
}
