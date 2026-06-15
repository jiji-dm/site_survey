// ============================================================
// 編集履歴（保存ごとのログ）ユーティリティ
// ------------------------------------------------------------
// 手動保存のたびに「いつ・誰が・どこを変えたか」を1件記録する。
// 変更点（changes）は前回保存版と今回版を比較して、人が読めるラベルに
// まとめる（フィールドのラベルやエリア名で表現）。
// ============================================================
import type { Project, Values, FieldValue, HistoryEntry } from '../types/checklist'
import { SECTIONS } from '../data/schema'

/** 履歴の最大保持件数（古いものから切り捨て） */
export const HISTORY_MAX = 200

/** 変更点ラベルの最大表示数 */
const CHANGES_MAX = 15

/** フィールドID → ラベル の対応表（スキーマから一度だけ構築） */
const FIELD_LABELS: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const s of SECTIONS) {
    for (const g of s.groups) {
      for (const f of g.fields) map[f.id] = f.label
    }
  }
  return map
})()

function labelOf(fieldId: string): string {
  return FIELD_LABELS[fieldId] ?? fieldId
}

/** 値が等しいか（構造化値も含めて素朴に比較） */
function valueEqual(a: FieldValue, b: FieldValue): boolean {
  if (a === b) return true
  // null / undefined / 空文字 はすべて「未入力」とみなして同一扱い
  const empty = (v: FieldValue) => v === null || v === undefined || v === ''
  if (empty(a) && empty(b)) return true
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/** values マップ同士の差分フィールドラベルを labels に追加する */
function diffValues(prev: Values | undefined, next: Values | undefined, labels: Set<string>, prefix: string) {
  const pv = prev ?? {}
  const nv = next ?? {}
  const keys = new Set([...Object.keys(pv), ...Object.keys(nv)])
  for (const k of keys) {
    if (!valueEqual(pv[k], nv[k])) labels.add(prefix + labelOf(k))
  }
}

/**
 * 前回保存版と今回版を比較し、変更点の要約ラベル一覧を返す。
 * メタ情報・共通項目・エリア別項目・仮設フェーズをすべて対象にする。
 */
export function summarizeChanges(prev: Project, next: Project): string[] {
  const labels = new Set<string>()

  // メタ
  if (prev.siteName !== next.siteName) labels.add('現場名')
  if ((prev.projectName ?? '') !== (next.projectName ?? '')) labels.add('プロジェクト名')
  if (prev.date !== next.date) labels.add('作業開始日')
  if (prev.inCharge !== next.inCharge) labels.add('担当者')
  if (prev.workType !== next.workType) labels.add('工事種別')
  if (JSON.stringify(prev.sharedWith ?? []) !== JSON.stringify(next.sharedWith ?? [])) {
    labels.add('共有設定')
  }

  // 共通項目
  diffValues(prev.values, next.values, labels, '')

  // エリア別項目
  const prevAreas = new Map(prev.areas.map(a => [a.id, a]))
  const nextAreas = new Map(next.areas.map(a => [a.id, a]))
  for (const [id, na] of nextAreas) {
    const pa = prevAreas.get(id)
    if (!pa) {
      labels.add(`エリア追加「${na.name}」`)
      continue
    }
    if (pa.name !== na.name) labels.add(`エリア名変更「${pa.name}→${na.name}」`)
    diffValues(pa.values, na.values, labels, `${na.name}: `)
  }
  for (const [id, pa] of prevAreas) {
    if (!nextAreas.has(id)) labels.add(`エリア削除「${pa.name}」`)
  }

  // 仮設フェーズ
  if (next.phaseValues) {
    diffValues(prev.phaseValues?.setup, next.phaseValues.setup, labels, '設置時: ')
    diffValues(prev.phaseValues?.removal, next.phaseValues.removal, labels, '撤去時: ')
  }

  return [...labels].slice(0, CHANGES_MAX)
}

/**
 * 保存時の履歴エントリを作って、過去履歴に追加した配列を返す（最大件数で切り捨て）。
 * prev が無ければ「作成」、あれば「更新」として記録する。
 * 更新で変更点が1件も無いときは null を返す（履歴を増やさない）。
 */
export function appendHistory(
  prev: Project | undefined,
  next: Project,
  by: string,
  at: number,
): HistoryEntry[] | null {
  const base = prev?.history ?? []
  if (!prev) {
    const entry: HistoryEntry = { at, by, action: 'create' }
    return [...base, entry].slice(-HISTORY_MAX)
  }
  const changes = summarizeChanges(prev, next)
  if (changes.length === 0) return null
  const entry: HistoryEntry = { at, by, action: 'update', changes }
  return [...base, entry].slice(-HISTORY_MAX)
}
