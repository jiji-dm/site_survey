import { useEffect, useState } from 'react'
import { X, Plus, Trash2, MapPin, ChevronLeft } from 'lucide-react'
import { makeArea } from '../data/schema'
import type { SurveyArea } from '../types/checklist'

interface Props {
  open: boolean
  /** 「戻る」で工事種別選択へ戻すコールバック（任意） */
  onBack?: () => void
  onClose: () => void
  /** 確定: 作成したエリア配列を返す */
  onConfirm: (areas: SurveyArea[]) => void
}

/**
 * 新規作成時の「エリア作成」ステップ。
 * 設置・機器／電源・ネットワークはエリアごとに別データを持つため、
 * 現場を最初にエリア（フロア・区画・設置単位など）へ分けてもらう。
 */
export default function AreaSetupDialog({ open, onBack, onClose, onConfirm }: Props) {
  const [areas, setAreas] = useState<SurveyArea[]>([])

  // 開くたびに初期化（最低1エリア）
  useEffect(() => {
    if (open) setAreas([makeArea('エリア1')])
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const add = () => setAreas(prev => [...prev, makeArea(`エリア${prev.length + 1}`)])
  const rename = (id: string, name: string) =>
    setAreas(prev => prev.map(a => (a.id === id ? { ...a, name } : a)))
  const remove = (id: string) =>
    setAreas(prev => (prev.length > 1 ? prev.filter(a => a.id !== id) : prev))

  const confirm = () => {
    // 空名は連番で補完
    const cleaned = areas.map((a, i) => ({
      ...a,
      name: a.name.trim() || `エリア${i + 1}`,
    }))
    onConfirm(cleaned)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg card p-5 sm:p-6 shadow-pop">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 -ml-1 text-ink-subtle hover:text-ink rounded-lg"
                aria-label="戻る"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-ink">エリアを作成</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-ink-subtle hover:text-ink rounded-lg"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-ink-muted mb-5">
          <span className="font-medium text-ink">設置・機器</span>／
          <span className="font-medium text-ink">電源・ネットワーク</span>
          はエリアごとに別々に記録します。フロア・区画・設置単位などで分けてください。
          <br />
          （施工条件・現場運営・図面確認は現場全体で共通です）
        </p>

        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {areas.map((a, i) => (
            <div key={a.id} className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-50 text-brand-700 shrink-0">
                <MapPin size={15} />
              </span>
              <input
                value={a.name}
                onChange={e => rename(a.id, e.target.value)}
                placeholder={`エリア${i + 1}`}
                className="input flex-1"
                autoFocus={i === areas.length - 1}
              />
              <button
                onClick={() => remove(a.id)}
                disabled={areas.length <= 1}
                className="p-2 text-ink-subtle hover:text-red-600 rounded-lg disabled:opacity-30"
                aria-label="エリアを削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={add}
          className="btn-outline w-full mt-3"
        >
          <Plus size={15} /> エリアを追加
        </button>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            キャンセル
          </button>
          <button onClick={confirm} className="btn-primary flex-1">
            この {areas.length} エリアで開始
          </button>
        </div>
      </div>
    </div>
  )
}
