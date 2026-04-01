// ==========================================
// Header 頂部導航組件
// ==========================================

import { BookOpen, Search, BrainCircuit, Settings } from 'lucide-react';
import TabButton from './TabButton';

export default function Header({ activeTab, setActiveTab, savedWordsCount, onOpenSettings }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600">
          <BookOpen className="w-7 h-7" />
          <h1 className="text-xl font-extrabold tracking-tight hidden sm:block">單字記憶大師</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex gap-1 bg-slate-100 p-1 rounded-lg mr-2">
            <TabButton
              active={activeTab === 'search'}
              onClick={() => setActiveTab('search')}
              icon={<Search className="w-4 h-4" />}
              label="查詢"
            />
            <TabButton
              active={activeTab === 'list'}
              onClick={() => setActiveTab('list')}
              icon={<BookOpen className="w-4 h-4" />}
              label={`單字本 (${savedWordsCount})`}
            />
            <TabButton
              active={activeTab === 'quiz'}
              onClick={() => setActiveTab('quiz')}
              icon={<BrainCircuit className="w-4 h-4" />}
              label="測驗"
            />
          </nav>
          
          <button 
            onClick={onOpenSettings}
            className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-all border border-slate-200"
            title="系統設定 (API Key)"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
