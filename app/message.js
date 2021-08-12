/**
This file is common messaging functions specific to app.
*/

import * as messaging from "messaging"

export function sendValue(key, value) {
  if (messaging.peerSocket.readyState === 0) {
  // if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    console.log(`App: sending key=${key}`)
    messaging.peerSocket.send({
      key,
      value,
    })
  } else {
    console.log("No peerSocket connection")
  }
}