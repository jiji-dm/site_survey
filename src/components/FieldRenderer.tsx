import { Check } from 'lucide-react'
import clsx from 'clsx'
import type { Field, FieldValue } from '../types/checklist'
import ChipGroup from './ChipGroup'

interface Props {
  field: Field
  value: FieldValue
  onChange: (v: FieldValue) => void
  readOnly?: boolean
}

export default function FieldRenderer({ field, value, onChange, readOnly }: Props) {
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

      {renderControl(field, value, onChange, !!readOnly)}
    </div>
  )
}

function renderControl(
  field: Field,
  value: FieldValue,
  onChange: (v: FieldValue) => void,
  readOnly: boolean,
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
