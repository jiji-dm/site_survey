// ============================================================
// チェックリストのスキーマ型
// ------------------------------------------------------------
// PDF の項目はすべてこのスキーマに従ってデータ駆動で表示する
// ============================================================

/** 工事種別 */
export type WorkType =
  | 'install'    // 設置
  | 'removal'    // 撤去
  | 'replace'    // 交換
  | 'relocate'   // 移設
  | 'temporary'  // 仮設

/** 全工事種別 */
export const ALL_WORK_TYPES: WorkType[] = ['install', 'removal', 'replace', 'relocate', 'temporary']

/** フィールドの種別 */
export type FieldType =
  | 'single'   // 単一選択（チップ）
  | 'multi'    // 複数選択（チップ）
  | 'number'   // 数値入力（箇所数、台数、高さ など）
  | 'text'     // 短いテキスト（メモ）
  | 'memo'     // 長いテキスト（複数行）
  | 'check'    // 単一チェック（「写真とったか」など）

/** 1つのチェック項目 */
export interface Field {
  /** Firestore に保存するためのキー（変更不可、英数字） */
  id: string
  /** 画面に表示するラベル */
  label: string
  /** 種別 */
  type: FieldType
  /** 選択肢（single / multi の場合） */
  options?: string[]
  /** 単位や補足（例: "m", "台", "箇所"） */
  suffix?: string
  /** 補助テキスト（小さく表示） */
  hint?: string
  /** 必須か */
  required?: boolean
  /** どの工事種別で表示するか（省略時は全種別） */
  showFor?: WorkType[]
}

/** 同じカードにまとめて表示する項目群 */
export interface FieldGroup {
  id: string
  title?: string
  /** カードに添える短い説明 */
  description?: string
  fields: Field[]
  /** グループ自体の表示制限（中の field を全部出すなら省略可） */
  showFor?: WorkType[]
}

/** カテゴリ（タブ単位） */
export interface Section {
  id: string
  title: string
  /** タブに表示する色のアクセント */
  accent?: string
  groups: FieldGroup[]
  /** 仮設時に「設置/撤去」2フェーズで入力するか */
  dualPhase?: boolean
}

/** 入力値（フィールドIDをキーにした任意の値） */
export type FieldValue =
  | string
  | string[]
  | number
  | boolean
  | null
  | undefined

export type Values = Record<string, FieldValue>

/** 現場プロジェクト1件 */
export interface Project {
  /** 文書ID */
  id: string
  /** 工事種別 */
  workType: WorkType
  /** 現場名 */
  siteName: string
  /** 調査日（YYYY-MM-DD） */
  date: string
  /** 担当者 */
  inCharge: string
  /** 確認者 */
  confirmer: string
  /** 入力値（通常項目 + dualPhase でないセクション） */
  values: Values

  /** 仮設時のみ使用: フェーズ別の入力値 */
  phaseValues?: {
    setup: Values
    removal: Values
  }
  /** 仮設時のみ: dualPhase セクションが「設置/撤去で同一条件」か（セクションID → boolean） */
  phaseSameAs?: Record<string, boolean>

  // -- メタ --
  /** 作成者のメールアドレス */
  ownerEmail: string
  /** 共有メンバー */
  sharedWith: Array<{ email: string; role: 'viewer' | 'editor' }>
  /** 最終更新 */
  updatedAt: number
  /** 最終更新者のメール */
  updatedBy?: string
  /** 作成日時 */
  createdAt: number
}
