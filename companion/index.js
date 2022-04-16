import ga from 'fitbit-ga4/companion'
import * as settings from './settings'
import { settingsStorage } from 'settings'
import { fetchTickers } from './ticker-api'
import { getUserId } from './local-storage'
import { sendValue, isPeerSocketOpen } from './message'
import * as messaging from 'messaging'
import { me } from 'companion'
import log from './log'
import { timestamp } from '../common/utils'
import { me as companion } from 'companion'
import { device, app } from 'peer'
import { GA4_MEASUREMENT_ID, GA4_MEASUREMENT_API_SECRET } from '../resources/config'

const DEFAULT_TICKER_FETCH_FREQUENCY = 300001
let lastTickerFetch = 0

getUserId() // get or generate userId as first thing we do.
ga.configure({
  measurementId: GA4_MEASUREMENT_ID,
  apiSecret: GA4_MEASUREMENT_API_SECRET,
})

function getDeviceInfo() {
  return {
    fbitVersion: companion.host.app.version,
    osName: companion.host.os.name,
    osVersion: companion.host.os.version,
    modelId: device.modelId,
    modelName: device.modelName,
  }
}

companion.addEventListener("readystatechange", () => {
  log.debug(`appReadyState changed to ${app.readyState}`)
})

function readTickersFromStorage() {
  return [
    settings.readValue('setting-ticker1') || 'BTC-USD',
    settings.readValue('setting-ticker2') || 'ETH-USD',
    settings.readValue('setting-ticker3') || 'AVAX-USD',
    settings.readValue('setting-ticker4') || 'XRP-USD',
    settings.readValue('setting-ticker5') || 'DIA',
    settings.readValue('setting-ticker6') || 'VTSAX',
  ]
}

function fetchAllTickers() {
  if (!isPeerSocketOpen()) {
    log.debug('Ignoring ticker fetch, peer socket closed')
    return
  }
  
  // ignore subsequent fetch attempts that are happening too quickly to save data. Arbitrary 5 seconds.
  const ts = timestamp()
  if (lastTickerFetch > ts - 5000) {
    log.debug('Ignoring ticker fetch, too soon')
    return
  }
  
  const tickers = readTickersFromStorage()
  log.debug(`Fetching tickers: ${JSON.stringify(tickers)}`)
  fetchTickers(tickers).then(result => {
    if (result) {
      const success = sendValue('tickers', result)
      if (success) {
        lastTickerFetch = timestamp()
      }
    }
  })
}

settings.init((evt) => {
  // fetch tickers if a setting changes
  log.debug('Settings changed')

  const tickerMatch = evt.key.match(/^setting-ticker([0-9])$/)
  if (tickerMatch) {
    const ticker = settings.readValue(evt.key) || 'DEFAULT'
    ga.send({
      name: 'ticker_changed',
      params: {
        position: tickerMatch[1],
        ticker,
      }
    })
  }
  fetchAllTickers()
})

const initialFetch = setInterval(() => {
  log.info('Device Info', getDeviceInfo())
  // initial fetching of tickers when watchface is loaded. 3 second delay to give time for app to peer connect to companion
  log.debug('Initial fetch of tickers')
  fetchAllTickers()
  clearInterval(initialFetch)
}, 3000)


messaging.peerSocket.addEventListener('message', function(evt) {
  // refresh button clicked, fetch all tickers
  log.debug(`Companion: received ${evt.data.key}  ${JSON.stringify(evt.data.value)}`)
  if (evt.data.key === 'refresh') {
    fetchAllTickers()
  }
})

messaging.peerSocket.addEventListener('open', (evt) => {
  log.debug('Peer socket opened')
  fetchAllTickers()
})

me.wakeInterval = DEFAULT_TICKER_FETCH_FREQUENCY

me.onwakeinterval = evt => {
  // periodic wake to fetch all tickers but companion is awake already
  log.debug("Companion was already awake - onwakeinterval")
  fetchAllTickers()
}

if (me.launchReasons.wokenUp) { 
  // The companion started due to a periodic timer, fetch all tickers
  log.debug("Started due to wake interval")
  fetchAllTickers()
}

if (me.launchReasons.settingsChanged) { 
  log.debug("Started due to setting change")
  fetchAllTickers()
}

if (companion.launchReasons.peerAppLaunched) {
  log.debug("Started due to peer app launching")
  fetchAllTickers()
}
