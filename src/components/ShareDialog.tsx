import { useState } from 'react'
import { X, UserPlus, Trash2, Crown, Eye, Edit3, AlertCircle, Mail } from 'lucide-react'
import clsx from 'clsx'
import { ALLOWED_DOMAINS } from '../lib/firebase'
import { saveProject } from '../lib/store'
import type { Project } from '../types/checklist'

interface Props {
  open: boolean
  project: Project
  currentUserEmail: string | null
  onClose: () => void
}

type Role = 'viewer' | 'editor'

export default function ShareDialog({ open, project, currentUserEmail, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('editor')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const isOwner = currentUserEmail === project.ownerEmail
  const members = project.sharedWith ?? []

  function validateEmail(e: string): string | null {
    const trimmed = e.trim().toLowerCase()
    if (!trimmed) return 'メールアドレスを入力してください'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'メールアドレスの形式が正しくありません'
    if (ALLOWED_DOMAINS.length > 0) {
      const domain = trimmed.split('@')[1]
      if (!ALLOWED_DOMAINS.includes(domain)) {
        return `許可ドメインのメールアドレスのみ追加できます（${ALLOWED_DOMAINS.map(d => '@' + d).join(', ')}）`
      }
    }
    if (trimmed === project.ownerEmail) return 'この方はオーナーです'
    if (members.some(m => m.email.toLowerCase() === trimmed)) return '既に追加されています'
    return null
  }

  async function handleAdd() {
    const trimmed = email.trim().toLowerCase()
    const err = validateEmail(trimmed)
    if (err) { setError(err); return }
    setError(null)
    setBusy(true)
    try {
      const next: Project = {
        ...project,
        sharedWith: [...members, { email: trimmed, role }],
      }
      await saveProject(next)
      setEmail('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(target: string) {
    if (!confirm(`${target} を共有から外しますか？`)) return
    setBusy(true)
    try {
      const next: Project = {
        ...project,
        sharedWith: members.filter(m => m.email !== target),
      }
      await saveProject(next)
    } finally {
      setBusy(false)
    }
  }

  async function handleRoleChange(target: string, newRole: Role) {
    setBusy(true)
    try {
      const next: Project = {
        ...project,
        sharedWith: members.map(m => m.email === target ? { ...m, role: newRole } : m),
      }
      await saveProject(next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg card p-5 sm:p-6 shadow-pop my-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg sm:text-xl font-bold text-ink">この現場を共有</h2>
          <button onClick={onClose} className="p-2 -m-2 text-ink-subtle hover:text-ink rounded-lg">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-ink-muted mb-4">
          メンバーを招待すると、追加した方の一覧画面にもこの現場が表示されます。
        </p>

        {/* オーナー表示 */}
        <div className="card p-3 mb-3 bg-brand-50/40 border-brand-200">
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-amber-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">オーナー</div>
              <div className="text-sm font-medium text-ink truncate">
                {project.ownerEmail}{currentUserEmail === project.ownerEmail && ' (あなた)'}
              </div>
            </div>
          </div>
        </div>

        {/* メンバー一覧 */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
            共有メンバー（{members.length}人）
          </div>
          {members.length === 0 ? (
            <div className="text-sm text-ink-subtle py-3 text-center border border-dashed border-surface-border rounded-xl">
              まだ誰にも共有されていません
            </div>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.email} className="card p-3 flex items-center gap-2">
                  <Mail size={14} className="text-ink-subtle shrink-0" />
                  <div className="text-sm text-ink truncate flex-1 min-w-0">
                    {m.email}{currentUserEmail === m.email && ' (あなた)'}
                  </div>
                  <RolePill
                    role={m.role}
                    disabled={!isOwner || busy}
                    onChange={r => handleRoleChange(m.email, r)}
                  />
                  {isOwner && (
                    <button
                      onClick={() => handleRemove(m.email)}
                      disabled={busy}
                      className="p-1.5 text-ink-subtle hover:text-red-600 rounded-md disabled:opacity-50"
                      aria-label="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 追加フォーム (オーナーのみ) */}
        {isOwner ? (
          <div className="border-t border-surface-border pt-4">
            <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
              メンバーを追加
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                className="input flex-1"
                placeholder={`name@${ALLOWED_DOMAINS[0] ?? 'example.com'}`}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="input sm:w-32"
              >
                <option value="editor">編集者</option>
                <option value="viewer">閲覧者</option>
              </select>
              <button onClick={handleAdd} disabled={busy} className="btn-primary">
                <UserPlus size={16} /> 追加
              </button>
            </div>
            {error && (
              <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
            <p className="text-[11px] text-ink-subtle mt-2">
              ※ 追加した方がアプリにアクセスすると、自動でこの現場が一覧に表示されます
            </p>
          </div>
        ) : (
          <div className="border-t border-surface-border pt-4 text-xs text-ink-subtle">
            メンバーの追加・削除はオーナーのみ可能です
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// ロール表示 (オーナーは編集可、そうでなければ表示のみ)
// ============================================================
function RolePill({
  role,
  disabled,
  onChange,
}: {
  role: Role
  disabled: boolean
  onChange: (r: Role) => void
}) {
  if (disabled) {
    return <RoleBadge role={role} />
  }
  return (
    <select
      value={role}
      onChange={e => onChange(e.target.value as Role)}
      className="text-[11px] font-medium px-2 py-1 rounded-full bg-surface border border-surface-border text-ink-muted hover:border-brand-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-300"
    >
      <option value="editor">編集者</option>
      <option value="viewer">閲覧者</option>
    </select>
  )
}

function RoleBadge({ role }: { role: Role }) {
  const Icon = role === 'editor' ? Edit3 : Eye
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border',
      role === 'editor'
        ? 'bg-brand-50 text-brand-700 border-brand-200'
        : 'bg-surface text-ink-muted border-surface-border',
    )}>
      <Icon size={10} />
      {role === 'editor' ? '編集者' : '閲覧者'}
    </span>
  )
}
