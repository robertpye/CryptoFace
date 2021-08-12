import * as messaging from "messaging"

export function sendValue(key, value) {
  // if (true) {
  if (messaging.peerSocket.readyState === 0) {
  // if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    console.log(`Companion: sending key=${key} peerSocket.readyState=${messaging.peerSocket.readyState}`)
    messaging.peerSocket.send({
      key,
      value,
    })
    return true
  } else {
    console.log("No peerSocket connection")
    return false
  }
}