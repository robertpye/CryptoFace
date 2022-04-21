/**
This file is common messaging functions specific to app.
*/

import * as messaging from 'messaging'
import { outbox } from 'file-transfer'

const FILE_REQUEST_REFRESH = 'request_tick_refresh'

export function sendValue(key, value) {
  if (messaging.peerSocket.readyState === 0) {
  // if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    console.log(`App: sending key=${key}`)
    messaging.peerSocket.send({
      key,
      value,
    })
  } else {
    console.log('No peerSocket connection')
  }
}

export function requestRefresh() {
    const filename = + (Math.floor(Math.random() * 10000000000000000))
    outbox.enqueue(filename, '').then(() => {
        debug && console.log(`GA4: File ${filename} transferred successfully.`)
    }).catch(function (error) {
        debug && console.log(`GA4: File ${filename} failed to transfer.`)
    })
}
