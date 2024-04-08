import net from 'net'

export const randomNumber = (max, min = 1) => {
  max = max || Number.MAX_SAFE_INTEGER
  return Math.floor(Math.random() * max) + min
}


export function Spy (obj, method) {
  let spy = {
    args: []
  }
  const org = obj[method]
  if (typeof org !== 'function') throw new Error(`The method ${method} is not a function`)
  obj[method] = function () {
    let args = [].slice.apply(arguments)
    spy.args.push(args)
    return org.call(obj, ...args)
  }
  const remove = () => {
    obj[method] = org
  }
  return Object.freeze({ spy, remove })
}

export function isPortInUse (port, host) {
  host = host || '127.0.0.1'
  if (isNaN(port)) throw new Error('Port must be a number')
  return new Promise((resolve, reject) => {
    const server = net.createServer()
      .once('error', err => (err.code === 'EADDRINUSE' ? resolve(true) : reject(err)))
      .once('listening', () => {
        server.once('close', () => resolve(false))
        server.close()
      })
      .listen(port, host)
  })
}

export function asyncWait (time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

export function isRejected (promise) {
  return promise.then(() => false).catch(err => Promise.resolve(() => { throw err }))
}

export function randomTimestamp ({ start, end, unix } = {}) {
  start = start || new Date(2018, 1, 2).getTime()
  end = end || new Date().getTime()
  let time = new Date(start + Math.random() * (end - start)).getTime()
  if (unix) time = Math.floor(time / 1000)
  return time
}
