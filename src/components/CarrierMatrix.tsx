import clsx from 'clsx'
import type { FieldValue } from '../types/checklist'

/** 判定対象のキャリア */
const CARRIERS = ['Docomo', 'au', 'Softbank'] as const
/** 受信判定（○ / △ / ✕） */
const RATINGS = [
  { v: '○', label: '○', cls: 'data-[on=true]:bg-emerald-500 data-[on=true]:border-emerald-500' },
  { v: '△', label: '△', cls: 'data-[on=true]:bg-amber-400 data-[on=true]:border-amber-400' },
  { v: '✕', label: '✕', cls: 'data-[on=true]:bg-rose-500 data-[on=true]:border-rose-500' },
] as const

interface Props {
  /** 行数（BOX数） */
  count: number
  value: FieldValue
  onChange: (v: Record<string, string>) => void
  readOnly?: boolean
}

/** key: `${boxIndex}:${carrier}` 例 "1:Docomo" */
function asMatrix(value: FieldValue): Record<string, string> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, string>)
    : {}
}

/**
 * BOX台数ぶん行が増えるキャリア別電波測定 UI。
 * 各 BOX × キャリア に対して ○ / △ / ✕ を選択する。
 */
export default function CarrierMatrix({ count, value, onChange, readOnly }: Props) {
  const matrix = asMatrix(value)

  if (!count || count < 1) {
    return (
      <p className="text-sm text-ink-subtle rounded-xl border border-dashed border-surface-border p-3">
        「設置・機器」の <strong className="text-ink-muted">BOX台数</strong> を入力すると、台数ぶんの測定欄が表示されます。
      </p>
    )
  }

  function set(key: string, rating: string) {
    if (readOnly) return
    const next = { ...matrix }
    if (next[key] === rating) delete next[key]
    else next[key] = rating
    onChange(next)
  }

  const boxes = Array.from({ length: count }, (_, i) => i + 1)

  return (
    <div className="space-y-3">
      {boxes.map(box => (
        <div key={box} className="rounded-xl border border-surface-border p-3">
          <div className="text-[13px] font-semibold text-ink mb-2">BOX {box}</div>
          <div className="space-y-2">
            {CARRIERS.map(carrier => {
              const key = `${box}:${carrier}`
              const cur = matrix[key]
              return (
                <div key={carrier} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink-muted">{carrier}</span>
                  <div className="flex gap-1.5">
                    {RATINGS.map(r => (
                      <button
                        key={r.v}
                        type="button"
                        disabled={readOnly}
                        data-on={cur === r.v}
                        onClick={() => set(key, r.v)}
                        aria-pressed={cur === r.v}
                        aria-label={`${carrier} ${r.label}`}
                        className={clsx(
                          'w-10 h-10 grid place-items-center rounded-lg border text-lg font-bold transition',
                          'border-surface-border text-ink-muted bg-surface',
                          'data-[on=true]:text-white',
                          r.cls,
                          readOnly && 'opacity-60 cursor-not-allowed',
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
