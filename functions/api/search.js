// ==========================================
// Gemini AI 搜尋代理 - 保護 API Key 不暴露在前端
// POST /api/search
// Body: { word: "example" }
// ==========================================

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { word, model } = body;

    if (!word || !word.trim()) {
      return Response.json({ error: '請提供要查詢的單字' }, { status: 400 });
    }

    const apiKey = request.headers.get('X-Gemini-Api-Key');
    if (!apiKey) {
      return Response.json({ error: '請先在設定中輸入您的 Gemini API Key' }, { status: 401 });
    }

    const aiModel = model || 'gemini-3-flash-preview'; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;

    // === 全域快取：先檢查資料庫是否已經有這個單字或片語的紀錄 ===
    if (env.DB) {
      try {
        const cleanWord = word.trim().toLowerCase();
        const isChinese = /[\u4e00-\u9fa5]/.test(cleanWord);
        
        if (!isChinese) {
          const { results } = await env.DB.prepare(
            'SELECT * FROM vocabulary WHERE word = ? LIMIT 1'
          ).bind(cleanWord).all();
          
          if (results && results.length > 0) {
            const row = results[0];
            return Response.json({
              word: row.word,
              translation: row.translation,
              partOfSpeech: row.part_of_speech,
              relatedForms: JSON.parse(row.related_forms || '[]'),
              similarWords: JSON.parse(row.similar_words || '[]'),
              relatedPhrases: JSON.parse(row.related_phrases || '[]'),
              exampleSentence: row.example_sentence,
              exampleTranslation: row.example_translation
            });
          }
        }

      } catch (dbError) {
        console.error('資料庫快取查詢內容:', dbError);
        // 若查詢失敗則繼續透過 Gemini API 查詢，不中斷流程
      }
    }
    // ===============================================

    const prompt = `請以專業英文老師的角色分析 "${word.trim()}"。
1. 如果輸入是中文，請找出其最對應的一個常用的英文單字或片語。
2. 如果輸入是英文單字，請分析該單字。
3. 如果輸入是英文片語，請分析該片語。

請提供該英文單字/片語的繁體中文翻譯、以及主要的詞性（請使用繁體中文，如：名詞、動詞、形容詞、副詞、介系詞、代名詞、連接詞、感嘆詞、助動詞、片語等）、相關詞形變化（衍生字）、拼寫相似或容易混淆的單字（形似字）、至少 2 個相關英文片語與其翻譯，以及一個實用的英文例句和翻譯。`;


    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: "你是一個嚴謹的英文老師，請務必完全依照要求的 JSON 格式回傳。所有詞性標記 (partOfSpeech) 必須使用繁體中文。相關片語 (relatedPhrases) 應包含 2-3 個該單字的常見短語搭配。" }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            word: { type: "STRING" },
            translation: { type: "STRING" },
            partOfSpeech: { type: "STRING" },
            relatedForms: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  formName: { type: "STRING" },
                  formWord: { type: "STRING" }
                }
              }
            },
            similarWords: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  word: { type: "STRING" },
                  meaning: { type: "STRING" }
                }
              }
            },
            relatedPhrases: {
              type: "ARRAY",
              description: "該單字常見的 2-3 個英文片語與翻譯",
              items: {
                type: "OBJECT",
                properties: {
                  phrase: { type: "STRING", description: "英文片語" },
                  meaning: { type: "STRING", description: "繁體中文意思" }
                }
              }
            },
            exampleSentence: { type: "STRING" },
            exampleTranslation: { type: "STRING" }
          },
          required: ["word", "translation", "partOfSpeech", "relatedForms", "similarWords", "relatedPhrases", "exampleSentence", "exampleTranslation"]
        }
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

        const parsed = JSON.parse(text);
        return Response.json(parsed);
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  } catch (error) {
    console.error('搜尋 API 錯誤:', error);
    return Response.json(
      { error: error.message || '查詢失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
