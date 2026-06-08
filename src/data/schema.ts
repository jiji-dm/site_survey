// ============================================================
// 現調チェックリストのスキーマ定義（PDFを元に作成）
// ------------------------------------------------------------
// このファイルを編集すれば項目の追加・削除・順序変更ができる
//
// showFor: 該当の工事種別だけで表示。省略時は全種別。
//   - install   : 設置
//   - removal   : 撤去
//   - replace   : 交換
//   - relocate  : 移設
//   - temporary : 仮設
// ============================================================
import type { Section, WorkType } from '../types/checklist'

/** 撤去系（撤去・移設）でのみ表示 */
const REMOVAL_ONLY: WorkType[] = ['removal', 'relocate']
/** 撤去系以外（設置・交換・仮設）で表示 */
const NON_REMOVAL: WorkType[] = ['install', 'replace', 'temporary']

export const SECTIONS: Section[] = [
  // ------------------------------------------------------------
  // 設置・機器
  // ------------------------------------------------------------
  {
    id: 'installation',
    title: '設置・機器',
    accent: '#7044a4',
    perArea: true,
    groups: [
      {
        id: 'material',
        title: '壁・天井材質（磁石確認）',
        description: '材質と磁石の付着可否を確認',
        fields: [
          { id: 'wall_material', label: '壁', type: 'single', options: ['ボード', 'パネル', 'コンクリ', 'その他'] },
          { id: 'wall_magnet',   label: '壁 磁石', type: 'single', options: ['有', '無'] },
          { id: 'ceiling_material', label: '天井', type: 'single', options: ['ボード', 'ジプトーン', 'パネル', 'コンクリ', 'その他'] },
          { id: 'ceiling_magnet',   label: '天井 磁石', type: 'single', options: ['有', '無'] },
          { id: 'material_photo',   label: '全ての箇所の写真（材質わかるもの）を撮影', type: 'check' },

          // ▼ 撤去・移設時のみ表示
          { id: 'repair_needed', label: '修繕必要可否', type: 'single', options: ['要', '不要'], showFor: REMOVAL_ONLY },
          { id: 'repair_note',   label: '修繕メモ', type: 'memo', hint: '修繕箇所・内容など', showFor: REMOVAL_ONLY },
        ],
      },
      {
        id: 'arm',
        title: 'アーム種類',
        fields: [
          { id: 'arm_type', label: 'アーム種類', type: 'single', options: ['ビス留', '磁石', 'クランプ', 'プレート', 'その他'] },
        ],
      },
      {
        id: 'box',
        title: 'BOX設置箇所',
        fields: [
          { id: 'box_places', label: '設置箇所',   type: 'number', suffix: '箇所' },
          { id: 'box_count',  label: 'BOX台数',   type: 'number', suffix: '台' },
          // 撤去・移設では電源可否は不要
          { id: 'box_power',  label: '各BOX電源可否', type: 'single', options: ['有', '無', '不明'], showFor: NON_REMOVAL },
          { id: 'box_photo',  label: '写真撮影（before / after 意識）', type: 'check' },
        ],
      },
      {
        id: 'camera',
        title: '設置機器',
        description: '機器の種類を選択。サイネージ・LiderはBOX台数と同数になります',
        fields: [
          { id: 'equipment_type', label: '機器の種類', type: 'single', options: ['カメラ', 'サイネージ', 'Lider'] },

          // ▼ カメラ選択時：IPカメラ＋ステレオカメラ（台数は合計、上限はBOX台数×3）
          { id: 'ip_camera_count',     label: 'IPカメラ',     type: 'number', suffix: '台', showWhen: { field: 'equipment_type', equals: 'カメラ' } },
          { id: 'stereo_camera_count', label: 'ステレオカメラ', type: 'number', suffix: '台', showWhen: { field: 'equipment_type', equals: 'カメラ' } },
          {
            id: 'camera_count', label: 'カメラ台数', type: 'computed', suffix: '台',
            hint: 'IPカメラ＋ステレオカメラ',
            compute: { op: 'sum', from: ['ip_camera_count', 'stereo_camera_count'], maxFrom: 'box_count', maxFactor: 3 },
            showWhen: { field: 'equipment_type', equals: 'カメラ' },
          },
          { id: 'camera_height', label: 'カメラ高さ', type: 'height', suffix: 'mm', hint: '単一値 or 範囲で指定', showWhen: { field: 'equipment_type', equals: 'カメラ' } },
          { id: 'camera_photo',  label: '写真撮影（before / after 意識）', type: 'check', showWhen: { field: 'equipment_type', equals: 'カメラ' } },
          { id: 'camera_height_note', label: 'カメラ高さ寸法メモ', type: 'text', hint: '補足: 高さ寸法の確認結果', noCount: true, showWhen: { field: 'equipment_type', equals: 'カメラ' } },

          // ▼ サイネージ選択時：数量＝BOX台数
          {
            id: 'signage_count', label: 'サイネージ数量', type: 'computed', suffix: '台',
            hint: 'BOX台数と同数',
            compute: { op: 'mirror', from: ['box_count'] },
            showWhen: { field: 'equipment_type', equals: 'サイネージ' },
          },

          // ▼ Lider選択時：数量＝BOX台数
          {
            id: 'lider_count', label: 'Lider数量', type: 'computed', suffix: '台',
            hint: 'BOX台数と同数',
            compute: { op: 'mirror', from: ['box_count'] },
            showWhen: { field: 'equipment_type', equals: 'Lider' },
          },
        ],
      },
      {
        id: 'lan_cable',
        title: 'LANケーブル長さメモ',
        description: 'LANごとに距離を記録（チェックカウント対象外）',
        fields: [
          { id: 'lan_cable_lengths', label: 'LANケーブル', type: 'distance_groups', suffix: 'm', distance: { prefix: 'LAN' }, noCount: true },
        ],
      },
    ],
  },

  // ------------------------------------------------------------
  // 電源・ネットワーク
  // ------------------------------------------------------------
  {
    id: 'power_network',
    title: '電源・ネットワーク',
    accent: '#5d3290',
    perArea: true,
    groups: [
      {
        id: 'power',
        title: '電源',
        fields: [
          { id: 'outlet_type',  label: 'コンセント種類', type: 'single', options: ['2P', '3P'] },
          { id: 'outlet_note',  label: 'コンセント位置メモ', type: 'text', noCount: true },
          { id: 'outlet_avail', label: '既存コンセント空き状況', type: 'single', options: ['有', '無'] },
          { id: 'power_24h',      label: '24時間通電', type: 'single', options: ['有', '無'] },
          {
            id: 'power_24h_note',
            label: '通電条件・補足',
            type: 'memo',
            hint: '通電する時間帯・条件・ブレーカー位置など',
            showWhen: { field: 'power_24h', equals: '無' },
          },
        ],
      },
      {
        id: 'power_cable',
        title: '電源距離メモ',
        description: '電源ごとに距離を記録（チェックカウント対象外）',
        fields: [
          { id: 'power_cable_lengths', label: '電源', type: 'distance_groups', suffix: 'm', distance: { prefix: '電源' }, noCount: true },
        ],
      },
      // ▼ ネットワーク項目グループは撤去・移設では不要
      {
        id: 'network',
        title: 'ネットワーク',
        showFor: NON_REMOVAL,
        fields: [
          { id: 'use_existing_network', label: '既設のネットワークを使用', type: 'single', options: ['可', '不可', '未定'] },
          // ▼ 「可」「未定」のときのみ表示（不可なら詳細は不要）
          { id: 'wifi_status', label: 'ネットワーク状態（Wi-Fi）', type: 'text', hint: '受信状況・SSID等', showWhen: { field: 'use_existing_network', equals: ['可', '未定'] } },
          { id: 'lan_port',    label: 'ネットワーク口の有無・位置', type: 'text', showWhen: { field: 'use_existing_network', equals: ['可', '未定'] } },
        ],
      },
      // ▼ VLAFS計測（計測時間の記録）— BOX台数ぶん計測、撤去・移設では不要
      {
        id: 'vla_fs',
        title: 'VLAFS計測',
        description: 'BOX台数ぶん計測。各BOXの開始・終了で所要時間を記録します',
        showFor: NON_REMOVAL,
        fields: [
          { id: 'vla_fs_time', label: '計測時間', type: 'stopwatch', countFrom: 'box_count' },
        ],
      },
      // ▼ ネット回線測定（現地）— キャリア別 ○△✕、BOX数ぶん行が増える、撤去・移設では不要
      {
        id: 'net_onsite',
        title: 'ネット回線測定（現地）',
        description: 'BOX台数ぶん測定。各キャリアを ○（良好）／△（やや弱い）／✕（不可）で判定',
        showFor: NON_REMOVAL,
        fields: [
          { id: 'net_onsite_result', label: 'キャリア別 受信判定', type: 'carrier_matrix', countFrom: 'box_count' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------
  // 施工条件（仮設時はフェーズ分け）
  // ------------------------------------------------------------
  {
    id: 'condition',
    title: '施工条件',
    accent: '#9069bd',
    dualPhase: true,
    groups: [
      {
        id: 'access',
        title: '高所作業',
        fields: [
          { id: 'work_height', label: '高さ', type: 'number', suffix: 'm' },
          { id: 'ladder_type', label: '脚立・高所車', type: 'single', options: ['脚立', 'はしご', '高所車'] },
          { id: 'ladder_onsite', label: '現場にあるか', type: 'single', options: ['有', '無'] },
        ],
      },
      {
        id: 'protection',
        title: '養生・搬入',
        fields: [
          { id: 'protection_need', label: '養生必要有無', type: 'single', options: ['有', '無'] },
          { id: 'protection_route', label: '搬入経路 / ドア / ELV / 作業場所 メモ', type: 'memo' },
          { id: 'route_checked', label: '搬入経路の確認', type: 'check' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------
  // 現場・運営（仮設時はフェーズ分け）
  // ------------------------------------------------------------
  {
    id: 'site',
    title: '現場・運営',
    accent: '#7044a4',
    dualPhase: true,
    groups: [
      {
        id: 'parking',
        title: '駐車・鍵',
        fields: [
          { id: 'parking',  label: '当日の駐車', type: 'single', options: ['可', '搬入時のみ可', '否'] },
          { id: 'key_eps',  label: '鍵関係（EPS等）', type: 'single', options: ['借', '立ち会い', '必要なし', '条件あり'] },
        ],
      },
      {
        id: 'time',
        title: '工事時間・立ち会い',
        fields: [
          { id: 'work_time',   label: '工事可能時間', type: 'single', options: ['日中', '夜間', '時間指定有'] },
          { id: 'work_time_note', label: '時間メモ', type: 'text', hint: '時間指定がある場合の詳細', noCount: true },
          { id: 'attend_during', label: '作業中の立ち合い', type: 'single', options: ['必要', '不要'] },
          // ▼ 「必要」のとき立ち合い者詳細
          { id: 'attend_during_detail', label: '立ち合い者詳細', type: 'memo', hint: '氏名・所属・連絡先など', showWhen: { field: 'attend_during', equals: '必要' } },

          { id: 'attend_startend', label: '作業開始/終了時の対応', type: 'single', options: ['必要', '不要'] },
          // ▼ 「必要」のとき担当者名・電話番号
          { id: 'attend_startend_person', label: '担当者名', type: 'text', showWhen: { field: 'attend_startend', equals: '必要' } },
          { id: 'attend_startend_phone',  label: '電話番号', type: 'text', hint: '連絡先電話番号', showWhen: { field: 'attend_startend', equals: '必要' } },

          { id: 'work_notice', label: '作業届の有無', type: 'single', options: ['有', '無'] },
          // ▼ 「有」のときメモ＋提出済みチェック
          { id: 'work_notice_memo', label: '作業届メモ', type: 'memo', hint: '提出先・期限・内容など', showWhen: { field: 'work_notice', equals: '有' } },
          { id: 'work_notice_submitted', label: '提出済み', type: 'single', options: ['有', '無'], showWhen: { field: 'work_notice', equals: '有' } },
        ],
      },
    ],
  },

  // ------------------------------------------------------------
  // 図面・既設確認
  // ------------------------------------------------------------
  {
    id: 'drawing',
    title: '図面・既設確認',
    accent: '#3f1b5c',
    groups: [
      {
        id: 'drawing',
        title: '図面・既設',
        fields: [
          { id: 'drawing_avail',  label: '図面の入手可否', type: 'single', options: ['可', '否'] },
          // 既設配管の流用は撤去・移設では不要
          { id: 'pipe_reuse',     label: '既設配管の流用', type: 'single', options: ['可', '否'], showFor: NON_REMOVAL },
          { id: 'drawing_note',   label: 'メモ', type: 'memo' },
        ],
      },
      {
        id: 'drawing_measure',
        title: '距離測定メモ',
        description: '名称を自由に決めて距離を記録（チェックカウント対象外）',
        fields: [
          { id: 'drawing_measure_lengths', label: '距離測定', type: 'distance_groups', suffix: 'm', distance: { freeLabel: true, prefix: '測定' }, noCount: true },
        ],
      },
    ],
  },
]

// ============================================================
// エリア別セクションのヘルパー
// ============================================================
import type { Field, FieldGroup, Values, Project, SurveyArea } from '../types/checklist'

/** perArea = true のセクションID集合 */
export const PER_AREA_SECTION_IDS = new Set(
  SECTIONS.filter(s => s.perArea).map(s => s.id),
)

/** エリア別セクションに属する全フィールドIDの集合（マイグレーション用） */
export const PER_AREA_FIELD_IDS: Set<string> = new Set(
  SECTIONS.filter(s => s.perArea).flatMap(s =>
    s.groups.flatMap(g => g.fields.map(f => f.id)),
  ),
)

let areaSeq = 0
/** エリアIDを生成（時刻に依存しない安定生成） */
function makeAreaId(): string {
  areaSeq += 1
  return `area-${areaSeq}-${areaSeq.toString(36)}${(areaSeq * 7).toString(36)}`
}

/** 新しい空エリアを作る */
export function makeArea(name: string, values: Values = {}): SurveyArea {
  return { id: makeAreaId(), name, values }
}

/**
 * 旧データ（areas を持たない or 空）を正規化する。
 * - areas が無ければ "エリア1" を1件作成
 * - その際、フラットな values に紛れている perArea フィールドの値を最初のエリアへ移す
 * 既に areas を持つ場合はそのまま返す（コピーは最小限）。
 */
export function normalizeProject(p: Project): Project {
  if (Array.isArray(p.areas) && p.areas.length > 0) return p

  const moved: Values = {}
  const rest: Values = {}
  for (const [k, v] of Object.entries(p.values ?? {})) {
    if (PER_AREA_FIELD_IDS.has(k)) moved[k] = v
    else rest[k] = v
  }
  return {
    ...p,
    values: rest,
    areas: [makeArea('エリア1', moved)],
  }
}

// ============================================================
// 工事種別を考慮したヘルパー
// ============================================================

/** showWhen 条件を満たすか（values 未指定なら条件付きフィールドは隠す） */
function matchesShowWhen(field: Field, values?: Values): boolean {
  if (!field.showWhen) return true
  if (!values) return false
  const cur = values[field.showWhen.field]
  const want = field.showWhen.equals
  const wants = Array.isArray(want) ? want : [want]
  // 参照先が multi（配列）の場合は、want のいずれかが選択されていれば表示
  if (Array.isArray(cur)) return wants.some(w => (cur as string[]).includes(w))
  return wants.includes(cur as string)
}

/** computed 型の算出結果 */
export interface ComputedValue {
  /** 算出値 */
  value: number
  /** 上限（maxFrom×maxFactor）。基準が未入力(0)なら null */
  max: number | null
  /** 上限超過しているか */
  exceeded: boolean
}

/** computed フィールドの値・上限・超過判定を算出する */
export function evalCompute(field: Field, values?: Values): ComputedValue | null {
  const c = field.compute
  if (!c) return null
  const v = values ?? {}
  const nums = c.from.map(id => Number(v[id]) || 0)
  const value = c.op === 'mirror' ? (nums[0] ?? 0) : nums.reduce((a, b) => a + b, 0)
  let max: number | null = null
  if (c.maxFrom && c.maxFactor) {
    const base = Number(v[c.maxFrom]) || 0
    max = base > 0 ? base * c.maxFactor : null
  }
  return { value, max, exceeded: max != null && value > max }
}

/** ある工事種別で表示すべき field か */
export function isFieldVisible(field: Field, workType: WorkType, values?: Values): boolean {
  if (field.showFor && !field.showFor.includes(workType)) return false
  return matchesShowWhen(field, values)
}

/** ある工事種別で表示すべき group か（中に1つでも表示fieldがあるか） */
export function isGroupVisible(group: FieldGroup, workType: WorkType, values?: Values): boolean {
  if (group.showFor && !group.showFor.includes(workType)) return false
  return group.fields.some(f => isFieldVisible(f, workType, values))
}

/** 指定の工事種別で実際に表示される field のリスト */
export function visibleFields(group: FieldGroup, workType: WorkType, values?: Values): Field[] {
  if (group.showFor && !group.showFor.includes(workType)) return []
  return group.fields.filter(f => isFieldVisible(f, workType, values))
}

/** 指定の工事種別で実際に表示される group のリスト */
export function visibleGroups(section: Section, workType: WorkType, values?: Values): FieldGroup[] {
  return section.groups.filter(g => isGroupVisible(g, workType, values))
}
