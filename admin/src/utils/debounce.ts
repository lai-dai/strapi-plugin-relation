/* eslint-disable custom-rules/encourage-object-params */

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T, ms: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | undefined

  return (...args: Parameters<T>) => {
    clearTimeout(timer)

    timer = setTimeout(
      () => {
        callback(...args)
      }, ms
    )
  }
}
