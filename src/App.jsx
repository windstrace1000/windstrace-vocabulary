// ==========================================
// App.jsx - 主應用程式組件
// 負責管理全域狀態並組合所有子組件
// ==========================================

import { useState, useMemo, useCallback } from 'react';
import { Search, BookOpen, BrainCircuit } from 'lucide-react';
import Header from './components/Header';
import SearchTab from './components/SearchTab';
import ListTab from './components/ListTab';
import QuizTab from './components/QuizTab';
import DeleteModal from './components/DeleteModal';
import SettingsModal from './components/SettingsModal';
import MobileTabButton from './components/MobileTabButton';
import { getUserId } from './utils/userId';
import { searchWord } from './services/api';
import { useVocabulary } from './hooks/useVocabulary';
import { useQuiz } from './hooks/useQuiz';

export default function App() {
  const userId = useMemo(() => getUserId(), []);
  const [activeTab, setActiveTab] = useState('search');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 查詢狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // 刪除確認
  const [wordToDelete, setWordToDelete] = useState(null);

  // 單字本 Hook
  const vocabulary = useVocabulary(userId);

  // 測驗 Hook
  const quiz = useQuiz(vocabulary.savedWords);

  // 查詢單字（可從任何頁面觸發，會自動切換到查詢頁）
  const performSearch = useCallback(async (wordToSearch) => {
    if (!wordToSearch.trim()) return;
    
    const searchStr = wordToSearch.trim().toLowerCase();
    
    setActiveTab('search');
    setSearchQuery(wordToSearch);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* 忽略 */ }
    
    // 如果單字已經在單字本中，直接顯示結果，秒殺載入時間
    const existingWord = vocabulary.savedWords.find(w => w.word.toLowerCase() === searchStr);
    if (existingWord) {
      setSearchResult(existingWord);
      setIsSearching(false);
      setSearchError('');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);
    try {
      const data = await searchWord(wordToSearch.trim());
      setSearchResult(data);
    } catch (error) {
      setSearchError(error.message || '查詢失敗，請確認網路連線或稍後再試。');
    } finally {
      setIsSearching(false);
    }
  }, [vocabulary.savedWords]);

  // 儲存單字
  const handleSaveWord = useCallback(async (wordData) => {
    await vocabulary.saveWord(wordData);
  }, [vocabulary.saveWord]);

  // 刪除單字流程
  const requestDeleteWord = useCallback((word) => {
    setWordToDelete({ word });
  }, []);

  const confirmDeleteWord = useCallback(async () => {
    if (!wordToDelete) return;
    await vocabulary.removeWord(wordToDelete.word);
    setWordToDelete(null);
  }, [wordToDelete, vocabulary.removeWord]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 sm:pb-8">
      {/* 頂部導航（桌面版） */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedWordsCount={vocabulary.savedWords.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 主要內容區 */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'search' && (
          <SearchTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResult={searchResult}
            isSearching={isSearching}
            searchError={searchError}
            savedWords={vocabulary.savedWords}
            onSearch={performSearch}
            onSaveWord={handleSaveWord}
          />
        )}
        {activeTab === 'list' && (
          <ListTab
            vocabulary={vocabulary}
            onSearch={performSearch}
            onDeleteWord={requestDeleteWord}
          />
        )}
        {activeTab === 'quiz' && (
          <QuizTab quiz={quiz} />
        )}
      </main>

      {/* 底部導航（手機版） */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-10">
        <MobileTabButton active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<Search />} label="查詢" />
        <MobileTabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')} icon={<BookOpen />} label="單字本" badge={vocabulary.savedWords.length} />
        <MobileTabButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={<BrainCircuit />} label="測驗" />
      </nav>

      {/* 刪除確認彈窗 */}
      <DeleteModal
        wordToDelete={wordToDelete}
        onCancel={() => setWordToDelete(null)}
        onConfirm={confirmDeleteWord}
      />

      {/* 系統設定彈窗 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
