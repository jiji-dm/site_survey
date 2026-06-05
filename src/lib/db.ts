// ============================================================
// ローカルDB (IndexedDB) - Dexie
// ------------------------------------------------------------
// オフラインでも編集できるよう、まずはローカルに保存し、
// オンライン時に Firestore へ同期するための土台。
// ============================================================
import Dexie, { type EntityTable } from 'dexie'
import type { Project, Values, WorkType, SurveyArea } from '../types/checklist'
import { PER_AREA_FIELD_IDS } from '../data/schema'

class SiteSurveyDB extends Dexie {
  projects!: EntityTable<Project, 'id'>

  constructor() {
    super('site_survey')
    // v1: 初期スキーマ
    this.version(1).stores({
      projects: 'id, updatedAt, siteName, ownerEmail',
    })
    // v2: workType 追加（マイグレーション: 既存データに 'install' を補完）
    this.version(2)
      .stores({
        projects: 'id, updatedAt, siteName, ownerEmail, workType',
      })
      .upgrade(tx => {
        return tx.table('projects').toCollection().modify(p => {
          if (!p.workType) p.workType = 'install'
        })
      })
    // v3: エリア追加（マイグレーション: 既存のフラットな values から
    //     perArea フィールドを "エリア1" に切り出す）
    this.version(3)
      .stores({
        projects: 'id, updatedAt, siteName, ownerEmail, workType',
      })
      .upgrade(tx => {
        return tx.table('projects').toCollection().modify(p => {
          if (Array.isArray(p.areas) && p.areas.length > 0) return
          const values: Values = p.values ?? {}
          const moved: Values = {}
          const rest: Values = {}
          for (const k of Object.keys(values)) {
            if (PER_AREA_FIELD_IDS.has(k)) moved[k] = values[k]
            else rest[k] = values[k]
          }
          p.values = rest
          p.areas = [{ id: 'area-1', name: 'エリア1', values: moved }]
        })
      })
  }
}

export const db = new SiteSurveyDB()

// ------------------------------------------------------------
// 便利関数
// ------------------------------------------------------------
function makeId(): string {
  // 短めのID（時刻ベース + ランダム）
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 8)
  )
}

export function newProject(partial: Partial<Project> = {}): Project {
  const now = Date.now()
  const workType: WorkType = partial.workType ?? 'install'
  const areas: SurveyArea[] =
    partial.areas && partial.areas.length > 0
      ? partial.areas
      : [{ id: 'area-1', name: 'エリア1', values: {} }]
  return {
    id: makeId(),
    workType,
    siteName: partial.siteName ?? '',
    date: partial.date ?? new Date().toISOString().slice(0, 10),
    inCharge: partial.inCharge ?? '',
    confirmer: partial.confirmer ?? '',
    values: partial.values ?? {},
    areas,
    phaseValues: partial.phaseValues ?? (workType === 'temporary'
      ? { setup: {}, removal: {} }
      : undefined),
    phaseSameAs: partial.phaseSameAs,
    ownerEmail: partial.ownerEmail ?? 'local@dev',
    sharedWith: partial.sharedWith ?? [],
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    updatedBy: partial.updatedBy,
  }
}

export async function listProjects(): Promise<Project[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray()
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id)
}

export async function saveProject(p: Project): Promise<void> {
  p.updatedAt = Date.now()
  await db.projects.put(p)
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id)
}

export async function patchValues(id: string, patch: Values): Promise<void> {
  const p = await db.projects.get(id)
  if (!p) return
  p.values = { ...p.values, ...patch }
  p.updatedAt = Date.now()
  await db.projects.put(p)
}
