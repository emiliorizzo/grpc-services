import { createPorts, createServices, servicesNames } from './servicesConfig'
import { Service } from './ServiceServer'
import { Router } from './Router'

const Logger = console.log

export const events = {
  'SERVICE_STARTED': 'serviceStarted',
  'QUEUE_DONE': 'queueDone'
}

const defServices = { router: true }

const address = '127.0.0.1'

export const ports = createPorts([3010].map(p => parseInt(p)))

export const enabledServices = getEnabledServices(defServices)

export const services = createServices(address, ports, enabledServices)

export const createServiceLogger = ({ name, uri }) => {
  if (!name || !uri) throw new Error('Missing log options')
  return Logger(`${name}|${uri}`)
}

export async function createService(serviceConfig, executor, { log } = {}) {
  try {
    const { uri, name, address, port } = serviceConfig
    log = log || createServiceLogger(serviceConfig)
    const service = Service(uri, { name }, executor)
    const startService = createStartService(service, { name, address, port }, { log })
    return { service, log, startService }
  } catch (err) {
    return Promise.reject(err)
  }
}

export function createStartService(service, { name, address, port }, { log }) {
  return async () => {
    try {
      let listenPort = await service.start()
      if (listenPort !== port) throw new Error('Binding port mismatch')
      if (log) log.info(`Service ${name} listening on ${address}:${port}`)
      return listenPort
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

export async function createRouter(routerServiceConfig, { services, log }) {
  try {
    services = services || {}
    log = log || createServiceLogger(routerServiceConfig)
    const router = Router({ log })
    const executor = ({ create }) => {
      create.Emitter()
      create.Listener(router.broadcast)
    }
    const { service, startService } = await createService(routerServiceConfig, executor, { log })
    for (let s in services) {
      let config = services[s]
      let { name } = config
      if (config.uri !== routerServiceConfig.uri) {
        router.addService(name, config)
      }
    }
    router.setRouterService(service)
    return Object.freeze({ router, startService, log })
  } catch (err) {
    return Promise.reject(err)
  }
}

export async function bootStrapService(serviceConfig) {
  try {
    const log = createServiceLogger(serviceConfig)
    const setupData = await setup({ log })
    return Object.assign(setupData, { log, events })
  } catch (err) {
    return Promise.reject(err)
  }
}

export function getEnabledServices(servicesConfig = {}) {
  let enabled = Object.assign({}, servicesNames)
  for (let service in servicesConfig) {
    if (servicesConfig[service] === false) delete enabled[service]
  }
  return enabled
}
