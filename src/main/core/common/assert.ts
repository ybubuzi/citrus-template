import { CitrusError } from '@/shared/core/common/error'
type JavaScriptTypeofResult =
  | 'undefined'
  | 'string'
  | 'number'
  | 'boolean'
  | 'bigint'
  | 'symbol'
  | 'function'
  | 'object'

export function equalType<T>(
  value: unknown,
  expected: JavaScriptTypeofResult,
  msg?: string
): asserts value is T {
  if (typeof value !== expected) {
    const message = msg ?? `Bad Type`
    throw new CitrusError(message)
  }
}
 