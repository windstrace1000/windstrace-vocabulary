import React from 'react';

/**
 * FormattedTeacherNotes - 專門用來渲染老師講解內容的格式化組件
 * 支援：粗體 (**text**)、底線 (<u>text</u>)、分隔線 (---)
 */
const FormattedTeacherNotes = ({ text }) => {
  if (!text) return null;

  // 1. 先依據分隔線切分區塊
  const sections = text.split(/\n---\n|---/g);

  // 2. 發音功能
  const handleSpeak = (word) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 3. 高亮格式化函數 (處理粗體、底線、發音)
  const formatText = (content, shouldAddAudio = true) => {
    const trimmed = content.trim();
    
    // 特殊邏輯：如果整行是一串長英文且不含中文（通常是舊內容的例句），主動加上發音
    // 條件：長度 > 5, 不含中文, 沒有粗體標記
    const isPureEnglishSentence = shouldAddAudio && 
                                  trimmed.length > 5 && 
                                  !/[\u4E00-\u9FFF]/.test(trimmed) && 
                                  !content.includes('**');

    if (isPureEnglishSentence) {
      return (
        <span className="inline-flex items-center gap-1.5 align-baseline group">
          <span className="text-slate-700">{content}</span>
          <button 
            onClick={() => handleSpeak(trimmed)}
            className="cursor-pointer transform hover:scale-110 active:scale-95 transition-all text-indigo-400 hover:text-indigo-600 focus:outline-none"
            title="播放發音"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        </span>
      );
    }

    // 原有的 split 邏輯：處理 **粗體** 或 <u>底線</u>
    const parts = content.split(/(\*\*.*?\*\*|<u>.*?<\/u>)/g);
    
    return parts.map((part, i) => {
      // 粗體 -> 視情況加入點擊發音按鈕
      if (part.startsWith('**') && part.endsWith('**')) {
        const wordMatch = part.slice(2, -2);
        return (
          <span key={i} className="inline-flex items-center gap-1 align-baseline group">
            <strong className="text-indigo-900 font-bold">{wordMatch}</strong>
            {shouldAddAudio && (
              <button 
                onClick={() => handleSpeak(wordMatch)}
                className="cursor-pointer transform hover:scale-110 active:scale-95 transition-all text-indigo-400 hover:text-indigo-600 focus:outline-none"
                title="播放發音"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            )}
          </span>
        );
      }
      // 底線
      if (part.startsWith('<u>') && part.endsWith('</u>')) {
        return <u key={i} className="decoration-indigo-300 underline-offset-4 decoration-2">{part.slice(3, -4)}</u>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n');

        return (
          <div key={idx} className="relative">
            <div className="flex flex-col gap-1.5 text-slate-700">
              {lines.map((line, lineIdx) => {
                const isTitle = /^\d+\.\s/.test(line.trim()); // 辨識主標題 (1. 2. 3.)
                
                if (isTitle) {
                  return (
                    <div 
                      key={lineIdx} 
                      className="text-lg font-extrabold text-slate-900 mt-3 mb-1.5 flex items-center gap-2 border-b-2 border-indigo-50 pb-1"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">
                        {line.match(/^\d+/)[0]}
                      </span>
                      {formatText(line.replace(/^\d+\.\s*/, ''), false)}
                    </div>
                  );
                }

                // 一般內容行：左縮排 (ml-10) 以對齊標題後的文字起始點
                return (
                  <div 
                    key={lineIdx} 
                    className={`
                      ${line.trim() === '' ? 'h-3' : 'min-h-[1.5rem] ml-0 sm:ml-10'} 
                      whitespace-pre-wrap leading-relaxed
                    `}
                  >
                    {formatText(line)}
                  </div>
                );
              })}
            </div>
            {/* 區塊之間的分隔線 */}
            {idx < sections.length - 1 && (
              <div className="mt-8 mb-4 border-b-2 border-slate-100 border-dashed w-full" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FormattedTeacherNotes;
