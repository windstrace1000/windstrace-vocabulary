// ==========================================
// 刪除單字 API
// DELETE /api/words/:id?userId=xxx
// ==========================================

export async function onRequestDelete(context) {
  const { params, request, env } = context;
  const wordId = decodeURIComponent(params.id);
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId || !wordId) {
    return Response.json({ error: '缺少必要參數' }, { status: 400 });
  }

  try {
    await env.DB.prepare(
      'DELETE FROM vocabulary WHERE user_id = ? AND word = ?'
    ).bind(userId, wordId).run();

    return Response.json({ success: true });
  } catch (error) {
    console.error('刪除單字錯誤:', error);
    return Response.json({ error: '刪除失敗' }, { status: 500 });
  }
}
