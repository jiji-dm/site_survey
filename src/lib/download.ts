// ============================================================
// 依存ライブラリなしの軽量ファイル出力
// ------------------------------------------------------------
// CSV は Excel でそのまま開ける。日本語が文字化けしないよう
// UTF-8 BOM (﻿) を先頭に付与する。
// ============================================================

/** 1セルをCSVエスケープ */
function escapeCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** 2次元配列を CSV ファイルとしてダウンロード */
export function downloadCsv(filename: string, rows: Array<Array<string | number | null | undefined>>): void {
  const csv = rows.map(row => row.map(escapeCell).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
