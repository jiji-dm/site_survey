// ============================================================
// Firebase の初期化
// ------------------------------------------------------------
// - Authentication: Google ログイン + ドメイン制限
//   * signInWithRedirect 方式（ポップアップを使わない）を採用
//   * Safari / Workspace のサードパーティ制限 / Cookie ブロックなど
//     ポップアップが詰まる環境でも安定して動く
// - Firestore: チェックリスト本体の保存
// ============================================================
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
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
// Auth ラッパー (signInWithRedirect方式)
// ------------------------------------------------------------
/**
 * Google ログインをリダイレクトで開始する。
 * 呼ぶとそのままGoogleの認証ページに遷移するので、戻り値はない。
 * 復帰時の処理は handleAuthRedirect() で行う。
 */
export async function signInWithGoogle(): Promise<void> {
  if (!app) throw new Error('Firebase が設定されていません')
  // 永続化設定が完了してから signInWithRedirect を呼ぶ
  await persistenceReady
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()
  // 許可ドメインのアカウント選択を促す（Workspace向けヒント）
  if (ALLOWED_DOMAINS.length === 1) {
    provider.setCustomParameters({ hd: ALLOWED_DOMAINS[0] })
  }
  await signInWithRedirect(auth, provider)
  // 注意: ここから先のコードは実行されない（ブラウザがリダイレクトする）
}

/**
 * リダイレクト復帰時に呼ぶ処理。
 * - ドメイン外なら強制サインアウトしてエラーを投げる
 * - 戻り値: 認証されたUser、または null (まだ復帰待ちでない)
 *
 * App 起動時に1度だけ呼ぶ。
 */
export async function handleAuthRedirect(): Promise<User | null> {
  if (!app) return null
  // 永続化設定が完了してから getRedirectResult を呼ぶ
  await persistenceReady
  const auth = getAuth(app)
  try {
    const result = await getRedirectResult(auth)
    if (!result) return null
    if (!isAllowedEmail(result.user.email)) {
      await fbSignOut(auth)
      throw new Error(
        `このメールアドレスではログインできません（許可ドメイン: ${ALLOWED_DOMAINS.join(', ')}）`,
      )
    }
    return result.user
  } catch (e) {
    // FirebaseのエラーをUI側でわかりやすく扱えるように再スロー
    throw e
  }
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
