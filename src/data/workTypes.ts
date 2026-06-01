// ============================================================
// 工事種別の表示情報（色・アイコン・ラベル）
// ============================================================
import {
  Wrench,
  Trash2,
  RefreshCw,
  ArrowRightLeft,
  TimerReset,
  type LucideIcon,
} from 'lucide-react'
import type { WorkType } from '../types/checklist'

export interface WorkTypeMeta {
  id: WorkType
  label: string
  /** 短いラベル（バッジ用） */
  short: string
  /** 説明文 */
  description: string
  /** Tailwindで使うアクセント色 (背景/テキスト用) */
  accentBg: string
  accentText: string
  /** ボーダー */
  accentBorder: string
  /** アイコン */
  icon: LucideIcon
}

export const WORK_TYPES: WorkTypeMeta[] = [
  {
    id: 'install',
    label: '設置',
    short: '設置',
    description: '新規にカメラ・機器を取り付ける工事',
    accentBg:    'bg-emerald-50',
    accentText:  'text-emerald-700',
    accentBorder:'border-emerald-200',
    icon: Wrench,
  },
  {
    id: 'removal',
    label: '撤去',
    short: '撤去',
    description: '既設の機器を取り外す工事',
    accentBg:    'bg-rose-50',
    accentText:  'text-rose-700',
    accentBorder:'border-rose-200',
    icon: Trash2,
  },
  {
    id: 'replace',
    label: '交換',
    short: '交換',
    description: '既設機器を新しい機器へ取り替える工事',
    accentBg:    'bg-amber-50',
    accentText:  'text-amber-700',
    accentBorder:'border-amber-200',
    icon: RefreshCw,
  },
  {
    id: 'relocate',
    label: '移設',
    short: '移設',
    description: '既設機器を別の場所へ移す工事',
    accentBg:    'bg-sky-50',
    accentText:  'text-sky-700',
    accentBorder:'border-sky-200',
    icon: ArrowRightLeft,
  },
  {
    id: 'temporary',
    label: '仮設',
    short: '仮設',
    description: '一時的に設置し、後で撤去する工事（設置と撤去の両方を確認）',
    accentBg:    'bg-violet-50',
    accentText:  'text-violet-700',
    accentBorder:'border-violet-200',
    icon: TimerReset,
  },
]

export function getWorkTypeMeta(id: WorkType): WorkTypeMeta {
  return WORK_TYPES.find(w => w.id === id) ?? WORK_TYPES[0]
}
