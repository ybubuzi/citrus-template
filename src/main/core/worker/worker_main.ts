import EventEmitter from 'node:events'
import { WorkerStandard, WorkerEmitter, WorkerTransmit } from '@/main/core/worker/worker_ds'
import { getPort, portSend, patchHandle } from './worker_mgr'
import { MessagePort } from 'worker_threads'
import { CitrusError } from '@/shared/core/common/error'
import { Mate } from '@/main/core/worker/worker_desc'
/**
 * 主进程中处理进程交互的事件触发器
 */
class MainWorkerActionEmitter extends EventEmitter implements WorkerStandard, WorkerEmitter {
  constructor() {
    super()
    this.addListener('TRIGGER', patchHandle(this))
  }

  /**
   * 处理线程间的注册
   */
  @Mate({ hasTransmit: true })
  public register(transmit: WorkerTransmit<MessagePort>): void {
    // 获取目标进程注册在主进程的信道
    const port = getPort(transmit.dstIdentify)
    if (!port) {
      throw new CitrusError('Invalid message port')
    }
    if (!transmit.payload) {
      throw new CitrusError('Invalid message port payload')
    }
    // 转发线程并等待执行完成
    return portSend(transmit, [transmit.payload])
  }
}

const INSTANCE = new MainWorkerActionEmitter()
export default INSTANCE
