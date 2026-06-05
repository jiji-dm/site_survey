// ============================================================
// データストア抽象化レイヤー
// ------------------------------------------------------------
// Firebase が設定済みで認証済みなら Firestore を使い、
// それ以外はローカル(Dexie)で動作する。
//
// 画面側は store の関数だけ呼べばよい。
// ============================================================
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { liveQuery } from 'dexie'
import { db as firestore, isFirebaseConfigured } from './firebase'
import {
  listProjects as localList,
  getProject as localGet,
  saveProject as localSave,
  deleteProject as localDelete,
  newProject,
} from './db'
import type { Project } from '../types/checklist'
import { normalizeProject } from '../data/schema'

export { newProject }

const COLLECTION = 'projects'

/** Firestoreが利用可能か（設定済み + ログイン済み） */
function useCloud(): boolean {
  if (!isFirebaseConfigured || !firestore) return false
  const u = getAuth().currentUser
  return !!u
}

/** 現在のユーザーのメールアドレス */
function currentEmail(): string | null {
  if (!isFirebaseConfigured) return null
  return getAuth().currentUser?.email ?? null
}

// ============================================================
// プロジェクト一覧の購読
// ============================================================
export type ProjectListListener = (projects: Project[]) => void

/**
 * 自分が所有 or 共有された現場の一覧を購読する。
 * 戻り値は購読停止関数。
 */
export function subscribeProjects(cb: ProjectListListener): Unsubscribe {
  if (!useCloud() || !firestore) {
    // ローカルモード: Dexie liveQuery で購読
    const sub = liveQuery(() => localList()).subscribe({ next: cb })
    return () => sub.unsubscribe()
  }

  // Firestore: 自分が ownerEmail or sharedWith に入っている projects を購読
  const me = currentEmail()
  if (!me) return () => {}

  // 単純な where のみ (orderBy はクライアント側でやる → インデックス不要)
  const qOwn = query(
    collection(firestore, COLLECTION),
    where('ownerEmail', '==', me),
  )
  const qShared = query(
    collection(firestore, COLLECTION),
    where('sharedEmails', 'array-contains', me),
  )

  // 2つのクエリを購読してマージ
  let ownList: Project[] = []
  let sharedList: Project[] = []
  const emit = () => {
    const map = new Map<string, Project>()
    for (const p of ownList) map.set(p.id, p)
    for (const p of sharedList) map.set(p.id, p)
    const merged = [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt)
    cb(merged)
  }

  const u1 = onSnapshot(qOwn, snap => {
    ownList = snap.docs.map(d => fromFirestore(d.id, d.data()))
    emit()
  })
  const u2 = onSnapshot(qShared, snap => {
    sharedList = snap.docs.map(d => fromFirestore(d.id, d.data()))
    emit()
  })
  return () => { u1(); u2() }
}

// ============================================================
// 個別取得
// ============================================================
export async function getProject(id: string): Promise<Project | undefined> {
  if (!useCloud() || !firestore) return localGet(id)
  const snap = await getDoc(doc(firestore, COLLECTION, id))
  if (!snap.exists()) return undefined
  return fromFirestore(snap.id, snap.data())
}

/** 1件購読（編集画面用） */
export function subscribeProject(id: string, cb: (p: Project | undefined) => void): Unsubscribe {
  if (!useCloud() || !firestore) {
    const sub = liveQuery(() => localGet(id)).subscribe({ next: cb })
    return () => sub.unsubscribe()
  }
  return onSnapshot(doc(firestore, COLLECTION, id), snap => {
    cb(snap.exists() ? fromFirestore(snap.id, snap.data()) : undefined)
  })
}

// ============================================================
// 保存・削除
// ============================================================
export async function saveProject(p: Project): Promise<void> {
  // 所有者を補完（初回保存時）
  if (!p.ownerEmail || p.ownerEmail === 'local@dev') {
    p.ownerEmail = currentEmail() ?? p.ownerEmail
  }
  p.updatedAt = Date.now()
  p.updatedBy = currentEmail() ?? p.updatedBy

  if (!useCloud() || !firestore) {
    return localSave(p)
  }

  await setDoc(
    doc(firestore, COLLECTION, p.id),
    toFirestore(p),
    { merge: false }, // 完全置換
  )
  // ローカルにもキャッシュ（オフライン時に見えるように）
  await localSave(p).catch(() => {/* ignore */})
}

export async function deleteProject(id: string): Promise<void> {
  if (!useCloud() || !firestore) {
    return localDelete(id)
  }
  await deleteDoc(doc(firestore, COLLECTION, id))
  await localDelete(id).catch(() => {/* ignore */})
}

// ============================================================
// Firestore <-> Project の変換
// ------------------------------------------------------------
// Firestore 上は sharedEmails (array of string) を別途持たせて、
// array-contains での検索を可能にする。
// ============================================================
function toFirestore(p: Project): Record<string, unknown> {
  const out: Record<string, unknown> = {
    ...p,
    sharedEmails: (p.sharedWith ?? []).map(s => s.email),
    serverUpdatedAt: serverTimestamp(),
  }
  // Firestoreは undefined を許容しないので、undefined のフィールドを削除する
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k]
  }
  return out
}

function fromFirestore(id: string, data: Record<string, unknown>): Project {
  const d = data as Partial<Project> & { sharedEmails?: string[] }
  return normalizeProject({
    id,
    workType: (d.workType as Project['workType']) ?? 'install',
    siteName: d.siteName ?? '',
    date: d.date ?? new Date().toISOString().slice(0, 10),
    inCharge: d.inCharge ?? '',
    confirmer: d.confirmer ?? '',
    values: d.values ?? {},
    areas: d.areas ?? [],
    phaseValues: d.phaseValues,
    phaseSameAs: d.phaseSameAs,
    ownerEmail: d.ownerEmail ?? '',
    sharedWith: d.sharedWith ?? [],
    updatedAt: typeof d.updatedAt === 'number' ? d.updatedAt : Date.now(),
    updatedBy: d.updatedBy,
    createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
  })
}
