import { LOG_APP_ID, VERSION } from '../resources/config'
import * as messaging from 'messaging'
import { device, app } from 'peer'
import { getUserId } from './local-storage'

function log(level, msg, data) {
  console[level](msg, data)
  
  // append useful debugging data
  data = data || {}
  data._version = VERSION
  data._bufferedAmount = messaging.peerSocket.bufferedAmount
  data._socketReadyState = messaging.peerSocket.readyState
  data._appReadyState = app.readyState
  data._lastSyncTime = device.lastSyncTime
  data._userId = getUserId()
  
  fetch('https://log.codeniko.com', {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'appid': LOG_APP_ID,
    },
    redirect: 'follow',
    body: JSON.stringify({
      logLevel: level,
      msg,
      data,
    })
  })
}

function debug(msg, data) {
  log('debug', msg, data)
}

function info(msg, data) {
  log('info', msg, data)
}

function warn(msg, data) {
  log('warn', msg, data)
}

function error(msg, data) {
  log('error', msg, data)
}

export default {
  debug,
  info,
  warn,
  error,
}