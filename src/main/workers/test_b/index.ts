import { WorkerWrapper } from '@/main/core/worker/index'
import { startWorker } from '@/main/core/worker/worker_mgr'

export class TestBWroker extends WorkerWrapper {
    constructor(){
        super() 
    }
    sayHi(name:string){
        console.log('hello, i am ',process.name)
        return `hello, i'm kuku`
    }
}

startWorker(TestBWroker)
