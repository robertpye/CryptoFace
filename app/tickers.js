import * as messaging from "messaging"

let onChange

export function init(callback) {
  onChange = callback
}

messaging.peerSocket.addEventListener("message", function(evt) {
    console.log(`${evt.data.key}   ${JSON.stringify(evt.data.value)}`)
    if (evt.data.key !== 'tickers') {
      return
    }
    onChange(evt.data.value)
  })