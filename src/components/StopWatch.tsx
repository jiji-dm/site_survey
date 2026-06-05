import { useEffect, useState } from 'react'
import { Play, Square, RotateCcw, Download } from 'lucide-react'
import clsx from 'clsx'
import type { FieldValue } from '../types/checklist'
import { downloadCsv } from '../lib/download'

/** 1台ぶんのストップウォッチ状態 */
interface SW {
  startAt: number | null // 計測開始時刻（epoch ms）
  endAt: number | null    // 計測終了時刻（epoch ms）
  running: boolean        // 計測中か
}

/** 保存形（フラット）: キー `${box}:startAt` / `${box}:endAt` / `${box}:running` */
type SWValue = Record<string, string | number | boolean | null>

function asRecord(v: FieldValue): SWValue {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as SWValue) : {}
}

function readBox(rec: SWValue, box: number): SW {
  const s = rec[`${box}:startAt`]
  const e = rec[`${box}:endAt`]
  return {
    startAt: typeof s === 'number' ? s : null,
    endAt: typeof e === 'number' ? e : null,
    running: rec[`${box}:running`] === true,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 時刻（時:分:秒） */
function fmtClock(ms: number | null): string {
  if (!ms) return '--:--:--'
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 経過時間（時:分:秒） */
function fmtDur(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

interface Props {
  /** 行数（BOX数） */
  count: number
  value: FieldValue
  onChange: (v: SWValue) => void
  readOnly?: boolean
  /** CSV出力時に付与する現場情報 */
  siteName?: string
  date?: string
}

/** 1台ぶんの経過時間（ms） */
function elapsedOf(sw: SW): number {
  if (!sw.startAt) return 0
  return sw.running ? Date.now() - sw.startAt : (sw.endAt ?? sw.startAt) - sw.startAt
}

/**
 * BOX台数ぶん並ぶ計測時間ストップウォッチ。
 * 各BOXごとに 始まり → 終わり で所要時間を記録。リセットでクリア。
 */
export default function StopWatch({ count, value, onChange, readOnly, siteName, date }: Props) {
  const rec = asRecord(value)
  // いずれかが計測中なら1秒ごとに再描画
  const anyRunning = Object.entries(rec).some(([k, v]) => k.endsWith(':running') && v === true)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!anyRunning) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [anyRunning])

  function exportCsv() {
    const rows: Array<Array<string | number | null | undefined>> = []
    if (siteName) rows.push(['現場名', siteName])
    if (date) rows.push(['調査日', date])
    if (rows.length) rows.push([])
    rows.push(['VLAFS計測'])
    rows.push(['BOX', '始まり', '終わり', '計測時間'])
    for (let box = 1; box <= count; box++) {
      const sw = readBox(rec, box)
      rows.push([
        `BOX ${box}`,
        sw.startAt ? fmtClock(sw.startAt) : '',
        sw.endAt ? fmtClock(sw.endAt) : '',
        sw.startAt ? fmtDur(elapsedOf(sw)) : '',
      ])
    }
    const name = siteName ? `VLAFS計測_${siteName}` : 'VLAFS計測'
    downloadCsv(name, rows)
  }

  if (!count || count < 1) {
    return (
      <p className="text-sm text-ink-subtle rounded-xl border border-dashed border-surface-border p-3">
        「設置・機器」の <strong className="text-ink-muted">BOX台数</strong> を入力すると、台数ぶんの計測欄が表示されます。
      </p>
    )
  }

  function patch(box: number, next: SW) {
    if (readOnly) return
    onChange({
      ...rec,
      [`${box}:startAt`]: next.startAt,
      [`${box}:endAt`]: next.endAt,
      [`${box}:running`]: next.running,
    })
  }

  const boxes = Array.from({ length: count }, (_, i) => i + 1)

  return (
    <div className="space-y-3">
      {/* CSV出力 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 px-2.5 py-1.5 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 transition"
        >
          <Download size={13} /> CSV出力（Excel）
        </button>
      </div>

      {boxes.map(box => {
        const sw = readBox(rec, box)
        const elapsed = elapsedOf(sw)
        return (
          <div key={box} className="rounded-xl border border-surface-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">BOX {box}</span>
              {sw.running && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-700 animate-pulse" />
                  計測中
                </span>
              )}
            </div>

            {/* 計測時間 */}
            <div className="text-center">
              <div className="text-[11px] text-ink-muted mb-0.5">計測時間</div>
              <div
                className={clsx(
                  'font-mono font-bold tabular-nums text-3xl tracking-tight',
                  sw.running ? 'text-brand-700' : 'text-ink',
                )}
              >
                {fmtDur(elapsed)}
              </div>
            </div>

            {/* 始まり / 終わり 時刻 */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-surface border border-surface-border py-1.5">
                <div className="text-[11px] text-ink-muted">始まり</div>
                <div className="font-mono tabular-nums text-sm text-ink mt-0.5">{fmtClock(sw.startAt)}</div>
              </div>
              <div className="rounded-lg bg-surface border border-surface-border py-1.5">
                <div className="text-[11px] text-ink-muted">終わり</div>
                <div className="font-mono tabular-nums text-sm text-ink mt-0.5">{fmtClock(sw.endAt)}</div>
              </div>
            </div>

            {/* 操作ボタン */}
            <div className="flex items-center gap-2">
              {!sw.running ? (
                <button
                  type="button"
                  onClick={() => patch(box, { startAt: Date.now(), endAt: null, running: true })}
                  disabled={readOnly}
                  className={clsx(
                    'flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold text-white transition',
                    'bg-brand-700 hover:bg-brand-800',
                    readOnly && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <Play size={15} /> 始まり
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => patch(box, { startAt: sw.startAt, endAt: Date.now(), running: false })}
                  disabled={readOnly}
                  className={clsx(
                    'flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold text-white transition',
                    'bg-rose-500 hover:bg-rose-600',
                    readOnly && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <Square size={14} /> 終わり
                </button>
              )}
              <button
                type="button"
                onClick={() => patch(box, { startAt: null, endAt: null, running: false })}
                disabled={readOnly || (!sw.startAt && !sw.endAt && !sw.running)}
                className={clsx(
                  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition',
                  'border border-surface-border text-ink-muted hover:bg-surface',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                <RotateCcw size={14} /> リセット
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
