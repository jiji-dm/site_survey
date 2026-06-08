import { Check } from 'lucide-react'
import clsx from 'clsx'
import type { Field, FieldValue } from '../types/checklist'
import type { ComputedValue } from '../data/schema'
import ChipGroup from './ChipGroup'
import HeightInput from './HeightInput'
import CarrierMatrix from './CarrierMatrix'
import StopWatch from './StopWatch'
import DistanceGroups from './DistanceGroups'

interface Props {
  field: Field
  value: FieldValue
  onChange: (v: FieldValue) => void
  readOnly?: boolean
  /** carrier_matrix の行数（BOX数）など、他フィールドから算出した補助値 */
  count?: number
  /** computed 型の算出結果（値・上限・超過） */
  computed?: ComputedValue | null
  /** stopwatch の CSV出力に使う現場情報 */
  siteName?: string
  date?: string
}

export default function FieldRenderer({ field, value, onChange, readOnly, count, computed, siteName, date }: Props) {
  return (
    <div className="space-y-1.5">
      {/* check 以外はラベルを上に */}
      {field.type !== 'check' && (
        <div className="flex items-baseline justify-between gap-3">
          <label className="field-label">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {field.hint && <span className="field-hint">{field.hint}</span>}
        </div>
      )}

      {renderControl(field, value, onChange, !!readOnly, count, computed, siteName, date)}
    </div>
  )
}

function renderControl(
  field: Field,
  value: FieldValue,
  onChange: (v: FieldValue) => void,
  readOnly: boolean,
  count?: number,
  computed?: ComputedValue | null,
  siteName?: string,
  date?: string,
) {
  switch (field.type) {
    case 'single':
      return (
        <ChipGroup
          options={field.options ?? []}
          value={typeof value === 'string' ? value : null}
          onChange={v => onChange(v)}
          disabled={readOnly}
        />
      )
    case 'multi':
      return (
        <ChipGroup
          multi
          options={field.options ?? []}
          value={Array.isArray(value) ? value : []}
          onChange={v => onChange(v)}
          disabled={readOnly}
        />
      )
    case 'number':
      return (
        <div className="flex items-center gap-2 max-w-[16rem]">
          <input
            inputMode="decimal"
            type="number"
            className="input"
            value={typeof value === 'number' ? value : ''}
            onChange={e => {
              const v = e.target.value
              onChange(v === '' ? null : Number(v))
            }}
            placeholder="0"
            disabled={readOnly}
          />
          {field.suffix && (
            <span className="text-sm text-ink-muted whitespace-nowrap">{field.suffix}</span>
          )}
        </div>
      )
    case 'height':
      return (
        <HeightInput
          value={value}
          onChange={v => onChange(v)}
          presets={field.presets}
          suffix={field.suffix}
          readOnly={readOnly}
        />
      )
    case 'text':
      return (
        <input
          type="text"
          className="input"
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.hint ?? ''}
          disabled={readOnly}
        />
      )
    case 'memo':
      return (
        <textarea
          rows={3}
          className="input leading-relaxed resize-y min-h-[5.5rem]"
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.hint ?? ''}
          disabled={readOnly}
        />
      )
    case 'carrier_matrix':
      return (
        <CarrierMatrix
          count={count ?? 0}
          value={value}
          onChange={v => onChange(v)}
          readOnly={readOnly}
        />
      )
    case 'stopwatch':
      return (
        <StopWatch
          count={count ?? 0}
          value={value}
          onChange={v => onChange(v)}
          readOnly={readOnly}
          siteName={siteName}
          date={date}
        />
      )
    case 'distance_groups':
      return (
        <DistanceGroups
          value={value}
          onChange={v => onChange(v)}
          readOnly={readOnly}
          config={field.distance}
          suffix={field.suffix}
        />
      )
    case 'computed': {
      const val = computed?.value ?? 0
      const max = computed?.max ?? null
      const exceeded = computed?.exceeded ?? false
      return (
        <div className="space-y-1">
          <div
            className={clsx(
              'inline-flex items-baseline gap-1.5 px-3 py-2 rounded-xl border',
              exceeded
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-brand-50 border-brand-200 text-ink',
            )}
          >
            <span className="text-2xl font-bold tabular-nums">{val}</span>
            {field.suffix && <span className="text-sm text-ink-muted">{field.suffix}</span>}
          </div>
          {max != null && (
            <p className={clsx('text-xs', exceeded ? 'text-red-600 font-medium' : 'text-ink-subtle')}>
              {exceeded
                ? `上限 ${max}台 を超えています（BOX台数 × 3）`
                : `上限 ${max}台（BOX台数 × 3）`}
            </p>
          )}
        </div>
      )
    }
    case 'check': {
      const checked = value === true
      return (
        <button
          type="button"
          onClick={() => onChange(!checked)}
          disabled={readOnly}
          className={clsx(
            'w-full flex items-center gap-3 p-3 rounded-xl border transition text-left',
            checked
              ? 'bg-brand-50 border-brand-300 text-ink'
              : 'bg-surface border-surface-border hover:border-brand-300',
            readOnly && 'opacity-70 cursor-not-allowed',
          )}
        >
          <span
            className={clsx(
              'grid place-items-center w-6 h-6 rounded-md border transition shrink-0',
              checked
                ? 'bg-brand-700 border-brand-700 text-white'
                : 'border-surface-border text-transparent',
            )}
          >
            <Check size={16} />
          </span>
          <span className="font-medium text-[14px]">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </span>
        </button>
      )
    }
    default:
      return null
  }
}
