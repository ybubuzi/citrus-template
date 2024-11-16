import assert from 'assert'
import { Worker, MessagePort, MessageChannel, TransferListItem, isMainThread } from 'worker_threads'
import { WorkerEmitter, WorkerTransmit } from '@/main/core/worker/worker_ds'
import { CitrusError } from '@/shared/core/common/error'
import { PromisePair } from '@/shared/utils/promise'

import { WORKER_MESSAGE_MAPPER, getFunctionMate } from './worker_desc'
import { equalType } from '../common/assert'

export const MAIN_THREAD_IDENTIFY = 'MAIN'
type WorkerIdentify = string

/* 动作链接符，如: MATN:DATABASE:SAVE */
const ACTION_EVENT_SEPARATOR = ':' as const

const WorkerPortMapper = new Map<string, MessagePort>()
const WorkerReqquestMaoper = new Map<string, PromisePair<any>>()

/**
 * 注册来自其他线程的信道请求
 * @param identify 注册来源进程标识符
 * @param port link的信道
 * @param emitter 信道事件触发器
 */
export function registerPort(identify: WorkerIdentify, port: MessagePort, emitter?: WorkerEmitter) {
  WorkerPortMapper.set(identify, port)
  if (emitter) {
    port.on('message', (transimit: WorkerTransmit) => {
      emitter.emit('TRIGGER', transimit)
    })
  }
}

/**
 * 获取指定进程的信道信息
 * @param identify
 * @returns
 */
export function getPort(identify: WorkerIdentify) {
  const port = WorkerPortMapper.get(identify)
  return port
}
/**
 * 统一信道数据发送接口
 * @param port
 * @param transmit
 * @param transferList
 */
export async function portSend<T>(
  port: MessagePort,
  transmit: WorkerTransmit<T>,
  transferList?: readonly TransferListItem[]
)
export async function portSend<T>(
  transmit: WorkerTransmit<T>,
  transferList?: readonly TransferListItem[]
)
export async function portSend<T>(...args: any[]) {
  const fristIsPort = args[0] instanceof MessagePort
  const transmit: WorkerTransmit<T> = fristIsPort ? args[1] : args[0]
  const transferList = fristIsPort ? args[2] : args[1]
  const port = fristIsPort ? args[0] : getPort(transmit.dstIdentify)

  // 避免自己向自己发送数据
  if (transmit.dstIdentify === process.name) {
    throw new CitrusError(`Cannot send message to self`)
  }
  // 通过传输对象获取建立link的信道
  if (!port) {
    throw new CitrusError(`Port ${transmit.dstIdentify} not found`)
  }
  let promise: Promise<any> = Promise.resolve()
  port.postMessage(transmit, transferList)
  if (!transmit.completeTime) {
    const id = transmit.id
    promise = Promise.race([
      new Promise((resolve, reject) => {
        // todo: 数据压缩？序列化？
        const pro = { resolve, reject, lock: true }
        WorkerReqquestMaoper.set(id, pro)
      }),
      new Promise((resolve, _reject) => {
        setTimeout(() => {
          WorkerReqquestMaoper.delete(id)
          resolve('timeout')
        }, 2000)
      })
    ])
  }
  return promise
}

/**
 * 创建指定线程之间的通讯信道
 * @param identify 指定的线程
 * @returns
 */
async function createPortLink(identify: WorkerIdentify) {
  const mainPort = WorkerPortMapper.get(MAIN_THREAD_IDENTIFY)
  assert.ok(mainPort)
  const channel = new MessageChannel()
  const transmit = new WorkerTransmit(identify, 'register', channel.port2)
  registerPort(identify, channel.port1, process.instance)
  await portSend(mainPort, transmit, [channel.port2])
  return channel.port1
}

/**
 * 获取指定线程对应的调用代理对象
 * 提供如本地方法调用式的服务
 * @param identify
 */
export async function getWorkerProxy<T>(identify: WorkerIdentify): Promise<T> {
  const port = WorkerPortMapper.get(identify) ?? (await createPortLink(identify))
  if (!port) {
    throw new CitrusError(`Worker ${identify} not found`)
  }
  const proxy = new Proxy({} as any, {
    get: (cached: any, prop: PropertyKey, receiver) => {
      const exist = cached[prop]
      if (exist) {
        return exist
      }
      equalType<string>(prop, 'string')
      if (['then', 'catch', 'finally'].includes(prop)) {
        return receiver
      }
      return (...args: any[]) => {
        const transmit = new WorkerTransmit(identify, prop, args)
        return portSend(transmit)
      }
    }
  })
  return Promise.resolve(proxy)
}
export function startWorker<T extends new () => any>(Target: T) {
  assert.equal(isMainThread, false, WORKER_MESSAGE_MAPPER.NOT_IN_WORKER_MSG)
  const _instance = new Target()
  if (_instance) {
    console.log(`Thread ${Target.name} has started`)
  }
}

export function patchHandle(thisArg: any) {
  return async function (transmit: WorkerTransmit) {
    // 统一触发接口
    // 检查是否是本线程发出的请求响应
    const part = WorkerReqquestMaoper.get(transmit.id)
    const args = Array.isArray(transmit.payload) ? transmit.payload : [transmit.payload]
    if (part) {
      part.resolve(...args)
      WorkerReqquestMaoper.delete(transmit.id)
      return
    }
    // 已完成任务，避免递归调用
    if (transmit.completeTime) {
      return
    }
    const callback = Reflect.get(thisArg, transmit.action)
    if (!callback) {
      portSend(
        WorkerTransmit.toError(
          transmit,
          new CitrusError(`Action ${transmit.action} That Does Not Exist`)
        )
      )
    }
    if (typeof callback !== 'function') {
      portSend(
        WorkerTransmit.toError(
          transmit,
          new CitrusError(`Action ${transmit.action} Is Not An Executable Function`)
        )
      )
    }
    equalType<Function>(callback, 'function')
    const mate = getFunctionMate(thisArg, callback.name)

    const dto = mate.hasTransmit ? [transmit] : args
    const result = await Promise.resolve(callback.call(thisArg, ...dto))
    // 将调用结果返回至原线程
    portSend(WorkerTransmit.toComplate(transmit, result))
  }
}
