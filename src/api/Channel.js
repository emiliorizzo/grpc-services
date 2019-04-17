import { formatRes } from './apiLib'

export function Channel (name, io) {
  const events = {
    join: undefined,
    leave: undefined
  }

  const sendToChannel = (event, action, payload) => {
    if (!event) throw new Error(`invalid event ${event}`)
    if (!action) throw new Error(`invalid action ${action}`)
    if (typeof payload !== 'object') throw new Error(`invalid payload ${payload}`)
    if (Object.keys(payload) < 1) throw new Error(`payload is empty`)
    payload.action = action
    payload = formatRes(payload)
    io.to(name).emit(event, payload)
  }
  const emit = (action, result) => {
    return sendToChannel('data', action, { result })
  }

  const channelEvent = (event, socket) => {
    socket[event](name)
    const onEvent = events[event]
    if (typeof onEvent === 'function') {
      onEvent(socket)
    }
  }

  const join = socket => {
    return channelEvent('join', socket)
  }

  const leave = socket => {
    return channelEvent('leave', socket)
  }

  const on = (event, cb) => {
    if (!events.hasOwnProperty(event)) {
      throw new Error(`Unknown event ${event}`)
    }
    if (typeof cb !== 'function') {
      throw new Error(`Second argument must be a function`)
    }
    events[event] = cb
  }
  return Object.freeze({ name, join, leave, on, emit })
}

export default Channel
