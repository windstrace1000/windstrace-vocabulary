// ==========================================
// QuizTab 測驗頁面組件
// ==========================================

import { BrainCircuit, Volume2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { playAudio } from '../utils/audio';

export default function QuizTab({ quiz }) {
  const {
    quizList, quizIndex, showAnswer, setShowAnswer,
    quizMode, quizScore, handleAnswer, restart, changeMode,
    currentWord, isComplete, hasWords, isReviewMode, setIsReviewMode, dueCount
  } = quiz;

  // 如果今日沒有待複習單字
  if (isReviewMode && quizList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <ControlPanel />
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">太棒了！目前沒有待複習的單字</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            你已經完成了所有的階段性複習任務。現在是學習新單字的好時機，或者你可以切換到「全體測驗」模式來鞏固記憶。
          </p>
          <button 
            onClick={() => setIsReviewMode(false)}
            className="mt-8 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            去全體測驗看看
          </button>
        </div>
      </div>
    );
  }

  // 沒有足夠的單字
  if (!hasWords) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in">
        <BrainCircuit className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600">沒有足夠的單字</h3>
        <p className="text-slate-400 mt-1">請先到單字本儲存一些單字再來測驗吧！</p>
      </div>
    );
  }

  // 模式切換按鈕
  const ControlPanel = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full mb-6">
      <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setIsReviewMode(true)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${isReviewMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          今日複習 {dueCount > 0 && <span className="ml-1 bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full text-[10px]">{dueCount}</span>}
        </button>
        <button
          onClick={() => setIsReviewMode(false)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${!isReviewMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >全體測驗</button>
      </div>

      <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => changeMode('en-zh')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${quizMode === 'en-zh' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >英翻中</button>
        <button
          onClick={() => changeMode('zh-en')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${quizMode === 'zh-en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >中翻英</button>
      </div>
    </div>
  );

  // 測驗完成畫面
  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <ControlPanel />
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in zoom-in-95">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{isReviewMode ? '今日複習完成！' : '全體測驗完成！'}</h2>
          <p className="text-slate-600 mb-8 leading-relaxed px-6">
            你剛剛進行了 <span className="font-bold text-indigo-600">{quizList.length}</span> 次答題，<br />
            {isReviewMode ? '恭喜你完成了這批單字的艾賓浩斯週期複習，記憶力更上一層樓！' : `成功將 ${quizScore} 個單字標記為已經熟練！`}
          </p>
          <button onClick={restart} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-200">
            再次測驗
          </button>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;
  const isEnToZh = quizMode === 'en-zh';

  // 測驗進行中
  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <ControlPanel />
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
          測驗進度：<span className="font-bold text-indigo-600">{quizIndex + 1}</span> / {quizList.length}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden min-h-[400px] flex flex-col">
        <div className="flex-1 p-8 sm:p-12 flex flex-col items-center justify-center text-center relative">
          <span className="absolute top-6 right-6 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold">
            {currentWord.partOfSpeech}
          </span>

          {isEnToZh ? (
            <>
              <h2 className="text-5xl sm:text-6xl font-extrabold text-slate-900 mb-6">{currentWord.word}</h2>
              <button onClick={() => playAudio(currentWord.word)} className="p-3 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors mb-8">
                <Volume2 className="w-6 h-6" />
              </button>
            </>
          ) : (
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-8">{currentWord.translation}</h2>
          )}

          {showAnswer ? (
            <div className="animate-in slide-in-from-bottom-2 w-full">
              <div className="w-16 h-1 bg-indigo-100 mx-auto mb-6 rounded-full"></div>
              {isEnToZh ? (
                <h3 className="text-2xl font-bold text-indigo-700 mb-4">{currentWord.translation}</h3>
              ) : (
                <div className="flex items-center justify-center gap-3 mb-4">
                  <h3 className="text-3xl sm:text-4xl font-bold text-indigo-700">{currentWord.word}</h3>
                  <button onClick={() => playAudio(currentWord.word)} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              )}
              <p className="text-slate-600 italic text-lg bg-slate-50 p-4 rounded-xl">
                "{currentWord.exampleSentence}"
                <br />
                <span className="text-sm text-slate-400 not-italic mt-2 block">{currentWord.exampleTranslation}</span>
              </p>
            </div>
          ) : (
            <button onClick={() => setShowAnswer(true)} className="text-indigo-600 font-medium hover:underline text-lg mt-4">
              點擊查看答案
            </button>
          )}
        </div>

        {showAnswer && (
          <div className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100">
            <button onClick={() => handleAnswer('unknown')} className="p-4 sm:p-6 text-slate-600 hover:bg-rose-50 hover:text-rose-600 font-medium flex flex-col items-center gap-2 transition-colors">
              <XCircle className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="text-sm sm:text-base">完全不會</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-normal">加入隊尾 2 次</span>
            </button>
            <button onClick={() => handleAnswer('familiar')} className="p-4 sm:p-6 text-slate-600 hover:bg-amber-50 hover:text-amber-600 font-medium flex flex-col items-center gap-2 transition-colors">
              <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="text-sm sm:text-base">還不熟悉</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-normal">加入隊尾 1 次</span>
            </button>
            <button onClick={() => handleAnswer('mastered')} className="p-4 sm:p-6 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 font-medium flex flex-col items-center gap-2 transition-colors">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="text-sm sm:text-base">已經熟練</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-normal">過關</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
