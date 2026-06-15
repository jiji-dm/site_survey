import { useEffect, useRef } from 'react'

/**
 * ⚠️ 現在このフックはどこからも使用されていません（未使用）。
 *
 * もともと ProjectEdit のオートセーブ（編集の 500ms 後に自動保存）に使っていましたが、
 * 「手動保存（保存ボタン）＋未保存時の離脱確認」方式へ変更したため呼び出しを廃止しました。
 * 将来オートセーブや入力のデバウンス（検索など）を再導入する際に再利用できるよう、
 * フック自体は残しています。不要であれば削除して構いません。
 *
 * --- 機能の説明 ---
 * 値が変わったら delay ms 後にコールバックを呼ぶ。
 * value が連続して変化している間はタイマーがリセットされ、
 * 変化が止まって delay ms 経過したときに一度だけ fn が実行される。
 */
export function useDebouncedEffect(
  value: unknown,
  delay: number,
  fn: () => void,
) {
  const timerRef = useRef<number | undefined>(undefined)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => fnRef.current(), delay)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
    // valueを依存に
  }, [value, delay])
}
