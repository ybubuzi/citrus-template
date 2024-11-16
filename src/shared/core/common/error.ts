export interface ErrorLike {
  errno: number
  message: string
}

export class CitrusError extends Error {
  public readonly errno: number = -1
  constructor(errno: number)
  constructor(msg: string)
  constructor(errno: number, msg: string)
  constructor(...args: any[]) {
    super()
    if (args.length === 1) {
      if (typeof args[0] === 'number') {
        this.errno = args[0]
      } else {
        this.message = args[0]
      }
    } else if (args.length === 2) {
      this.errno = args[0]
      this.message = args[1]
    }
  }
  toSimple(): ErrorLike {
    return {
      errno: this.errno,
      message: this.message
    }
  }
}
