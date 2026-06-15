// ============================================================
// 入力進捗の集計（工事種別を考慮）
// ============================================================
import type { Project, Values, FieldType, WorkType } from '../types/checklist'
import { SECTIONS, visibleGroups, visibleFields } from '../data/schema'

function isFilled(type: FieldType, v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (type === 'number') return typeof v === 'number' && !Number.isNaN(v)
  if (type === 'check')  return v === true
  if (type === 'multi')  return Array.isArray(v) && v.length > 0
  // 距離測定メモはカウント対象外（呼び出し側で除外されるが念のため false）
  if (type === 'distance_groups') return false
  if (type === 'carrier_matrix') {
    return typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length > 0
  }
  if (type === 'stopwatch') {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
    // BOX台数ぶんのどれか1つでも開始時刻が記録されていれば入力済み
    return Object.entries(v as Record<string, unknown>)
      .some(([k, val]) => k.endsWith('startAt') && typeof val === 'number')
  }
  return typeof v === 'string' ? v.trim().length > 0 : !!v
}

export interface ProgressStat {
  filled: number
  total: number
  /** 0..1 */
  ratio: number
  /** "empty" | "partial" | "done" */
  status: 'empty' | 'partial' | 'done'
}

/** 値の取得元（仮設の dualPhase はフェーズ別） */
function getValuesForSection(
  project: Project,
  phase: 'setup' | 'removal' | null,
): Values {
  if (phase && project.phaseValues) {
    return project.phaseValues[phase] ?? {}
  }
  return project.values
}

export function calcSectionProgress(
  sectionId: string,
  project: Project,
  phase?: 'setup' | 'removal' | null,
  /** perArea セクションで特定エリアのみ集計する場合に指定（省略時は全エリア合算） */
  areaId?: string,
): ProgressStat {
  const s = SECTIONS.find(x => x.id === sectionId)
  if (!s) return { filled: 0, total: 0, ratio: 0, status: 'empty' }

  // エリア別セクション: 指定があればそのエリア、無ければ全エリア合算
  if (s.perArea) {
    const areas = areaId
      ? project.areas.filter(a => a.id === areaId)
      : project.areas
    let filled = 0
    let total = 0
    for (const a of areas) {
      for (const g of visibleGroups(s, project.workType, a.values)) {
        for (const f of visibleFields(g, project.workType, a.values)) {
          // 付随メモ・距離測定メモ・自動算出値などは進捗カウントから除外（memo型は既定で対象外）
          if (f.type === 'memo' || f.type === 'distance_groups' || f.type === 'computed' || f.noCount) continue
          total++
          if (isFilled(f.type, a.values[f.id])) filled++
        }
      }
    }
    return statFrom(filled, total)
  }

  // 仮設で dualPhase セクションの場合、未指定なら 設置/撤去 両方合算（同一条件ONなら片方のみ）
  if (s.dualPhase && project.workType === 'temporary' && !phase) {
    const same = project.phaseSameAs?.[sectionId] === true
    if (same) {
      // setup の値のみ評価（撤去は同一条件で複製される想定）
      return calcSectionProgress(sectionId, project, 'setup')
    }
    const a = calcSectionProgress(sectionId, project, 'setup')
    const b = calcSectionProgress(sectionId, project, 'removal')
    const filled = a.filled + b.filled
    const total = a.total + b.total
    return statFrom(filled, total)
  }

  const values = getValuesForSection(project, phase ?? null)
  let filled = 0
  let total = 0
  for (const g of visibleGroups(s, project.workType, values)) {
    for (const f of visibleFields(g, project.workType, values)) {
      // 付随メモ・自動算出値などは進捗カウントから除外（memo型は既定で対象外）
      if (f.type === 'memo' || f.type === 'computed' || f.noCount) continue
      total++
      if (isFilled(f.type, values[f.id])) filled++
    }
  }
  return statFrom(filled, total)
}

export function calcTotalProgress(project: Project): ProgressStat {
  let filled = 0
  let total = 0
  for (const s of SECTIONS) {
    const stat = calcSectionProgress(s.id, project)
    filled += stat.filled
    total += stat.total
  }
  return statFrom(filled, total)
}

function statFrom(filled: number, total: number): ProgressStat {
  const ratio = total === 0 ? 0 : filled / total
  const status: ProgressStat['status'] =
    filled === 0 ? 'empty' : filled >= total ? 'done' : 'partial'
  return { filled, total, ratio, status }
}

// 互換用 (Values だけ渡される旧呼び出しがある場合のためのラッパー)
export function calcTotalProgressFromValues(values: Values, workType: WorkType = 'install'): ProgressStat {
  return calcTotalProgress({
    id: '', workType, siteName: '', projectName: '', date: '', inCharge: '',
    values, areas: [], ownerEmail: '', sharedWith: [], createdAt: 0, updatedAt: 0,
  })
}
