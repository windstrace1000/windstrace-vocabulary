// ==========================================
// Gemini Vision OCR 代理 - 識別圖片中的文字
// POST /api/ocr
// Body: { image: "base64..." }
// ==========================================

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const body = await request.json();
    const { image, model } = body;

    if (!image) {
      return Response.json({ error: '請提供圖片資料' }, { status: 400 });
    }

    const apiKey = request.headers.get('X-Gemini-Api-Key');
    if (!apiKey) {
      return Response.json({ error: '請先在設定中輸入您的 Gemini API Key' }, { status: 401 });
    }

    const aiModel = model || 'gemini-3-flash-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;

    // 從 base64 data URL 中提取 MIME 類型和資料
    const matches = image.match(/^data:(.+?);base64,(.+)$/);
    if (!matches) {
      return Response.json({ error: '圖片格式無效' }, { status: 400 });
    }

    const mimeType = matches[1];
    const imageData = matches[2];

    const payload = {
      contents: [{
        parts: [
          {
            text: '請識別這張圖片中的所有英文文字。只需要回傳圖片中的英文文字內容即可，保持原始的段落格式和換行。如果圖片中沒有英文文字，請回傳「未偵測到英文文字」。不要加任何額外說明或 Markdown 格式。'
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageData
            }
          }
        ]
      }],
      systemInstruction: {
        parts: [{ text: '你是一個精準的 OCR 文字識別工具。請準確識別圖片中的英文文字，保持原始排版。只回傳文字內容，不要加任何標籤或說明。' }]
      }
    };

    // 帶重試機制的 API 呼叫
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`API 回應錯誤: ${response.status} - ${errBody}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error('API 未回傳內容');

        return Response.json({ text: text.trim() });
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  } catch (error) {
    console.error('OCR API 錯誤:', error);
    return Response.json(
      { error: error.message || 'OCR 識別失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
