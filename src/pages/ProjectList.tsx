import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, CalendarDays, User, ChevronRight, Trash2 } from 'lucide-react'
import { newProject, saveProject, deleteProject } from '../lib/store'
import { useProjects } from '../hooks/useProjects'
import { calcTotalProgress } from '../lib/progress'
import WorkTypeBadge from '../components/WorkTypeBadge'
import WorkTypePicker from '../components/WorkTypePicker'
import type { WorkType } from '../types/checklist'

export default function ProjectList() {
  const navigate = useNavigate()
  const projects = useProjects()
  const [pickerOpen, setPickerOpen] = useState(false)

  async function handlePick(workType: WorkType) {
    const p = newProject({ workType })
    await saveProject(p)
    setPickerOpen(false)
    navigate(`/projects/${p.id}`)
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* ヘッダー部分 */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">現場一覧</h1>
          <p className="text-sm text-ink-muted mt-1">
            これまでに調査した現場 {projects.length} 件
          </p>
        </div>
        <button onClick={() => setPickerOpen(true)} className="btn-primary">
          <Plus size={16} />
          <span>新規作成</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState onCreate={() => setPickerOpen(true)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map(p => {
            const prog = calcTotalProgress(p)
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="card p-4 sm:p-5 hover:shadow-pop hover:border-brand-200 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <WorkTypeBadge workType={p.workType} />
                    </div>
                    <h2 className="font-semibold text-ink truncate text-[15px]">
                      {p.siteName || <span className="text-ink-subtle">（無題の現場）</span>}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} /> {p.date}
                      </span>
                      {p.inCharge && (
                        <span className="inline-flex items-center gap-1">
                          <User size={12} /> {p.inCharge}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className="text-ink-subtle group-hover:text-brand-700 transition shrink-0 mt-1"
                    size={18}
                  />
                </div>

                {/* 進捗バー */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
                    <span>入力進捗</span>
                    <span className="tabular-nums">
                      {prog.filled} / {prog.total}（{Math.round(prog.ratio * 100)}%）
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full transition-[width]"
                      style={{ width: `${Math.max(prog.ratio * 100, 4)}%` }}
                    />
                  </div>
                </div>

                {/* 削除ボタン */}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={async e => {
                      e.preventDefault()
                      if (confirm(`「${p.siteName || '無題'}」を削除しますか？`)) {
                        await deleteProject(p.id)
                      }
                    }}
                    className="text-xs text-ink-subtle hover:text-red-600 inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> 削除
                  </button>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <p className="mt-8 text-xs text-ink-subtle text-center">
        ※ 現在はローカル(IndexedDB)で動作中。Firebase設定後にクラウド同期されます。
      </p>

      <WorkTypePicker
        open={pickerOpen}
        title="新規現場の工事種別を選択"
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
      />
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 grid place-items-center mb-4">
        <Plus className="text-brand-700" />
      </div>
      <h2 className="font-semibold text-ink">まだ現場が登録されていません</h2>
      <p className="text-sm text-ink-muted mt-1">
        「新規作成」から最初の現場を登録しましょう。
      </p>
      <button onClick={onCreate} className="btn-primary mt-5">
        <Plus size={16} /> 新規作成
      </button>
    </div>
  )
}
