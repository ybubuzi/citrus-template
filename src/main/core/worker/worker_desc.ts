import 'reflect-metadata'
export const WORKER_MESSAGE_MAPPER = {
  NOT_IN_WORKER_MSG: 'This class can only be instantiated in a worker thread.'
}
export const hasTransmitRaw: string[] = []
enum DecoratorEnum {
  MATE_INFO = 'MATE_INFO'
}
/**
 * 线程信息标记
 * @param aliasName 线程别名
 * @param desc 线程描述
 */
export function WorkerInfo(aliasName: string, desc: string) {}

interface DefineMate {
  /** 以传输对象原本的形式传递 */
  hasTransmit: boolean
  /**  */
  notReturn: boolean
}
export function Mate(info?: Partial<DefineMate>) {
  info = Object.assign(
    {
      hasTransmit: false,
      notReturn: false
    },
    info
  )
  return Reflect.metadata(DecoratorEnum.MATE_INFO, info)
}

export function getFunctionMate(thisArg: any, fnName: string):DefineMate {
  const info = Reflect.getMetadata(DecoratorEnum.MATE_INFO, thisArg, fnName)
  return Object.assign(
    {
      hasTransmit: false,
      notReturn: false
    },
    info
  )
}
