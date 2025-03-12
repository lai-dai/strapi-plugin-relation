import React from "react"

export function useCallbackRef<Args extends unknown[], Return>(callback?: ((...args: Args) => Return)) {
  const callbackRef = React.useRef<typeof callback>(callback)

  React.useInsertionEffect(() => {
    callbackRef.current = callback
  })

  // https://github.com/facebook/react/issues/19240
  return React.useMemo(
    () => (...args: Args) => callbackRef.current?.(...args),
    [],
  )
}
