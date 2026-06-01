// ============================================================
// Firebase の初期化
// ------------------------------------------------------------
// - Authentication: Google ログイン + ドメイン制限
// - Firestore: チェックリスト本体の保存
// ============================================================
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Firebaseが設定済みかどうか（.env未設定でも開発できるように分岐） */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let app: FirebaseApp | null = null
let db: Firestore | null = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
}

export { app, db }

/** 許可ドメインのリスト（環境変数からカンマ区切りで読み込む） */
export const ALLOWED_DOMAINS: string[] = (import.meta.env.VITE_ALLOWED_DOMAINS ?? '')
  .split(',')
  .map((s: string) => s.trim().toLowerCase())
  .filter(Boolean)

/** メールアドレスが許可ドメインか */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  if (ALLOWED_DOMAINS.length === 0) return true // 未設定なら全部許可（開発用）
  const domain = email.split('@')[1]?.toLowerCase()
  return !!domain && ALLOWED_DOMAINS.includes(domain)
}

// ------------------------------------------------------------
// Auth ラッパー
// ------------------------------------------------------------
export async function signInWithGoogle(): Promise<User> {
  if (!app) throw new Error('Firebase が設定されていません')
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()
  // 許可ドメインのアカウント選択を促す（Workspace向け）
  if (ALLOWED_DOMAINS.length === 1) {
    provider.setCustomParameters({ hd: ALLOWED_DOMAINS[0] })
  }
  const cred = await signInWithPopup(auth, provider)
  if (!isAllowedEmail(cred.user.email)) {
    await fbSignOut(auth)
    throw new Error(
      `このメールアドレスではログインできません（許可ドメイン: ${ALLOWED_DOMAINS.join(', ')}）`,
    )
  }
  return cred.user
}

export async function signOut(): Promise<void> {
  if (!app) return
  await fbSignOut(getAuth(app))
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  if (!app) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(getAuth(app), cb)
}
