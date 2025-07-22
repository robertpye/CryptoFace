import ga from 'fitbit-ga4/companion'
import { FILE_EVENT } from 'fitbit-ga4/shared'
import * as settings from './settings'
import { settingsStorage } from 'settings'
import { fetchFearAndGreedIndicesApi, fetchTickers } from './ticker-api'
import { getUserId } from './local-storage'
import { me } from 'companion'
import log from './log'
import { timestamp } from '../common/utils'
import { me as companion } from 'companion'
import { device, app } from 'peer'
import { GA4_MEASUREMENT_ID, GA4_MEASUREMENT_API_SECRET } from '../resources/config'
import { inbox } from 'file-transfer'
import {
    sendDataToApp,
    FILE_REQUEST_REFRESH,
} from '../common/file-messaging'
import { DEFAULT_TICKER_1, DEFAULT_TICKER_2, DEFAULT_TICKER_3, DEFAULT_TICKER_4, DEFAULT_TICKER_5, DEFAULT_TICKER_6, SETTING_SHOW_REFRESH_BUTTON, SETTING_TICKERS } from '../common/constants'

const DEFAULT_TICKER_FETCH_FREQUENCY = 300001
let lastGFIndexFetch = 0
let lastTickerFetch = 0
let tickerFetchInProgress = false
let gfIndexFetchInProgress = false

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

function readSettings() {
    const showRefreshButton = settings.readValue('setting-show-refresh')
    return {
        [SETTING_TICKERS]: [
            settings.readValue('setting-ticker1') || DEFAULT_TICKER_1,
            settings.readValue('setting-ticker2') || DEFAULT_TICKER_2,
            settings.readValue('setting-ticker3') || DEFAULT_TICKER_3,
            settings.readValue('setting-ticker4') || DEFAULT_TICKER_4,
            settings.readValue('setting-ticker5') || DEFAULT_TICKER_5,
            settings.readValue('setting-ticker6') || DEFAULT_TICKER_6,
        ],
        [SETTING_SHOW_REFRESH_BUTTON]: showRefreshButton === true || showRefreshButton === 'true',
    }
}


function refreshData(trigger) {
    const settings = readSettings()
    const showRefreshButton = settings[SETTING_SHOW_REFRESH_BUTTON]
    const tickers = settings[SETTING_TICKERS]

    const tickersPromise = fetchAllTickers(trigger, tickers)
        .then(result => {
            console.log(`Finished ticker data fetch for trigger=${trigger}`)
            return result
        })
        .catch(err => {
            log.debug(err)
        })

    let greedFearPromise
    if (showRefreshButton) {
        greedFearPromise = Promise.resolve(null)
    } else {
        greedFearPromise = fetchFearAndGreedIndices(trigger)
            .then(result => {
                console.log(`Finished fear/greed data fetch for trigger=${trigger}`)
                return result
            })
            .catch(err => {
                log.debug(err)
            })
    }

    Promise.all([ tickersPromise, greedFearPromise ])
        .then(results => {
            const [ tickerData, greedAndFearData ] = results
            const allData = {
                settings,
            }
            if (tickerData) {
                allData.tickerData = tickerData
            }
            if (greedAndFearData) {
                allData.greedAndFearData = greedAndFearData
            }
            if (allData.tickerData || allData.greedAndFearData) {
                sendDataToApp(allData)
            }
        })
}

function fetchAllTickers(trigger, tickers) {
    // ignore subsequent fetch attempts that are happening too quickly to save data. Arbitrary 5 seconds.
    const ts = timestamp()
    if (trigger !== 'setting_change' && lastTickerFetch > ts - 30000) {
        return Promise.reject('Ignoring ticker fetch, too soon')
    }

    if (tickerFetchInProgress) {
        return Promise.reject('Ignoring ticker fetch, already in progress')
    }

    tickerFetchInProgress = true
    log.debug(`Fetching tickers (${trigger}): ${JSON.stringify(tickers)}`)
    return fetchTickers(tickers).then(result => {
        tickerFetchInProgress = false
        if (result) {
            lastTickerFetch = timestamp()
            ga.send({
                name: 'companion_fetch',
                params: {
                    trigger,
                },
            })
        }
        return result
    }).catch(() => {
        tickerFetchInProgress = false
    })
}

function fetchFearAndGreedIndices(trigger) {
    const ts = timestamp()
    if (trigger !== 'setting_change' && lastGFIndexFetch > ts - 3600000) {
        return Promise.reject('Ignoring fear/greed fetch, too soon')
    }

    if (gfIndexFetchInProgress) {
        return Promise.reject('Ignoring fear/greed fetch, already in progress')
    }

    gfIndexFetchInProgress = true
    log.debug(`Fetching greed/fear indices (${trigger})`)
    return fetchFearAndGreedIndicesApi().then(result => {
        gfIndexFetchInProgress = false
        if (result) {
            lastGFIndexFetch = timestamp()
            ga.send({
                name: 'companion_gfi_fetch',
                params: {
                    trigger,
                },
            })
        }
        return result
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
    refreshData('setting_change')
})

const initialFetch = setInterval(() => {
    log.info('Device Info', getDeviceInfo())
    // initial fetching of tickers when watchface is loaded. 3 second delay to give time for app to peer connect to companion
    log.debug('Initial fetch of tickers')
    refreshData('init')
    clearInterval(initialFetch)
}, 3000)

me.wakeInterval = DEFAULT_TICKER_FETCH_FREQUENCY

me.onwakeinterval = evt => {
    // periodic wake to fetch all tickers but companion is awake already
    log.debug('Companion was already awake - onwakeinterval')
    refreshData('wake_interval')
}

if (me.launchReasons.wokenUp) {
    // The companion started due to a periodic timer, fetch all tickers
    log.debug('Started due to wake interval')
    refreshData('launch_wake')
}

if (me.launchReasons.settingsChanged) {
    log.debug('Started due to setting change')
    refreshData('launch_setting_change')
}

if (companion.launchReasons.peerAppLaunched) {
    log.debug('Started due to peer app launching')
    refreshData('launch_app')
}

const processFiles = async () => {
    let file
    while ((file = await inbox.pop())) {
        if (file.name.startsWith(FILE_REQUEST_REFRESH)) {
            await file.cbor()
            console.log(`CryptoFace: File ${file.name} is being processed.`)
            refreshData('refresh_button')
        } else {
            ga.processFileTransfer(file)

            // Attempt to fetch ticker we get an GA event from app, most likely either display_on or load events
            if (file.name.startsWith(FILE_EVENT)) {
                refreshData('app_event')
            }
        }
    }
}

// Process new files as they arrive
inbox.addEventListener('newfile', processFiles)
// Process files on startup
processFiles()
