import { Plus, X } from 'lucide-react'
import type { DistanceConfig, DistanceGroup, DistanceGroupsValue, FieldValue } from '../types/checklist'

interface Props {
  value: FieldValue
  onChange: (v: DistanceGroupsValue) => void
  readOnly?: boolean
  /** ラベルの採番方法など */
  config?: DistanceConfig
  /** 単位（既定 "m"） */
  suffix?: string
}

/** ＋1 / ＋5 / ＋10 のステッパー候補 */
const STEPS = [1, 5, 10] as const

/** 丸数字（①〜⑳）。範囲外は (n) で表す */
function circled(n: number): string {
  if (n >= 1 && n <= 20) return String.fromCharCode(0x2460 + n - 1)
  return `(${n})`
}

/** 安定したグループIDを生成（時刻に依存しない連番） */
let groupSeq = 0
function makeGroupId(): string {
  groupSeq += 1
  return `g-${groupSeq}-${(groupSeq * 7).toString(36)}`
}

function asValue(value: FieldValue): DistanceGroupsValue {
  if (value && typeof value === 'object' && !Array.isArray(value) && Array.isArray((value as DistanceGroupsValue).groups)) {
    return value as DistanceGroupsValue
  }
  return { groups: [] }
}

/** グループの表示ラベル（自動採番ならインデックスから生成） */
function displayLabel(group: DistanceGroup, index: number, config?: DistanceConfig): string {
  if (config?.freeLabel) return group.label
  return `${config?.prefix ?? ''}${circled(index + 1)}`
}

/** グループ内距離の合計（null は無視） */
function sumOf(group: DistanceGroup): number {
  return group.segments.reduce<number>((acc, s) => acc + (typeof s === 'number' && !Number.isNaN(s) ? s : 0), 0)
}

/**
 * 距離測定メモ。
 * 「＋新規」で LAN①・電源① 等のグループを追加し、各グループ内に複数の距離(m)を記録する。
 * 格納値は { groups: [{ label, segments: number[] }] }。合計は segments から算出する。
 */
export default function DistanceGroups({ value, onChange, readOnly, config, suffix = 'm' }: Props) {
  const { groups } = asValue(value)

  function commit(next: DistanceGroup[]) {
    if (readOnly) return
    onChange({ groups: next })
  }

  function addGroup() {
    const label = config?.freeLabel ? '' : `${config?.prefix ?? ''}${circled(groups.length + 1)}`
    // 新規グループは空欄の入力欄を1つ持って始まる（フォーム１）
    commit([...groups, { id: makeGroupId(), label, segments: [null] }])
  }

  function removeGroup(id: string) {
    commit(groups.filter(g => g.id !== id))
  }

  function renameGroup(id: string, label: string) {
    commit(groups.map(g => (g.id === id ? { ...g, label } : g)))
  }

  function setSegment(id: string, i: number, v: number | null) {
    commit(groups.map(g => {
      if (g.id !== id) return g
      const segments = g.segments.map((s, idx) => (idx === i ? v : s))
      return { ...g, segments }
    }))
  }

  function addSegment(id: string) {
    commit(groups.map(g => (g.id === id ? { ...g, segments: [...g.segments, null] } : g)))
  }

  function removeSegment(id: string, i: number) {
    commit(groups.map(g => {
      if (g.id !== id) return g
      const segments = g.segments.filter((_, idx) => idx !== i)
      // 最低1欄は残す
      return { ...g, segments: segments.length > 0 ? segments : [null] }
    }))
  }

  function bump(id: string, i: number, delta: number) {
    const g = groups.find(x => x.id === id)
    if (!g) return
    const cur = g.segments[i]
    const base = typeof cur === 'number' && !Number.isNaN(cur) ? cur : 0
    setSegment(id, i, base + delta)
  }

  return (
    <div className="space-y-3">
      {groups.map((g, gi) => (
        <div key={g.id} className="rounded-xl border border-surface-border p-3">
          {/* グループ見出し: ラベル + 合計 + 削除 */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {config?.freeLabel ? (
              <input
                type="text"
                value={g.label}
                onChange={e => renameGroup(g.id, e.target.value)}
                placeholder={`${config?.prefix ?? '名称'}${circled(gi + 1)}`}
                disabled={readOnly}
                className="bg-transparent text-[14px] font-semibold text-ink border-b border-dashed border-surface-border focus:outline-none focus:border-brand-500 px-0.5 py-0.5 min-w-0 flex-1 max-w-[12rem]"
                aria-label="名称"
              />
            ) : (
              <span className="text-[14px] font-semibold text-ink">{displayLabel(g, gi, config)}</span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted tabular-nums">
                合計 <strong className="text-ink">{sumOf(g)}</strong> {suffix}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeGroup(g.id)}
                  className="text-ink-subtle hover:text-red-600"
                  aria-label="グループを削除"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 距離の入力欄（横並び、フォーム１・フォーム２…） */}
          <div className="flex flex-wrap items-start gap-2">
            {g.segments.map((seg, si) => (
              <div key={si} className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <input
                    inputMode="decimal"
                    type="number"
                    value={typeof seg === 'number' ? seg : ''}
                    onChange={e => {
                      const t = e.target.value
                      setSegment(g.id, si, t === '' ? null : Number(t))
                    }}
                    placeholder="0"
                    disabled={readOnly}
                    className="input w-20 px-2 py-1.5 text-center"
                    aria-label={`距離${si + 1}`}
                  />
                  <span className="text-xs text-ink-muted">{suffix}</span>
                  {!readOnly && g.segments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSegment(g.id, si)}
                      className="text-ink-subtle hover:text-red-600"
                      aria-label="この距離を削除"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex gap-1">
                    {STEPS.map(step => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => bump(g.id, si, step)}
                        className="text-[11px] leading-none px-1.5 py-1 rounded-md border border-surface-border text-ink-muted hover:border-brand-300 hover:text-brand-700 transition"
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* ＋: 距離の入力欄を追加（フォーム２以降） */}
            {!readOnly && (
              <button
                type="button"
                onClick={() => addSegment(g.id)}
                className="grid place-items-center w-9 h-9 mt-0.5 rounded-lg border border-dashed border-surface-border text-ink-subtle hover:border-brand-400 hover:text-brand-700 transition shrink-0"
                aria-label="距離を追加"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* ＋新規: グループ（LAN②・電源②…）を追加 */}
      {!readOnly && (
        <button
          type="button"
          onClick={addGroup}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-surface-border px-3 py-2 text-sm text-ink-muted hover:border-brand-400 hover:text-brand-700 transition"
        >
          <Plus size={16} /> 新規
        </button>
      )}

      {readOnly && groups.length === 0 && (
        <p className="text-sm text-ink-subtle">記録なし</p>
      )}
    </div>
  )
}
