import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import { CitrusError, ErrorLike } from '@/shared/core/common/error'
import { MessagePort } from 'worker_threads'

export interface WorkerContext<T = never> {
  env: {
    name: string
    /** 程序执行根目录 */
    root_dir: string
    /** 当前是否是开发环境 */
    is_dev: boolean
  }
  /** 额外数据 */
  data?: T
}

/**
 * 标准线程接口
 */
export interface WorkerStandard {
  register(transmit: WorkerTransmit<MessagePort>): void
}
/**
 * 标准线程触发器
 */
export interface WorkerEmitter {
  on(event: 'TRIGGER', callback: (transimit: WorkerTransmit) => void): void
  emit(event: 'TRIGGER', transimit: WorkerTransmit): void
}

/**
 * 线程间传输对象
 */
export class WorkerTransmit<T = never> {
  /** 请求id，唯一 */
  public readonly id: string
  /** 请求来源标识符 */
  public readonly srcIdentify: string
  /** 请求目标标识符 */
  public readonly dstIdentify: string
  /** 请求动作 */
  public readonly action: string = ''
  /** 数据负载 */
  public payload?: T
  /** 请求开始时间 */
  public readonly createTime: number 
  /** 请求完成时间 */
  public completeTime?: number
  /** 错误对象 */
  public lastError?: ErrorLike 
  
  constructor(dstIdentify: string, action: string = '', payload?: T) {
    this.id = nanoid()
    this.srcIdentify = process.name
    this.dstIdentify = dstIdentify
    this.createTime = dayjs().unix()
    this.action = action
    this.payload = payload
  }

  static toComplate<T = never, Req = never>(req: WorkerTransmit<Req>, data?: T): WorkerTransmit<T> {
    const respose = Object.assign({}, req, {
      payload: data,
      completeTime: dayjs().unix(),
      srcIdentify: req.dstIdentify,
      dstIdentify: req.srcIdentify
    })
    return respose
  }

  static toError<T = never, Req = never>(
    req: WorkerTransmit<Req>,
    error: CitrusError
  ): WorkerTransmit<T> {
    const respose = this.toComplate(req)
    respose.lastError = error
    return respose
  }
}
