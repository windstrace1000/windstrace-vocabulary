// ==========================================
// TTS 語音播放工具
// ==========================================

/**
 * 取得高品質的英文語音
 */
const getBestVoice = () => {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // 優先權順序：Natural (Edge) > Google (Chrome) > Premium/Enhanced (macOS)
  const preferredPatterns = ['Natural', 'Google', 'Premium'];

  for (const pattern of preferredPatterns) {
    const found = voices.find(v => 
      v.lang.startsWith('en') && v.name.includes(pattern)
    );
    if (found) return found;
  }
  return null;
};

/**
 * 播放英文語音
 * 優先順序：本地高品質語音 > Google 線上真人發音 > 本地普通語音
 */
export const playAudio = async (text) => {
  if (!text) return;

  // 1. 嘗試尋找本地高品質 (Natural/Google) 語音
  const bestVoice = getBestVoice();
  
  if (bestVoice) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = bestVoice;
    utterance.lang = bestVoice.lang;
    utterance.rate = 0.85; 
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    return;
  }

  // 2. 如果本地沒有高品質語音，則使用 Google Translate 的真人發音引擎 (線上)
  // 這通常比大多數系統預設的機器發音更接近真人
  try {
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
    const audio = new Audio(audioUrl);
    await audio.play();
  } catch (error) {
    // 3. 最後的墊底方案：使用本地普通語音
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }
};

// 初始化語音清單（部分瀏覽器需要）
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}
