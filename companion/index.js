import ga from 'fitbit-ga4/companion'
import { FILE_EVENT } from 'fitbit-ga4/shared'
import * as settings from './settings'
import { settingsStorage } from 'settings'
import { fetchTickers } from './ticker-api'
import { getUserId } from './local-storage'
import { me } from 'companion'
import log from './log'
import { timestamp } from '../common/utils'
import { me as companion } from 'companion'
import { device, app } from 'peer'
import { GA4_MEASUREMENT_ID, GA4_MEASUREMENT_API_SECRET } from '../resources/config'
import { inbox } from 'file-transfer'
import {
    sendTickerData,
    FILE_REQUEST_REFRESH,
} from '../common/file-messaging'

const DEFAULT_TICKER_FETCH_FREQUENCY = 300001
let lastTickerFetch = 0
let tickerFetchInProgress = false

getUserId() // get or generate userId as first thing we do.
ga.configure({
    measurementId: GA4_MEASUREMENT_ID,
    apiSecret: GA4_MEASUREMENT_API_SECRET,
    autoFileTransferProcessing: false,
    debug: false,
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

companion.addEventListener('readystatechange', () => {
    log.debug(`appReadyState changed to ${app.readyState}`)
})

function readTickersFromStorage() {
    return [
        settings.readValue('setting-ticker1') || 'BTC-USD',
        settings.readValue('setting-ticker2') || 'ETH-USD',
        settings.readValue('setting-ticker3') || 'AVAX-USD',
        settings.readValue('setting-ticker4') || 'NFLX',
        settings.readValue('setting-ticker5') || 'DIA',
        settings.readValue('setting-ticker6') || 'VOO',
    ]
}

function fetchAllTickers(trigger) {
    // ignore subsequent fetch attempts that are happening too quickly to save data. Arbitrary 5 seconds.
    const ts = timestamp()
    if (lastTickerFetch > ts - 30000) {
        log.debug('Ignoring ticker fetch, too soon')
        return
    }

    if (tickerFetchInProgress) {
        log.debug('Ignoring ticker fetch, already in progress')
        return
    }

    const tickers = readTickersFromStorage()
    tickerFetchInProgress = true
    log.debug(`Fetching tickers (${trigger}): ${JSON.stringify(tickers)}`)
    fetchTickers(tickers).then(result => {
        tickerFetchInProgress = false
        if (result) {
            sendTickerData(result)
            lastTickerFetch = timestamp()
            ga.send({
                name: 'companion_fetch',
                params: {
                    trigger,
                },
            })
        }
    }).catch(() => {
        tickerFetchInProgress = false
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
            },
        })
    }
    fetchAllTickers('setting_change')
})

const initialFetch = setInterval(() => {
    log.info('Device Info', getDeviceInfo())
    // initial fetching of tickers when watchface is loaded. 3 second delay to give time for app to peer connect to companion
    log.debug('Initial fetch of tickers')
    fetchAllTickers('init')
    clearInterval(initialFetch)
}, 3000)

me.wakeInterval = DEFAULT_TICKER_FETCH_FREQUENCY

me.onwakeinterval = evt => {
    // periodic wake to fetch all tickers but companion is awake already
    log.debug('Companion was already awake - onwakeinterval')
    fetchAllTickers('wake_interval')
}

if (me.launchReasons.wokenUp) {
    // The companion started due to a periodic timer, fetch all tickers
    log.debug('Started due to wake interval')
    fetchAllTickers('launch_wake')
}

if (me.launchReasons.settingsChanged) {
    log.debug('Started due to setting change')
    fetchAllTickers('launch_setting_change')
}

if (companion.launchReasons.peerAppLaunched) {
    log.debug('Started due to peer app launching')
    fetchAllTickers('launch_app')
}

const processFiles = async () => {
    let file
    while ((file = await inbox.pop())) {
        if (file.name.startsWith(FILE_REQUEST_REFRESH)) {
            await file.cbor()
            console.log(`CryptoFace: File ${file.name} is being processed.`)
            fetchAllTickers('refresh_button')
        } else {
            ga.processFileTransfer(file)

            // Attempt to fetch ticker we get an GA event from app, most likely either display_on or load events
            if (file.name.startsWith(FILE_EVENT)) {
                fetchAllTickers('app_event')
            }
        }
    }
}

// Process new files as they arrive
inbox.addEventListener('newfile', processFiles)
// Process files on startup
processFiles()
