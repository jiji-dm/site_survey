# Site Survey - 現調チェックリスト

カメラ設置工事の現地調査を、スマホ・PC両対応のWebアプリでチェックできるツール。

## 機能（v1 MVP）

- 現場（プロジェクト）の作成・編集・削除
- 5カテゴリのチェック項目入力（PDFと同等）
  - 設置・機器 / 電源・ネットワーク / 施工条件 / 現場・運営 / 図面・既設確認
- スマホ：下部固定タブで素早くカテゴリ切替
- PC：左サイドバーでカテゴリ切替、広い画面を活用
- 入力の自動保存（変更後500ms後にIndexedDB→将来Firestoreへ同期）
- セクション別・全体の進捗バー

## 予定（v2以降）

- Firebase Authentication（Google ログイン + `@vacancorp.com` ドメイン制限）
- Firestore 同期（PCで入力→現場のスマホへ即反映）
- 共有機能（現場ごとに閲覧者/編集者をメールアドレスで追加）
- PWA（オフライン編集→オンライン時に自動同期）
- PDF出力（写真なしのチェック内容＋メモのみ）

## 開発

```bash
# 依存インストール
npm install

# 開発サーバー
npm run dev

# 型チェック + 本番ビルド
npm run build

# ローカルでビルド結果を確認
npm run preview
```

## 技術スタック

- **Vite + React + TypeScript** : フロントエンド
- **Tailwind CSS** : スタイル（ブランドカラー #512376 ベース）
- **React Router (HashRouter)** : ルーティング（GitHub Pages 対応）
- **Dexie** : IndexedDB ラッパー（オフライン保存）
- **Firebase** : Authentication + Firestore（v2 で本格導入）
- **lucide-react** : アイコン
- **@react-pdf/renderer** : PDF出力（v2 で利用）

## ディレクトリ構成

```
src/
├─ App.tsx                   ルートコンポーネント（ルーティング）
├─ main.tsx                  エントリーポイント
├─ index.css                 Tailwind + 自作コンポーネントクラス
├─ types/checklist.ts        スキーマ型・データ型
├─ data/schema.ts            ★ PDFの全項目を定義（編集してOK）
├─ lib/
│  ├─ db.ts                  Dexie (IndexedDB) ラッパー
│  ├─ firebase.ts            Firebase初期化 + ドメイン制限
│  └─ progress.ts            進捗計算
├─ hooks/
│  └─ useDebounce.ts         オートセーブ用
├─ components/
│  ├─ AppShell.tsx           ヘッダー + アウトレット
│  ├─ SectionNav.tsx         カテゴリナビ（mobile/desktop切替）
│  ├─ FieldRenderer.tsx      フィールド種別ごとの描画
│  └─ ChipGroup.tsx          単一/複数選択UI
└─ pages/
   ├─ ProjectList.tsx        現場一覧
   └─ ProjectEdit.tsx        編集画面
```

## チェック項目の追加・編集

`src/data/schema.ts` を編集するだけで、新しい項目や選択肢を追加できます。
画面側は自動で対応します。

```ts
// 例: 新しい選択肢を追加
{ id: 'arm_type', label: 'アーム種類', type: 'single',
  options: ['ビス留', '磁石', 'クランプ', 'プレート', '溶接', 'その他'] },
```

## Firebase セットアップ手順（v2で本番運用する場合）

1. [Firebase コンソール](https://console.firebase.google.com/) で新規プロジェクト作成
2. 「Authentication」→「Sign-in method」→ Google を有効化
3. 「Firestore Database」→ データベース作成（本番モード）
4. 「プロジェクトの設定」→「Web アプリを追加」→ 設定値を取得
5. ルートに `.env.local` を作成（`.env.example` をコピー）
6. 取得した設定値を貼り付け
7. `VITE_ALLOWED_DOMAINS=vacancorp.com` を設定

### Firestore Security Rules（参考）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAllowed() {
      return request.auth != null
        && request.auth.token.email.matches('.*@vacancorp[.]com$')
        && request.auth.token.email_verified == true;
    }
    function canAccess() {
      return resource.data.ownerEmail == request.auth.token.email
        || request.auth.token.email in resource.data.sharedWith[].email;
    }
    match /projects/{projectId} {
      allow read, update, delete: if isAllowed() && canAccess();
      allow create: if isAllowed();
    }
  }
}
```

## GitHub Pages へのデプロイ手順

1. リポジトリを GitHub に push（リポジトリ名を例えば `site_survey` とする）
2. `.env.production` に `VITE_BASE=/site_survey/` を設定
3. デプロイコマンド

```bash
# ビルド
VITE_BASE=/site_survey/ npm run build

# gh-pages ブランチへ公開
npx gh-pages -d dist
```

4. GitHub の Settings → Pages で `gh-pages` ブランチをソースに設定
5. 数十秒後に `https://<username>.github.io/site_survey/` で公開される

### Firebase 認可ドメイン

公開URL（例: `<username>.github.io`）を、
Firebase コンソール → Authentication → Settings → 承認済みドメイン に追加する必要があります。
