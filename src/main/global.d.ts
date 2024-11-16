export {}

declare global {
  namespace NodeJS {
    interface Process {
      name: string,
      instance: InstanceType<typeof import('@/main/core/worker/index').WorkerWrapper>
    }
  }
}
