import { WorkerWrapper } from '@/main/core/worker/index'
import { startWorker, getWorkerProxy } from '@/main/core/worker/worker_mgr'
import type { TestBWroker } from '../test_b'
export class TestAWroker extends WorkerWrapper {
  constructor() {
    super()

    setInterval(async () => {
      const proxy = await getWorkerProxy<TestBWroker>('worker-2')
      const msg = await proxy.sayHi('bubuzi')
      console.log(process.name,'\tcall sayHi success: ',msg)
    }, 1000)
  }
}

startWorker(TestAWroker)
