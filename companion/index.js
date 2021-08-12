import * as settings from "./settings"
import { settingsStorage } from 'settings'
import { fetchTickers } from './ticker-api'
import { sendValue } from './message'
import * as messaging from "messaging"
import { me } from "companion"

const DEFAULT_TICKER_FETCH_FREQUENCY = 300000

function readTickersFromStorage() {
  return [
    settings.readValue('setting-ticker1') || 'BTC-USD',
    settings.readValue('setting-ticker2') || 'ETH-USD',
    settings.readValue('setting-ticker3') || 'LTC-USD',
    settings.readValue('setting-ticker4') || 'XRP-USD',
    settings.readValue('setting-ticker5') || 'DIA',
    settings.readValue('setting-ticker6') || 'VTSAX',
  ]
}

function fetchAllTickers() {
  fetchTickers(readTickersFromStorage()).then(result => {
    if (result) {
      sendValue('tickers', result)
    }
  })
}

settings.init(() => {
  // fetch tickers if a setting changes
  fetchAllTickers()
})

const initialFetch = setInterval(() => {
  // initial fetching of tickers when watchface is loaded. 3 second delay to give time for app to peer connect to companion
  fetchAllTickers()
  clearInterval(initialFetch)
}, 3000)


messaging.peerSocket.addEventListener("message", function(evt) {
  // refresh button clicked, fetch all tickers
  console.log(`${evt.data.key}   ${JSON.stringify(evt.data.value)}`)
  if (evt.data.key !== 'refresh') {
    return
  }
  fetchAllTickers()
})

me.wakeInterval = DEFAULT_TICKER_FETCH_FREQUENCY

me.onwakeinterval = evt => {
  // periodic wake to fetch all tickers but companion is awake already
  console.log("Companion was already awake - onwakeinterval")
  fetchAllTickers()
}

if (me.launchReasons.wokenUp) { 
  // The companion started due to a periodic timer, fetch all tickers
  console.log("Started due to wake interval!")
  fetchAllTickers()
}

if (me.launchReasons.settingsChanged) { 
  console.log("Started due to setting change!")
  fetchAllTickers()
}
