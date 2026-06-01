import { useEffect, useState } from 'react'
import { ClipboardCheck, LogIn, AlertCircle, Loader2 } from 'lucide-react'
import { signInWithGoogle, ALLOWED_DOMAINS, signOut } from '../lib/firebase'

interface Props {
  /** 「アクセス権限がない」ケースのメッセージ表示用 */
  unauthorizedEmail?: string | null
  /** リダイレクト復帰時のエラー */
  error?: string | null
}

export default function Login({ unauthorizedEmail, error: externalError }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (externalError) setError(externalError)
  }, [externalError])

  async function handleSignIn() {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
      // 成功時は onAuthStateChanged が発火して App 側で画面が切り替わる
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full grid place-items-center px-4 py-10
                    bg-gradient-to-br from-brand-50 via-surface to-brand-50">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="inline-grid place-items-center w-16 h-16 rounded-3xl
                          bg-gradient-to-br from-brand-500 to-brand-800 text-white
                          shadow-pop mb-4">
            <ClipboardCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Site Survey
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            カメラ設置 現調チェックリスト
          </p>
        </div>

        {/* カード */}
        <div className="card p-6 sm:p-8">
          {unauthorizedEmail ? (
            <UnauthorizedView email={unauthorizedEmail} />
          ) : (
            <>
              <h2 className="font-semibold text-ink mb-1">ログイン</h2>
              <p className="text-sm text-ink-muted mb-5">
                Googleアカウントでログインしてください。
                {ALLOWED_DOMAINS.length > 0 && (
                  <span className="block mt-1 text-xs">
                    利用可能ドメイン:{' '}
                    {ALLOWED_DOMAINS.map(d => (
                      <code
                        key={d}
                        className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded text-[11px] mr-1"
                      >
                        @{d}
                      </code>
                    ))}
                  </span>
                )}
              </p>

              <button
                onClick={handleSignIn}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {loading ? 'ログイン中...' : 'Googleでログイン'}
              </button>

              {error && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl
                                bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              <p className="text-[11px] text-ink-subtle mt-4 leading-relaxed">
                ボタンを押すと Google のログイン画面がポップアップで開きます。<br />
                認証が完了すると自動的にアプリに進みます。
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-ink-subtle mt-6">
          認証は Google アカウント(Firebase Authentication)を使用しています
        </p>
      </div>
    </div>
  )
}

function UnauthorizedView({ email }: { email: string }) {
  return (
    <div className="text-center">
      <div className="inline-grid place-items-center w-12 h-12 rounded-2xl
                      bg-red-50 text-red-600 mb-3">
        <AlertCircle size={24} />
      </div>
      <h2 className="font-semibold text-ink">アクセス権限がありません</h2>
      <p className="text-sm text-ink-muted mt-2 break-all">
        <code className="text-ink">{email}</code> はこのアプリの<br />
        許可ドメインに含まれていません。
      </p>
      <p className="text-xs text-ink-subtle mt-3">
        利用可能ドメイン:{' '}
        {ALLOWED_DOMAINS.map(d => `@${d}`).join(', ')}
      </p>
      <button onClick={() => signOut()} className="btn-outline mt-5">
        別アカウントでログイン
      </button>
    </div>
  )
}
