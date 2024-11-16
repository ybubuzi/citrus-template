/**
 * promise结果封装器
 * 用于异步返回
 */
export type PromisePair<T> = {
  resolve: (...response: any[]) => void
  reject: (error: Error) => void
  lock?: boolean
}


/**
 * 超时promise装饰器
 * @param target 业务代码
 * @param timeoutMsg 超时信息
 * @param timeout 超时时间
 * @returns
 */
export function TimeoutWrapperPromise<T>(
  target: (resolve, reject) => T,
  timeoutMsg = 'timeout',
  timeout: number = 2000
) {
  return Promise.race([
    new Promise<T>(target),
    new Promise((_r, reject) => {
      setTimeout(() => {
        reject(timeoutMsg)
      }, timeout)
    })
  ])
}
