import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { watchAuth, isFirebaseConfigured, isAllowedEmail } from '../lib/firebase'

export type AuthState =
  | { status: 'loading' }
  | { status: 'no-firebase' }         // .env未設定 → ローカル開発モード
  | { status: 'signed-out' }
  | { status: 'unauthorized'; email: string | null }
  | { status: 'signed-in'; user: User }

/** ログイン状態を購読する */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(
    isFirebaseConfigured ? { status: 'loading' } : { status: 'no-firebase' },
  )

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = watchAuth(user => {
      if (!user) {
        setState({ status: 'signed-out' })
        return
      }
      if (!isAllowedEmail(user.email)) {
        setState({ status: 'unauthorized', email: user.email })
        return
      }
      setState({ status: 'signed-in', user })
    })
    return () => unsub()
  }, [])

  return state
}
