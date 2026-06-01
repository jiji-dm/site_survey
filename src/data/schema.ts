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
    groups: [
      {
        id: 'place',
        title: '設置場所',
        fields: [
          { id: 'place_count', label: '箇所数', type: 'number', suffix: '箇所' },
        ],
      },
      {
        id: 'material',
        title: '壁・天井材質（磁石確認）',
        description: '材質と磁石の付着可否を確認',
        fields: [
          { id: 'wall_material', label: '壁', type: 'single', options: ['ボード', 'パネル', 'その他'] },
          { id: 'wall_magnet',   label: '壁 磁石', type: 'single', options: ['有', '無'] },
          { id: 'ceiling_material', label: '天井', type: 'single', options: ['ボード', 'ジプトーン', 'パネル', 'その他'] },
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
        title: 'カメラ設置箇所',
        fields: [
          { id: 'camera_count',  label: 'カメラ台数', type: 'number', suffix: '台' },
          { id: 'camera_photo',  label: '写真撮影（before / after 意識）', type: 'check' },
          { id: 'camera_height_note', label: 'カメラ高さ寸法メモ', type: 'text', hint: '補足: 高さ寸法の確認結果' },
        ],
      },
      {
        id: 'wiring',
        title: '配管・配線',
        fields: [
          // 配線ルートの確認は撤去・移設では不要
          { id: 'wiring_route_optimal', label: '配線ルートで一番簡単な方法を突き詰めた', type: 'check', showFor: NON_REMOVAL },
          { id: 'wiring_note', label: '配線メモ', type: 'memo' },
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
    groups: [
      {
        id: 'power',
        title: '電源',
        fields: [
          { id: 'outlet_type',  label: 'コンセント種類', type: 'single', options: ['2P', '3P'] },
          { id: 'outlet_note',  label: 'コンセント位置メモ', type: 'text' },
          { id: 'outlet_avail', label: '既存コンセント空き状況', type: 'text' },
        ],
      },
      // ▼ ネットワーク項目グループは撤去・移設では不要
      {
        id: 'network',
        title: 'ネットワーク',
        showFor: NON_REMOVAL,
        fields: [
          { id: 'wifi_status', label: 'ネットワーク状態（Wi-Fi）', type: 'text', hint: '受信状況・SSID等' },
          { id: 'lan_port',    label: 'ネットワーク口の有無・位置', type: 'text' },
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
      // ▼ 裏側・障害物グループは撤去・移設では不要
      {
        id: 'inner',
        title: '裏側・障害物',
        showFor: NON_REMOVAL,
        fields: [
          { id: 'inside_ceiling', label: '天井裏・壁裏（配線）', type: 'single', options: ['確認済み', '不明', '可', '否'] },
          { id: 'obstacle',       label: '障害物',               type: 'single', options: ['確認済み', '不明', '可', '否'] },
        ],
      },
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
          { id: 'work_time_note', label: '時間メモ', type: 'text', hint: '時間指定がある場合の詳細' },
          { id: 'attend_during', label: '作業中の立ち合い', type: 'single', options: ['必要', '不要'] },
          { id: 'attend_startend', label: '作業開始/終了時の対応', type: 'single', options: ['必要', '不要'] },
          { id: 'work_notice', label: '作業届の有無', type: 'single', options: ['有', '無'] },
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
    ],
  },
]

// ============================================================
// 工事種別を考慮したヘルパー
// ============================================================
import type { Field, FieldGroup } from '../types/checklist'

/** ある工事種別で表示すべき field か */
export function isFieldVisible(field: Field, workType: WorkType): boolean {
  return !field.showFor || field.showFor.includes(workType)
}

/** ある工事種別で表示すべき group か（中に1つでも表示fieldがあるか） */
export function isGroupVisible(group: FieldGroup, workType: WorkType): boolean {
  if (group.showFor && !group.showFor.includes(workType)) return false
  return group.fields.some(f => isFieldVisible(f, workType))
}

/** 指定の工事種別で実際に表示される field のリスト */
export function visibleFields(group: FieldGroup, workType: WorkType): Field[] {
  if (group.showFor && !group.showFor.includes(workType)) return []
  return group.fields.filter(f => isFieldVisible(f, workType))
}

/** 指定の工事種別で実際に表示される group のリスト */
export function visibleGroups(section: Section, workType: WorkType): FieldGroup[] {
  return section.groups.filter(g => isGroupVisible(g, workType))
}
