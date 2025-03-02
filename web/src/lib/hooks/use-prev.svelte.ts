export function usePrev<T>(value: T) {
  let curr = $state<T>(value)
  let prev = $state<T>()

  return {
    get curr() { return curr },
    set curr(newValue) {
      prev = curr
      curr = newValue
    },
    get prev() { return prev },
  }
}
