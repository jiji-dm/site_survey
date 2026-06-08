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
  | 'number'   // 数値入力（箇所数、台数 など）
  | 'height'   // 高さ入力（単一値 or 範囲、プルダウン+±ボタン）
  | 'text'     // 短いテキスト（メモ）
  | 'memo'     // 長いテキスト（複数行）
  | 'check'    // 単一チェック（「写真とったか」など）
  | 'carrier_matrix' // キャリア別電波測定（BOX数ぶん行が増える ○△✕）
  | 'stopwatch' // 計測時間ストップウォッチ（始まり/終わり/計測時間/リセット）
  | 'distance_groups' // 距離測定メモ（グループ＝LAN①・電源①等、各グループ内に複数の距離を記録し合計）
  | 'computed' // 他フィールドから自動算出して表示（入力不可）。例: カメラ台数=IP+ステレオ、サイネージ数量=BOX台数

/** distance_groups 型の設定 */
export interface DistanceConfig {
  /** 自動採番ラベルの接頭辞（例: "LAN" → "LAN①, LAN②"、"電源" → "電源①"） */
  prefix?: string
  /** ラベルをフリーワードで自由入力にする（図面・既設確認）。省略時は prefix による自動採番 */
  freeLabel?: boolean
}

/** computed 型の算出設定 */
export interface ComputeConfig {
  /** 算出方法: sum = from の合計、mirror = from[0] の値そのまま */
  op: 'sum' | 'mirror'
  /** 参照するフィールドID */
  from: string[]
  /** 上限チェックの基準フィールドID（例: 'box_count'）。指定時 maxFactor と併用 */
  maxFrom?: string
  /** 上限 = maxFrom の値 × maxFactor（例: BOX台数 × 3）。超過すると警告表示 */
  maxFactor?: number
}

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
  /** height 型のプルダウン候補（省略時は既定の500単位候補） */
  presets?: number[]
  /** 補助テキスト（小さく表示） */
  hint?: string
  /** 必須か */
  required?: boolean
  /** どの工事種別で表示するか（省略時は全種別） */
  showFor?: WorkType[]
  /** 別フィールドの値に応じて表示する条件（一致したときのみ表示） */
  showWhen?: { field: string; equals: string | string[] }
  /** carrier_matrix: 行数（BOX数）を読み取るフィールドID */
  countFrom?: string
  /** distance_groups 型の設定（ラベルの採番方法など） */
  distance?: DistanceConfig
  /** computed 型の算出設定（合計／参照、上限チェック） */
  compute?: ComputeConfig
  /** 入力進捗のカウント対象から外す（付随メモなど）。memo型は既定で対象外 */
  noCount?: boolean
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
  /**
   * エリア別にデータを持つか（true の場合、入力値は project.areas[].values に保存される）。
   * 設置・機器／電源・ネットワークのように、現場内のエリアごとに別データが必要なカテゴリで使う。
   * 省略時は現場全体で共通（project.values に保存）。
   */
  perArea?: boolean
}

/**
 * 距離測定メモの1グループ（LAN①・電源①・フリーワード名など）。
 * segments には各区間の距離(m)を入れ、合計値が「グループ内距離の合計」になる。
 * 入力途中の空欄は null として保持する。
 */
export interface DistanceGroup {
  /** 安定キー */
  id: string
  /** 表示名（自動採番 or フリーワード） */
  label: string
  /** 各区間の距離（m）。空欄入力中は null */
  segments: Array<number | null>
}

/** distance_groups 型の格納値 */
export interface DistanceGroupsValue {
  groups: DistanceGroup[]
}

/** 入力値（フィールドIDをキーにした任意の値） */
export type FieldValue =
  | string
  | string[]
  | number
  | boolean
  | null
  | undefined
  /** carrier_matrix / stopwatch 等の構造化値（例: { "1:Docomo": "○" } / { startAt: 0 }） */
  | Record<string, string | number | boolean | null>
  /** distance_groups の構造化値 */
  | DistanceGroupsValue

export type Values = Record<string, FieldValue>

/**
 * エリア1件（現場内の区画／フロア／設置単位）。
 * perArea セクション（設置・機器／電源・ネットワーク）の入力値をエリアごとに保持する。
 */
export interface SurveyArea {
  /** エリアID（安定キー） */
  id: string
  /** 表示名（例: "エリア1", "1F 受付"） */
  name: string
  /** perArea セクションの入力値 */
  values: Values
}

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
  /** 入力値（現場全体で共通のセクション = perArea でないカテゴリ） */
  values: Values

  /**
   * エリア別の入力値（perArea セクション = 設置・機器／電源・ネットワーク）。
   * 最低1件（"エリア1"）を持つ。
   */
  areas: SurveyArea[]

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
