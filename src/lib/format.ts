// ============================================================
// 表示用フォーマッタ（一覧・編集画面で共通利用）
// ============================================================

/** タイムスタンプ(ms)を "YYYY/MM/DD HH:mm" で表示する */
export function formatDateTime(ts?: number | null): string {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * メールアドレスを表示用に短くする（@ より前のみ）。
 * 未設定は "—"、ローカルダミー(local@dev)は "ローカル" を返す。
 */
export function shortEmail(email?: string | null): string {
  if (!email) return '—'
  if (email === 'local@dev') return 'ローカル'
  return email.split('@')[0]
}
