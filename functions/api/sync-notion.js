// ==========================================
// 同步單字至 Notion 資料庫 API
// 接受 userId, 並從 Headers 讀取 Notion 金鑰
// ==========================================

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. 驗證金鑰與資料
  const notionApiKey = request.headers.get('X-Notion-Api-Key');
  const notionDbId = request.headers.get('X-Notion-Database-Id');

  if (!notionApiKey || !notionDbId) {
    return Response.json({ error: '缺少 Notion API 憑證' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch(e) {
    return Response.json({ error: '無效的請求格式' }, { status: 400 });
  }

  const { userId } = body;
  if (!userId) {
    return Response.json({ error: '缺少 userId' }, { status: 400 });
  }

  try {
    // 2. 從 D1 撈出使用者所有單字
    const { results: words } = await env.DB.prepare(
      'SELECT * FROM vocabulary WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    if (!words || words.length === 0) {
      return Response.json({ message: '沒有可同步的單字' });
    }

    const notionHeaders = {
      'Authorization': `Bearer ${notionApiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    };

    // 3. 從 Notion 查詢現有的單字以避免重複 (分頁查詢)
    let hasMore = true;
    let nextCursor = undefined;
    const existingPages = new Map(); // word (lowercase) => notion page ID

    while(hasMore) {
      const qBody = nextCursor ? { start_cursor: nextCursor } : {};
      const qRes = await fetch(`https://api.notion.com/v1/databases/${notionDbId}/query`, {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify(qBody)
      });
      
      if (!qRes.ok) {
        const errObj = await qRes.json().catch(()=>({}));
        throw new Error(`讀取 Notion 資料庫失敗: ${errObj.message || qRes.status}`);
      }

      const data = await qRes.json();
      for (const page of data.results) {
        const titleProp = page.properties["單字 (Word)"];
        if (titleProp && titleProp.title && titleProp.title.length > 0) {
           const word = titleProp.title[0].plain_text.toLowerCase().trim();
           existingPages.set(word, page.id);
        }
      }
      hasMore = data.has_more;
      nextCursor = data.next_cursor;
    }

    // 4. 開始寫入或更新 Notion (控制請求頻率，避免超過每秒 3 次的限制)
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // 擷取前 2000 字元避免 Notion API 錯誤
    const safeString = (str) => {
        if(!str) return '';
        return String(str).substring(0, 2000);
    };

    let successCount = 0;

    for (const dbRow of words) {
      // 組合相關字串
      let relatedForms = [], similarWords = [], relatedPhrases = [];
      try { relatedForms = JSON.parse(dbRow.related_forms || '[]'); } catch(e){}
      try { similarWords = JSON.parse(dbRow.similar_words || '[]'); } catch(e){}
      try { relatedPhrases = JSON.parse(dbRow.related_phrases || '[]'); } catch(e){}
      
      const relatedArr = [];
      if (relatedForms.length) relatedArr.push('變化: ' + relatedForms.join(', '));
      if (similarWords.length) relatedArr.push('相似: ' + similarWords.join(', '));
      if (relatedPhrases.length) relatedArr.push('片語: ' + relatedPhrases.join(', '));
      const relatedStr = relatedArr.join('\n');

      // 找出合法詞性
      const validPos = ['noun', 'verb', 'adj', 'adv', 'other'];
      let pos = dbRow.part_of_speech || 'other';
      if (!validPos.includes(pos)) pos = 'other';

      const properties = {
        "單字 (Word)": { title: [{ text: { content: safeString(dbRow.word) } }] },
        "目前翻譯 (Translation)": { rich_text: [{ text: { content: safeString(dbRow.translation) } }] },
        "詞性 (Part of Speech)": { select: { name: pos } },
        "英文例句 (Example)": { rich_text: [{ text: { content: safeString(dbRow.example_sentence) } }] },
        "例句翻譯 (Ex Translation)": { rich_text: [{ text: { content: safeString(dbRow.example_translation) } }] },
        "相關詞彙/片語 (Related)": { rich_text: [{ text: { content: safeString(relatedStr) } }] },
        "AI 老師講解 (Teacher Notes)": { rich_text: [{ text: { content: safeString(dbRow.teacher_explanation) } }] },
        "記憶階段 (Stage)": { number: Number(dbRow.review_stage || 0) },
      };

      if (dbRow.next_review && Number(dbRow.next_review) > 0) {
        try {
           const d = new Date(Number(dbRow.next_review));
           if (!isNaN(d.getTime())) {
              properties["下次複習日 (Next Review)"] = { date: { start: d.toISOString() } };
           }
        } catch(e) {}
      }

      const wordKey = String(dbRow.word).toLowerCase().trim();
      const existingPageId = existingPages.get(wordKey);

      let notionUrl = '';
      let method = '';
      let reqPayload = {};

      if (existingPageId) {
        // 更新現有單字
        notionUrl = `https://api.notion.com/v1/pages/${existingPageId}`;
        method = 'PATCH';
        reqPayload = { properties };
      } else {
        // 新增單字
        notionUrl = `https://api.notion.com/v1/pages`;
        method = 'POST';
        reqPayload = {
           parent: { database_id: notionDbId },
           properties
        };
      }

      const updateRes = await fetch(notionUrl, {
         method,
         headers: notionHeaders,
         body: JSON.stringify(reqPayload)
      });

      if (!updateRes.ok) {
         console.error(`更新單字 ${wordKey} 失敗:`, await updateRes.text());
         // 我們不中斷整個流程，容錯繼續
      } else {
         successCount++;
      }

      // 控制在 3 req / sec 內
      await delay(350); 
    }

    return Response.json({ success: true, count: successCount });

  } catch (error) {
    console.error('Notion 同步錯誤:', error);
    return Response.json({ error: error.message || '伺服器執行同步時發生錯誤' }, { status: 500 });
  }
}
