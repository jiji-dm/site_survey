import { useEffect } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { WORK_TYPES } from '../data/workTypes'
import type { WorkType } from '../types/checklist'

interface Props {
  /** 開いているか */
  open: boolean
  /** 現在選択中（編集時の変更用） */
  current?: WorkType
  /** タイトル（"新規作成" or "工事種別を変更" など） */
  title?: string
  onClose: () => void
  onPick: (workType: WorkType) => void
}

/**
 * 工事種別選択モーダル。
 * - 新規作成: 「最初に種別を選ぶ」用途
 * - 編集中: 「種別変更」用途（current を渡す）
 */
export default function WorkTypePicker({ open, current, title = '工事種別を選択', onClose, onPick }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 背景 */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      {/* ダイアログ */}
      <div className="relative w-full max-w-xl card p-5 sm:p-6 shadow-pop">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg sm:text-xl font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-ink-subtle hover:text-ink rounded-lg"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-ink-muted mb-5">
          工事の種類によって表示するチェック項目が変化します。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {WORK_TYPES.map(w => {
            const Icon = w.icon
            const active = w.id === current
            return (
              <button
                key={w.id}
                onClick={() => onPick(w.id)}
                className={clsx(
                  'group flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition',
                  'hover:shadow-card',
                  active
                    ? `${w.accentBg} ${w.accentBorder} shadow-card`
                    : 'border-surface-border bg-surface hover:border-brand-300',
                )}
              >
                <span
                  className={clsx(
                    'grid place-items-center w-10 h-10 rounded-xl shrink-0',
                    w.accentBg,
                    w.accentText,
                  )}
                >
                  <Icon size={20} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className={clsx('font-bold text-[15px]', active ? w.accentText : 'text-ink')}>
                    {w.label}
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                    {w.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
