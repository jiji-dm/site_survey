import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import clsx from 'clsx'
import type { FieldValue } from '../types/checklist'

// ============================================================
// 高さ入力（カメラ高さなど）
// ------------------------------------------------------------
// ・単一値「2000」と範囲「2000〜2500」をトグルで切替
// ・数値入力 + ±100ボタン + ドロップダウン(500単位, 常に全候補表示)
// ・保存形式は文字列: "2000" または "2000〜2500"（空なら null）
// ============================================================

/** ±ボタンの刻み */
const STEP = 100
/** プルダウンの初期候補（500単位, 2000〜7000） */
export const DEFAULT_HEIGHT_PRESETS = [
  2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000,
]
/** 基準値 */
const BASE_SINGLE = 2000
const BASE_RANGE_MIN = 2000
const BASE_RANGE_MAX = 2500
/** 範囲の区切り文字 */
const SEP = '〜'

type Mode = 'single' | 'range'

interface Props {
  value: FieldValue
  onChange: (v: string | null) => void
  presets?: number[]
  suffix?: string
  readOnly?: boolean
}

function toStr(v: FieldValue): string {
  return v == null ? '' : String(v)
}

/** 入力文字列から現在のモードと各値を読み取る */
function parse(value: FieldValue): { mode: Mode; single: string; min: string; max: string } {
  const s = toStr(value)
  if (s.includes(SEP)) {
    const [a = '', b = ''] = s.split(SEP)
    return { mode: 'range', single: '', min: a.trim(), max: b.trim() }
  }
  return { mode: 'single', single: s.trim(), min: '', max: '' }
}

/** 数値文字列に刻みを加算（空なら基準値から開始） */
function bump(current: string, delta: number, base: number): string {
  const n = current.trim() === '' ? base : Number(current)
  if (!Number.isFinite(n)) return current
  const next = Math.max(0, n + delta)
  return String(next)
}

export default function HeightInput({ value, onChange, presets, suffix = 'mm', readOnly }: Props) {
  const opts = presets ?? DEFAULT_HEIGHT_PRESETS
  const { mode, single, min, max } = parse(value)

  /** 単一値を出力 */
  const emitSingle = (v: string) => onChange(v.trim() === '' ? null : v.trim())

  /** 範囲を出力 */
  const emitRange = (lo: string, hi: string) => {
    const l = lo.trim()
    const h = hi.trim()
    if (l === '' && h === '') return onChange(null)
    onChange(`${l}${SEP}${h}`)
  }

  /** モード切替（空なら基準値をセット） */
  const switchMode = (next: Mode) => {
    if (next === mode) return
    if (next === 'single') {
      emitSingle(single.trim() === '' ? String(BASE_SINGLE) : single)
    } else {
      const lo = min.trim() === '' ? String(BASE_RANGE_MIN) : min
      const hi = max.trim() === '' ? String(BASE_RANGE_MAX) : max
      emitRange(lo, hi)
    }
  }

  return (
    <div className="space-y-2.5">
      {/* モード切替 */}
      <div className="flex gap-2">
        {(['single', 'range'] as Mode[]).map(m => (
          <button
            key={m}
            type="button"
            disabled={readOnly}
            onClick={() => switchMode(m)}
            className={clsx(
              'chip',
              mode === m && 'chip-active',
              readOnly && 'opacity-60 cursor-not-allowed',
            )}
          >
            {m === 'single' ? '単一' : '範囲'}
          </button>
        ))}
      </div>

      {mode === 'single' ? (
        <Stepper
          value={single}
          base={BASE_SINGLE}
          opts={opts}
          suffix={suffix}
          readOnly={readOnly}
          onChange={emitSingle}
        />
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <Stepper
            value={min}
            base={BASE_RANGE_MIN}
            opts={opts}
            readOnly={readOnly}
            onChange={v => emitRange(v, max)}
          />
          <span className="text-ink-muted font-medium px-0.5">{SEP}</span>
          <Stepper
            value={max}
            base={BASE_RANGE_MAX}
            opts={opts}
            suffix={suffix}
            readOnly={readOnly}
            onChange={v => emitRange(min, v)}
          />
        </div>
      )}
    </div>
  )
}

interface StepperProps {
  value: string
  base: number
  opts: number[]
  suffix?: string
  readOnly?: boolean
  onChange: (v: string) => void
}

/** ±100ボタン + 入力欄 + ドロップダウン（▼で常に全候補表示） */
function Stepper({ value, base, opts, suffix, readOnly, onChange }: StepperProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 外側クリックで閉じる
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(bump(value, -STEP, base))}
        className="btn-outline !px-2.5 !py-2 shrink-0"
        aria-label={`-${STEP}`}
      >
        <Minus size={16} />
      </button>

      {/* 入力欄 + ▼ボタン（候補は入力値に関係なく常に全件表示） */}
      <div ref={ref} className="relative">
        <input
          type="text"
          inputMode="numeric"
          className="input !w-28 text-center !pr-8"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder={String(base)}
          disabled={readOnly}
        />
        <button
          type="button"
          disabled={readOnly}
          onClick={() => setOpen(o => !o)}
          className="absolute inset-y-0 right-0 grid place-items-center w-8 text-ink-muted hover:text-ink disabled:opacity-50"
          aria-label="候補を表示"
        >
          <ChevronDown size={16} className={clsx('transition', open && 'rotate-180')} />
        </button>

        {open && (
          <ul
            className="absolute z-20 mt-1 left-0 min-w-full max-h-56 overflow-auto bg-surface
                       border border-surface-border rounded-xl shadow-card py-1"
            role="listbox"
          >
            {opts.map(o => (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(String(o))
                    setOpen(false)
                  }}
                  className={clsx(
                    'w-full text-left px-3 py-2 text-sm hover:bg-brand-50',
                    Number(value) === o && 'bg-brand-50 text-brand-700 font-medium',
                  )}
                >
                  {o}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(bump(value, STEP, base))}
        className="btn-outline !px-2.5 !py-2 shrink-0"
        aria-label={`+${STEP}`}
      >
        <Plus size={16} />
      </button>

      {suffix && <span className="text-sm text-ink-muted whitespace-nowrap">{suffix}</span>}
    </div>
  )
}
