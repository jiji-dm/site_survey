import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useMatch } from 'react-router-dom'
import { ClipboardCheck, LogOut, UserCircle2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/firebase'

/**
 * アプリ全体のシェル: ヘッダー + コンテンツアウトレット
 * 編集画面では独自のレイアウトを使うため、ヘッダーは最小限
 */
export default function AppShell() {
  const isEditing = useMatch('/projects/:id')

  return (
    <div className="min-h-full flex flex-col">
      {!isEditing && (
        <header
          className="sticky top-0 z-30 bg-surface/85 backdrop-blur border-b border-surface-border"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="grid place-items-center w-8 h-8 rounded-xl
                              bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-sm">
                <ClipboardCheck size={18} />
              </span>
              <span className="font-semibold tracking-tight text-ink">
                Site Survey
              </span>
              <span className="hidden sm:inline text-xs text-ink-subtle ml-1">
                現調チェックリスト
              </span>
            </Link>

            <UserMenu />
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}

function UserMenu() {
  const auth = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (auth.status === 'no-firebase') {
    return (
      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
        ローカル開発
      </span>
    )
  }
  if (auth.status !== 'signed-in') return null

  const u = auth.user
  const name = u.displayName ?? u.email ?? 'ユーザー'
  const initial = (name[0] ?? '?').toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-brand-50 transition"
      >
        {u.photoURL ? (
          <img
            src={u.photoURL}
            alt=""
            className="w-7 h-7 rounded-full border border-surface-border"
          />
        ) : (
          <span className="grid place-items-center w-7 h-7 rounded-full bg-brand-700 text-white text-xs font-bold">
            {initial}
          </span>
        )}
        <span className="hidden sm:inline text-xs font-medium text-ink truncate max-w-[10rem]">
          {name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-64 card p-2 shadow-pop animate-in">
          <div className="px-3 py-2.5 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <UserCircle2 className="text-ink-subtle shrink-0" size={20} />
              <div className="min-w-0">
                <div className="font-semibold text-sm text-ink truncate">{u.displayName ?? '名前なし'}</div>
                <div className="text-[11px] text-ink-muted truncate">{u.email}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm text-ink hover:bg-brand-50 inline-flex items-center gap-2"
          >
            <LogOut size={14} /> ログアウト
          </button>
        </div>
      )}
    </div>
  )
}
