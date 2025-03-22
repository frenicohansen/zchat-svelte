export type Getter<T> = () => T
export type MaybeGetter<T> = T | Getter<T>

export function toValue<T>(value: MaybeGetter<T>): T {
  return typeof value === 'function' ? (value as Getter<T>)() : value
}
