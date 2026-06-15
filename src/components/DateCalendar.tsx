// ============================================================
// 日付カレンダーピッカー
// ------------------------------------------------------------
// estimate の日付選択UI（月送りナビ＋曜日付きグリッド＋選択日表示）を
// 参考にした、YYYY-MM-DD 文字列を扱うカレンダー。
// 通常は選択日の表示行のみ。タップでカレンダーを開閉する。
// ============================================================
import { useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

interface Ymd {
  y: number
  m: number // 0-11
  d: number
}

function parseYmd(value: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) }
}

function toYmdString(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function DateCalendar({
  value,
  onChange,
  disabled,
}: {
  /** YYYY-MM-DD（未選択は空文字） */
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const sel = parseYmd(value)
  const today = new Date()
  const [open, setOpen] = useState(false)
  // 表示中の年月（初期値は選択日 or 今日）
  const [view, setView] = useState<{ y: number; m: number }>(() =>
    sel ? { y: sel.y, m: sel.m } : { y: today.getFullYear(), m: today.getMonth() },
  )

  const selDate = sel ? new Date(sel.y, sel.m, sel.d) : null
  const selText = sel ? `${sel.y}年${sel.m + 1}月${sel.d}日` : '未選択'
  const selSub = selDate ? `（${WEEKDAYS[selDate.getDay()]}曜日）` : ''

  function moveMonth(delta: number) {
    setView(v => {
      let m = v.m + delta
      let y = v.y
      if (m < 0) { m = 11; y-- }
      if (m > 11) { m = 0; y++ }
      return { y, m }
    })
  }

  function pickDay(d: number) {
    onChange(toYmdString(view.y, view.m, d))
  }

  const firstDow = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()

  return (
    <div className="mt-1 rounded-xl border border-surface-border bg-surface overflow-hidden">
      {/* 選択日の表示行（タップでカレンダー開閉） */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left disabled:opacity-60"
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          <CalendarDays size={15} className="text-brand-700 shrink-0" />
          <span className="truncate">
            <span className={clsx('text-sm font-semibold', sel ? 'text-ink' : 'text-ink-subtle')}>
              {selText}
            </span>
            {selSub && <span className="ml-1 text-xs text-ink-subtle">{selSub}</span>}
          </span>
        </span>
        {!disabled && (
          <ChevronDown
            size={15}
            className={clsx('text-ink-subtle shrink-0 transition-transform', open && 'rotate-180')}
          />
        )}
      </button>

      {open && !disabled && (
        <div className="border-t border-surface-border">
          {/* 月送りナビ */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="w-9 h-9 grid place-items-center rounded-lg border border-surface-border text-brand-700 hover:border-brand-400 transition"
              aria-label="前の月"
            >
              ‹
            </button>
            <div className="text-sm font-bold text-ink">
              {view.y}年 {view.m + 1}月
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="w-9 h-9 grid place-items-center rounded-lg border border-surface-border text-brand-700 hover:border-brand-400 transition"
              aria-label="次の月"
            >
              ›
            </button>
          </div>

          {/* 曜日ヘッダ + 日グリッド */}
          <div className="grid grid-cols-7 gap-0.5 p-2">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={clsx(
                  'text-center text-[10px] py-1',
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-ink-subtle',
                )}
              >
                {w}
              </div>
            ))}
            {Array.from({ length: firstDow }, (_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1
              const dow = (firstDow + i) % 7
              const isSel = !!sel && sel.y === view.y && sel.m === view.m && sel.d === d
              const isToday =
                view.y === today.getFullYear() &&
                view.m === today.getMonth() &&
                d === today.getDate()
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDay(d)}
                  className={clsx(
                    'text-center text-[13px] font-semibold py-1.5 rounded-lg transition',
                    isSel
                      ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm'
                      : clsx(
                          'hover:bg-brand-50',
                          isToday
                            ? 'text-brand-700 font-bold'
                            : dow === 0
                              ? 'text-red-400'
                              : dow === 6
                                ? 'text-blue-400'
                                : 'text-ink-muted',
                        ),
                  )}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
