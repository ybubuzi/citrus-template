import { parentPort, workerData, MessagePort, isMainThread } from 'worker_threads'
import {
  WorkerContext,
  WorkerTransmit,
  WorkerStandard,
  WorkerEmitter
} from '@/main/core/worker/worker_ds'
import { CitrusError } from '@/shared/core/common/error'
import EventEmitter from 'node:events'
import assert from 'node:assert'
import { MAIN_THREAD_IDENTIFY, registerPort, patchHandle } from '@/main/core/worker/worker_mgr'
import { WORKER_MESSAGE_MAPPER, Mate } from '@/main/core/worker/worker_desc'
import 'reflect-metadata'

/**
 * 线程业务抽象基类
 * 用于完成
 * - 线程注册
 * - 线程调度
 * - 跨线程管理
 */
export abstract class WorkerWrapper extends EventEmitter implements WorkerStandard, WorkerEmitter {
  protected context!: WorkerContext

  constructor() {
    assert.equal(isMainThread, false, WORKER_MESSAGE_MAPPER.NOT_IN_WORKER_MSG)
    super()
    this.context = workerData
    process.name = this.context.env.name
    process.instance = this
    if (parentPort) {
      registerPort(MAIN_THREAD_IDENTIFY, parentPort, this)
    }
    this.on('TRIGGER', patchHandle(this))
  }

  /**
   * 接收信道注册请求
   * 来自其他线程的信道建立连接
   * @param transmit
   */
  @Mate({ hasTransmit: true, notReturn: true })
  public register(transmit: WorkerTransmit<MessagePort>) {
    console.log(`Accept channel requests from ${transmit.srcIdentify}`)
    const port = transmit.payload
    if (!port) {
      const error = new CitrusError('Invalid message port')
      throw error
    } else {
      registerPort(transmit.srcIdentify, port, this)
    }
  }
}
