// ============================================================
// Firebase の初期化
// ------------------------------------------------------------
// - Authentication: Google ログイン + ドメイン制限
//   * signInWithPopup 方式を採用
//   * GitHub Pages(github.io) と authDomain(firebaseapp.com) の
//     クロスオリジン構成では signInWithRedirect がブラウザの
//     サードパーティ Cookie 制限で動かなくなるため popup に変更
// - Firestore: チェックリスト本体の保存
// ============================================================
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
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

/**
 * 永続化を一度だけ設定する Promise。
 * これを await することで「localStorage に確実に保存される状態」を保証する。
 */
let persistenceReady: Promise<void> = Promise.resolve()

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  // 永続化方式をブラウザのlocalStorageに（リダイレクト後も維持できるように）
  persistenceReady = setPersistence(getAuth(app), browserLocalPersistence)
    .catch(e => { console.warn('Firebase persistence setup failed', e) })
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
// Auth ラッパー (signInWithPopup方式)
// ------------------------------------------------------------
/**
 * Google ログインをポップアップで実行する。
 * - ポップアップ内で認証が完了するとここに戻ってくる
 * - ドメイン外なら強制サインアウトしてエラーを投げる
 */
export async function signInWithGoogle(): Promise<User> {
  if (!app) throw new Error('Firebase が設定されていません')
  // 永続化設定が完了してから signInWithPopup を呼ぶ
  await persistenceReady
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()
  // 許可ドメインのアカウント選択を促す（Workspace向けヒント）
  if (ALLOWED_DOMAINS.length === 1) {
    provider.setCustomParameters({ hd: ALLOWED_DOMAINS[0] })
  }
  const result = await signInWithPopup(auth, provider)
  if (!isAllowedEmail(result.user.email)) {
    await fbSignOut(auth)
    throw new Error(
      `このメールアドレスではログインできません（許可ドメイン: ${ALLOWED_DOMAINS.join(', ')}）`,
    )
  }
  return result.user
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
