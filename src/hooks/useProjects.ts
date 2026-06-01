import { useEffect, useState } from 'react'
import { subscribeProject, subscribeProjects } from '../lib/store'
import type { Project } from '../types/checklist'

/** 一覧をリアルタイム購読 */
export function useProjects(): Project[] {
  const [list, setList] = useState<Project[]>([])
  useEffect(() => {
    const unsub = subscribeProjects(setList)
    return () => unsub()
  }, [])
  return list
}

/** 1件をリアルタイム購読。loading: 取得中 / loaded.found: 存在 / loaded.notFound: なし */
export type ProjectLoad =
  | { state: 'loading' }
  | { state: 'loaded'; project: Project | undefined }

export function useProject(id: string): ProjectLoad {
  const [load, setLoad] = useState<ProjectLoad>({ state: 'loading' })
  useEffect(() => {
    setLoad({ state: 'loading' })
    const unsub = subscribeProject(id, p => setLoad({ state: 'loaded', project: p }))
    return () => unsub()
  }, [id])
  return load
}
