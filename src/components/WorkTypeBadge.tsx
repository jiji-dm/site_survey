import clsx from 'clsx'
import { getWorkTypeMeta } from '../data/workTypes'
import type { WorkType } from '../types/checklist'

interface Props {
  workType: WorkType
  size?: 'sm' | 'md'
  /** アイコンのみ表示 */
  iconOnly?: boolean
  className?: string
}

export default function WorkTypeBadge({ workType, size = 'sm', iconOnly, className }: Props) {
  const m = getWorkTypeMeta(workType)
  const Icon = m.icon
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap',
        m.accentBg,
        m.accentText,
        m.accentBorder,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
    >
      <Icon size={size === 'sm' ? 11 : 13} />
      {!iconOnly && <span>{m.short}</span>}
    </span>
  )
}
