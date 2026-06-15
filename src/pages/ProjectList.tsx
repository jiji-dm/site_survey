import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, CalendarDays, User, ChevronRight, Trash2, Cloud, HardDrive, Users, Eye, Clock, PenLine, UserPlus } from 'lucide-react'
import { newProject, saveProject, deleteProject } from '../lib/store'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { calcTotalProgress } from '../lib/progress'
import { formatDateTime, shortEmail } from '../lib/format'
import WorkTypeBadge from '../components/WorkTypeBadge'
import WorkTypePicker from '../components/WorkTypePicker'
import AreaSetupDialog from '../components/AreaSetupDialog'
import type { SurveyArea, WorkType } from '../types/checklist'

export default function ProjectList() {
  const navigate = useNavigate()
  const projects = useProjects()
  const auth = useAuth()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [areaSetupOpen, setAreaSetupOpen] = useState(false)
  const [pendingWorkType, setPendingWorkType] = useState<WorkType | null>(null)

  // 工事種別を選んだら、次に「エリア作成」ステップへ
  function handlePick(workType: WorkType) {
    setPendingWorkType(workType)
    setPickerOpen(false)
    setAreaSetupOpen(true)
  }

  // エリア確定 → プロジェクト作成して編集画面へ
  async function handleAreaConfirm(areas: SurveyArea[]) {
    const p = newProject({ workType: pendingWorkType ?? 'install', areas })
    await saveProject(p)
    setAreaSetupOpen(false)
    setPendingWorkType(null)
    navigate(`/projects/${p.id}`)
  }

  function handleAreaBack() {
    setAreaSetupOpen(false)
    setPickerOpen(true)
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
            const myEmail = auth.status === 'signed-in' ? auth.user.email : null
            const isSharedToMe = !!myEmail && p.ownerEmail !== myEmail
            const myShare = myEmail ? p.sharedWith?.find(m => m.email === myEmail) : undefined
            const isViewer = myShare?.role === 'viewer'
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
                      {isSharedToMe && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700">
                          <Users size={11} />
                          共有された
                        </span>
                      )}
                      {isViewer && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-surface-border text-ink-muted">
                          <Eye size={11} /> 閲覧のみ
                        </span>
                      )}
                      {!isSharedToMe && (p.sharedWith?.length ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                          <Users size={11} /> {p.sharedWith?.length}人に共有
                        </span>
                      )}
                    </div>
                    <h2 className="font-semibold text-ink truncate text-[15px]">
                      {p.projectName || p.siteName || <span className="text-ink-subtle">（無題の現場）</span>}
                    </h2>
                    {p.projectName && p.siteName && (
                      <div className="text-xs text-ink-subtle truncate mt-0.5">{p.siteName}</div>
                    )}
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

                {/* メタ情報（作成/更新の日時・作成者・更新者） */}
                <div className="mt-3 pt-3 border-t border-surface-border grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                  <div className="min-w-0">
                    <div className="text-ink-subtle inline-flex items-center gap-1">
                      <Clock size={10} /> 作成日時
                    </div>
                    <div className="text-ink-muted tabular-nums truncate">{formatDateTime(p.createdAt)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-ink-subtle inline-flex items-center gap-1">
                      <PenLine size={10} /> 更新日時
                    </div>
                    <div className="text-ink-muted tabular-nums truncate">{formatDateTime(p.updatedAt)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-ink-subtle inline-flex items-center gap-1">
                      <UserPlus size={10} /> 作成者
                    </div>
                    <div className="text-ink-muted truncate" title={p.ownerEmail || '—'}>{shortEmail(p.ownerEmail)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-ink-subtle inline-flex items-center gap-1">
                      <User size={10} /> 最終更新者
                    </div>
                    <div className="text-ink-muted truncate" title={p.updatedBy || '—'}>{shortEmail(p.updatedBy)}</div>
                  </div>
                </div>

                {/* 削除ボタン (オーナーのみ) */}
                {!isSharedToMe && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={async e => {
                        e.preventDefault()
                        if (confirm(`「${p.projectName || p.siteName || '無題'}」を削除しますか？`)) {
                          await deleteProject(p.id)
                        }
                      }}
                      className="text-xs text-ink-subtle hover:text-red-600 inline-flex items-center gap-1"
                    >
                      <Trash2 size={12} /> 削除
                    </button>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* ステータス表示 */}
      <div className="mt-8 flex justify-center">
        {auth.status === 'signed-in' ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <Cloud size={12} />
            クラウド同期中（{auth.user.email}）
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <HardDrive size={12} />
            ローカルのみ（このブラウザ内にだけ保存）
          </span>
        )}
      </div>

      <WorkTypePicker
        open={pickerOpen}
        title="新規現場の工事種別を選択"
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
      />

      <AreaSetupDialog
        open={areaSetupOpen}
        onBack={handleAreaBack}
        onClose={() => {
          setAreaSetupOpen(false)
          setPendingWorkType(null)
        }}
        onConfirm={handleAreaConfirm}
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
