// ==========================================
// 單字 CRUD API
// GET  /api/words?userId=xxx  - 取得使用者所有單字
// POST /api/words             - 儲存單字
// ==========================================

// 取得所有單字
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return Response.json({ error: '缺少 userId' }, { status: 400 });
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM vocabulary WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    // 將 JSON 字串欄位解析回物件
    const words = results.map(row => ({
      word: row.word,
      translation: row.translation,
      partOfSpeech: row.part_of_speech,
      relatedForms: JSON.parse(row.related_forms || '[]'),
      similarWords: JSON.parse(row.similar_words || '[]'),
      exampleSentence: row.example_sentence,
      exampleTranslation: row.example_translation,
      createdAt: row.created_at,
    }));

    return Response.json(words);
  } catch (error) {
    console.error('取得單字錯誤:', error);
    return Response.json({ error: '載入失敗' }, { status: 500 });
  }
}

// 儲存單字（新增或更新）
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { userId, word, translation, partOfSpeech, relatedForms, similarWords, exampleSentence, exampleTranslation } = body;

    if (!userId || !word) {
      return Response.json({ error: '缺少必要欄位' }, { status: 400 });
    }

    await env.DB.prepare(`
      INSERT OR REPLACE INTO vocabulary 
        (user_id, word, translation, part_of_speech, related_forms, similar_words, example_sentence, example_translation, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      word.toLowerCase(),
      translation || '',
      partOfSpeech || '',
      JSON.stringify(relatedForms || []),
      JSON.stringify(similarWords || []),
      exampleSentence || '',
      exampleTranslation || '',
      Date.now()
    ).run();

    return Response.json({ success: true });
  } catch (error) {
    console.error('儲存單字錯誤:', error);
    return Response.json({ error: '儲存失敗' }, { status: 500 });
  }
}
