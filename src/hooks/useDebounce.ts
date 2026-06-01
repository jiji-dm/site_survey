import { useEffect, useRef } from 'react'

/**
 * 値が変わったら delay ms 後にコールバックを呼ぶ。
 * オートセーブ用途。
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
