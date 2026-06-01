import clsx from 'clsx'
import { SECTIONS } from '../data/schema'
import { calcSectionProgress } from '../lib/progress'
import type { Project } from '../types/checklist'

interface Props {
  project: Project
  activeId: string
  onChange: (id: string) => void
  /** 表示モード: mobile=下部固定タブ / desktop=縦リスト */
  variant: 'mobile' | 'desktop'
}

export default function SectionNav({ project, activeId, onChange, variant }: Props) {
  if (variant === 'desktop') {
    return (
      <nav className="space-y-1">
        {SECTIONS.map(s => {
          const prog = calcSectionProgress(s.id, project)
          const active = s.id === activeId
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={clsx(
                'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left',
                active
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-ink-muted hover:bg-brand-50 hover:text-ink',
              )}
            >
              <span className="truncate">{s.title}</span>
              <span
                className={clsx(
                  'badge tabular-nums',
                  active
                    ? 'bg-white/20 text-white'
                    : prog.status === 'done'
                      ? 'badge-done'
                      : prog.status === 'partial'
                        ? 'badge-partial'
                        : 'badge-empty',
                )}
              >
                {prog.filled}/{prog.total}
              </span>
            </button>
          )
        })}
      </nav>
    )
  }

  // mobile: 下部固定タブ
  return (
    <nav
      className="fixed left-0 right-0 bottom-0 z-30 bg-surface/95 backdrop-blur border-t border-surface-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5">
        {SECTIONS.map(s => {
          const prog = calcSectionProgress(s.id, project)
          const active = s.id === activeId
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={clsx(
                'relative flex flex-col items-center justify-center py-2.5 gap-1 transition',
                active ? 'text-brand-700' : 'text-ink-subtle',
              )}
            >
              <span
                className={clsx(
                  'badge tabular-nums',
                  active
                    ? 'bg-brand-700 text-white'
                    : prog.status === 'done'
                      ? 'badge-done'
                      : prog.status === 'partial'
                        ? 'badge-partial'
                        : 'badge-empty',
                )}
              >
                {prog.filled}/{prog.total}
              </span>
              <span className="text-[10.5px] leading-none font-medium tracking-tight">
                {s.title}
              </span>
              {active && (
                <span className="absolute top-0 left-3 right-3 h-0.5 bg-brand-700 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
