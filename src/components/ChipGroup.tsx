import clsx from 'clsx'

interface SingleProps {
  multi?: false
  options: string[]
  value: string | undefined | null
  onChange: (v: string | null) => void
}
interface MultiProps {
  multi: true
  options: string[]
  value: string[] | undefined | null
  onChange: (v: string[]) => void
}
type Props = SingleProps | MultiProps

/**
 * 紫アクセントのチップ式選択UI（単一/複数対応）
 * - 1タップで即選択 → 操作性◎
 * - 選択済みは紫塗りで明確に
 */
export default function ChipGroup(props: Props) {
  if (props.multi) {
    const v = props.value ?? []
    return (
      <div className="flex flex-wrap gap-2">
        {props.options.map(opt => {
          const active = v.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const next = active ? v.filter(x => x !== opt) : [...v, opt]
                props.onChange(next)
              }}
              className={clsx('chip', active && 'chip-active')}
            >
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {props.options.map(opt => {
        const active = props.value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => props.onChange(active ? null : opt)}
            className={clsx('chip', active && 'chip-active')}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
