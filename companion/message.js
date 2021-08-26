import * as messaging from 'messaging'
import log from './log'

export function sendValue(key, value) {
  // if (true) {
  if (isPeerSocketOpen()) {
  // if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    log.debug(`Companion: sending key=${key} over socket`)
    messaging.peerSocket.send({
      key,
      value,
    })
    return true
  } else {
    log.warn('No peerSocket connection')
    return false
  }
}

export function isPeerSocketOpen() {
  return messaging.peerSocket.readyState === 0
}

messaging.peerSocket.addEventListener('close', (evt) => {
  /*
  Close codes: CONNECTION_LOST, PEER_INITIATED, SOCKET_ERROR
  */
  log.debug(`Socket closed: ${evt.code} - ${evt.reason}`, {
    code: evt.code,
    reason: evt.reason,
  })
})

messaging.peerSocket.addEventListener('error', (err) => {
  log.error(`Socket error: ${err.code} - ${err.message}`, {
    errorCode: err.code,
  })
})

messaging.peerSocket.addEventListener('bufferedamountdecrease', (evt) => {
  log.debug(`Buffered amount decreased, bufferedAmount = ${messaging.peerSocket.bufferedAmount}`)
})