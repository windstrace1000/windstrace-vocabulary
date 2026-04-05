import React from 'react';

/**
 * FormattedTeacherNotes - 專門用來渲染老師講解內容的格式化組件
 * 支援：粗體 (**text**)、底線 (<u>text</u>)、分隔線 (---)
 */
const FormattedTeacherNotes = ({ text }) => {
  if (!text) return null;

  // 1. 先依據分隔線切分區塊
  const sections = text.split(/\n---\n|---/g);

  // 2. 高亮格式化函數 (處理粗體、底線)
  const formatText = (content) => {
    // 使用正則表達式捕獲 **粗體** 或 <u>底線</u>
    const parts = content.split(/(\*\*.*?\*\*|<u>.*?<\/u>)/g);
    
    return parts.map((part, i) => {
      // 粗體
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-indigo-900 font-bold">{part.slice(2, -2)}</strong>;
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
                      {formatText(line.replace(/^\d+\.\s*/, ''))}
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
