# SiteSurvey（現地調査アプリ）

React + TypeScript + Vite + Tailwind / Firebase（Firestore・Hosting）+ Dexie(IndexedDB)。
チェックリストは `src/data/schema.ts` のスキーマ駆動（項目追加はここを編集）。

## 3アプリ連携での位置づけ

**母体・ハブ**。現場(siteId)・エリア(areaId)の発番元。estimate / ConstructionPhotos との
連携設計は **`/Users/nh/Apps/shared-bundle/BUNDLE_CONTRACT.md`** に確定済み。
**連携に関わる作業の前に必ず読むこと**（特に §1.1 ID規則・§5 surveyスライス・§5.1 機器グループ・§11 データフロー）。

## このアプリの実装TODO（契約 §12 から抜粋）

- cam_ip / cam_stereo 追加（camera_count は自動合計に）
- signage / lidar 台数＋機器種別、機器グループ(Plan B)対応UI（種別切替で他種別カウントをクリア）
- LANグループ(長さ)・電源距離(グループ毎)・警備員配置・道路申請許可の追加
- ladder_type の multi化、ladder_onsite の削除
- 写真閲覧画面（Storage参照・3段照合：photoKey → photoKeywords → 未分類欄＋手動割り当て）
- photoKeywords 編集UI／links台帳／概算見積書(estimate.result)表示画面／調査項目の📷ボタン

## ルール

- 契約の決定事項（§9）と矛盾する変更はしない。矛盾を見つけたら報告
- `values` 内のフィールドID（snake_case）は変えない（Firestore保存データが壊れる）
- TODO完了時は BUNDLE_CONTRACT.md の該当項目にチェック

## ⚠️ 開発中の運用ルール（厳守）

- **git push / firebase deploy 禁止**：本アプリは現行業務で使用中。連携作業の全工程が
  終わりユーザーが明言するまで push・デプロイしない（ローカル commit は可）。
- **ローカルテスト時はドメイン認証を一時無効化してよい**：`src/hooks/useAuth.ts` を
  フラグ切り替え（例 `DEV_SKIP_AUTH`）で。コード削除はしない。
- **push/デプロイ前に必ず認証を元に戻す**（最優先チェック項目）。`firestore.rules` の
  緩和も同様に戻すこと。
