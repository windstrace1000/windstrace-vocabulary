// ==========================================
// 文章分析 API - 偵測文章中的重點單字與片語
// POST /api/analyze
// Body: { text: "Long article content..." }
// ==========================================

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { text, model } = body;

    if (!text || !text.trim()) {
      return Response.json({ error: '請提供文章內容' }, { status: 400 });
    }

    const apiKey = request.headers.get('X-Gemini-Api-Key');
    if (!apiKey) {
      return Response.json({ error: '請先在設定中輸入您的 Gemini API Key' }, { status: 401 });
    }

    const aiModel = model || 'gemini-3-flash-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;

    const prompt = `請分析以下英文文章，找出其中的 10-15 個優質單字或「常用英文片語 (Phrases)」。
請回傳一個 JSON 陣列，每個物件包含：
- originalText: 在文章中出現的原始文字內容。
- type: "word" (單字) 或 "phrase" (片語)。
- translation: 該內容的繁體中文解釋。

文章內容：
"${text.slice(0, 3000)}"`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: "你是一個專業的英文老師，請幫學生從文章中挑選出值得學習的重點單字與片語。請務必完全依照 JSON 格式回傳，且 originalText 必須精確配對文章中的原字（不分大小寫）。" }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              originalText: { type: "STRING" },
              type: { type: "STRING", enum: ["word", "phrase"] },
              translation: { type: "STRING" }
            },
            required: ["originalText", "type", "translation"]
          }
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API 回應錯誤: ${response.status}`);
    }

    const result = await response.json();
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiText) throw new Error('AI 未能回傳分析結果');

    const highlights = JSON.parse(aiText);
    return Response.json(highlights);

  } catch (error) {
    console.error('文章分析錯誤:', error);
    return Response.json({ error: error.message || '分析失敗' }, { status: 500 });
  }
}
