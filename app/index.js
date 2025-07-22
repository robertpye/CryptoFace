import document from 'document'
import ga from 'fitbit-ga4/app'
import * as util from '../common/utils'
import {
    requestRefresh,
    FILE_REQUEST_REFRESH,
    FILE_TICKER_DATA,
} from '../common/file-messaging'

import * as clock from './clock'
import * as hrm from './hrm'
import { inbox } from 'file-transfer'
import * as fs from 'fs'
import { FEAR, GREED, NEGATIVE, NEUTRAL, POSITIVE, SETTING_SHOW_REFRESH_BUTTON } from '../common/constants'

ga.setDebug(false)
ga.sendLoadAndDisplayOnEvents(true)

// Update the <text> element every tick with the current time
// clock.ontick = (evt) => {
//   const today = evt.date;
//   let hours = today.getHours();
//   if (preferences.clockDisplay === "12h") {
//     // 12h format
//     hours = hours % 12 || 12;
//   } else {
//     // 24h format
//     hours = util.zeroPad(hours);
//   }
//   const mins = util.zeroPad(today.getMinutes());
//   // myLabel.text = `${hours}:${mins}`;
// }

const RED = '#E94F64'
const GREEN = '#52D273'
const WHITE = '#FBFBFB'

const background = document.getElementById('background')
const txtTime = document.getElementById('time')
const txtDate = document.getElementById('date')
const txtHRM = document.getElementById('hrm-text')
const iconHRM = document.getElementById('hrm-icon')
const hrmSymbolImage = iconHRM.getElementById('hrm-symbol-image')
const tickerName1 = document.getElementById('ticker-name1')
const tickerPrice1 = document.getElementById('ticker-price1')
const tickerChange1 = document.getElementById('ticker-change1')
const tickerName2 = document.getElementById('ticker-name2')
const tickerPrice2 = document.getElementById('ticker-price2')
const tickerChange2 = document.getElementById('ticker-change2')
const tickerName3 = document.getElementById('ticker-name3')
const tickerPrice3 = document.getElementById('ticker-price3')
const tickerChange3 = document.getElementById('ticker-change3')
const tickerName4 = document.getElementById('ticker-name4')
const tickerPrice4 = document.getElementById('ticker-price4')
const tickerChange4 = document.getElementById('ticker-change4')
const tickerName5 = document.getElementById('ticker-name5')
const tickerPrice5 = document.getElementById('ticker-price5')
const tickerChange5 = document.getElementById('ticker-change5')
const tickerName6 = document.getElementById('ticker-name6')
const tickerPrice6 = document.getElementById('ticker-price6')
const tickerChange6 = document.getElementById('ticker-change6')
const lastUpdate = document.getElementById('last-update')
const refreshRect = document.getElementById('refresh-rect')
const refreshText = document.getElementById('refresh-text')
const gfMainLabel = document.getElementById('gf-label')
const gfStockLabel = document.getElementById('gf-stock-label')
const gfCryptoLabel = document.getElementById('gf-crypto-label')
const gfStockValue = document.getElementById('gf-stock-value')
const gfCryptoValue = document.getElementById('gf-crypto-value')

tickerName1.text = 'Loading'
showRefreshButtonOrFearAndGreedIndices(false)

// tickerName1.text = "BTC"
// tickerPrice1.text = "30232.24"
// tickerChange1.text = "32%"
// tickerName2.text = "BTC"
// tickerPrice2.text = "30232.24"
// tickerChange2.text = "32%"
// tickerName3.text = "BTC"
// tickerPrice3.text = "30232.24"
// tickerChange3.text = "32%"
// tickerName4.text = "BTC"
// tickerPrice4.text = "30232.24"
// tickerChange4.text = "32%"

let lastUpdatedTimestamp = 0

function updateLastUpdateNode(curTimestamp) {
    lastUpdate.text = `Last updated ${util.getLastUpdateTimeString(lastUpdatedTimestamp, curTimestamp)}`
}

/* --------- CLOCK ---------- */
function clockCallback(data) {
    txtTime.text = data.time
    txtDate.text = data.date
    updateLastUpdateNode(data.timestamp)
}

clock.init('minutes', 'shortDateWithDay', clockCallback)

/* -------- HRM ------------- */
function hrmCallback(data) {
    txtHRM.text = `${data.bpm}`
    if (data.zone === 'out-of-range') {
        hrmSymbolImage.href = 'images/heart_open.png'
    } else {
        hrmSymbolImage.href = 'images/heart_solid.png'
    }
    if (data.bpm !== '--') {
        iconHRM.animate('highlight')
    }
}

hrm.init(hrmCallback)

/* -------- TICKER DATA -------- */
const processFiles = () => {
    let file
    while ((file = inbox.nextFile(FILE_TICKER_DATA))) {
        const payload = fs.readFileSync(file, 'cbor')
        console.log(`CryptoFace: File ${file} is being processed.`)
        updateUI(payload)
    }
}

// Process new files as they arrive
inbox.addEventListener('newfile', processFiles)
// Process files on startup
processFiles()

function applyTickerColor(node, changeClassification) {
    applyColorByClassification(node, changeClassification)
}

function setPrice(element, price) {
    element.text = price || 'error'
}

function setChangePercent(element, changePercent, changeClassification) {
    if (typeof changePercent === 'string' ) {
        element.text = changePercent
        applyTickerColor(element, changeClassification)
    } else {
        element.text = ''
    }
}

function updateUI(data) {
    if (!data) {
        return
    }

    const { tickerData, greedAndFearData, settings } = data

    if (tickerData) {
        const timestamp = +new Date()
        const timeSinceLastUpdate = timestamp - lastUpdatedTimestamp
        const passedErrorTimeThreshold = timeSinceLastUpdate > 600000 // 10 minutes

        // update if atleast one ticker successful, or time threshold passed if failing. We either update all or none.
        // This prevents issue if network connection is lost but we open watch to update while in subway for example.
        // We want to show the previous values if they are recent enough instead of replacing minutes old price data with 'error'
        let shouldUpdate = false
        for (let i = 0; i < tickerData.length; ++i) {
            const price = tickerData[i].price
            if (price || passedErrorTimeThreshold) {
                shouldUpdate = true
                break
            }
        }

        if (shouldUpdate) {
            lastUpdatedTimestamp = timestamp
            updateLastUpdateNode(timestamp)

            if (tickerData[0]) {
                tickerName1.text = tickerData[0].ticker
                setPrice(tickerPrice1, tickerData[0].price)
                setChangePercent(tickerChange1, tickerData[0].changePercent, tickerData[0].changeClassification)
            }
            if (tickerData[1]) {
                tickerName2.text = tickerData[1].ticker
                setPrice(tickerPrice2, tickerData[1].price)
                setChangePercent(tickerChange2, tickerData[1].changePercent, tickerData[1].changeClassification)
            }
            if (tickerData[2]) {
                tickerName3.text = tickerData[2].ticker
                setPrice(tickerPrice3, tickerData[2].price)
                setChangePercent(tickerChange3, tickerData[2].changePercent, tickerData[2].changeClassification)
            }
            if (tickerData[3]) {
                tickerName4.text = tickerData[3].ticker
                setPrice(tickerPrice4, tickerData[3].price)
                setChangePercent(tickerChange4, tickerData[3].changePercent, tickerData[3].changeClassification)
            }
            if (tickerData[4]) {
                tickerName5.text = tickerData[4].ticker
                setPrice(tickerPrice5, tickerData[4].price)
                setChangePercent(tickerChange5, tickerData[4].changePercent, tickerData[4].changeClassification)
            }
            if (tickerData[5]) {
                tickerName6.text = tickerData[5].ticker
                setPrice(tickerPrice6, tickerData[5].price)
                setChangePercent(tickerChange6, tickerData[5].changePercent, tickerData[5].changeClassification)
            }
        }
    }

    const showRefreshButton = settings[SETTING_SHOW_REFRESH_BUTTON]
    showRefreshButtonOrFearAndGreedIndices(showRefreshButton)
    if (!showRefreshButton) {
        updateFearGreedIndicesUI(greedAndFearData)
    }
}

/**
 * @param data ex: {
 *   stocks: { score: 72, classification: 'greed' },
 *   crypto: { score: 70, classification: 'greed' }
 * }
 */
function updateFearGreedIndicesUI(data) {
    const payload = data || {}
    const { stocks, crypto } = payload

    if (stocks && typeof stocks.score === 'number') {
        gfStockValue.text = stocks.score
        applyColorByClassification(gfStockValue, stocks.classification)
    }

    if (crypto && typeof crypto.score === 'number') {
        gfCryptoValue.text = crypto.score
        applyColorByClassification(gfCryptoValue, crypto.classification)
    }
}

function applyColorByClassification(node, classification) {
    switch (classification) {
        case NEGATIVE:
        case FEAR:
            node.style.fill = RED
            break
        case POSITIVE:
        case GREED:
            node.style.fill = GREEN
            break
        default:
            node.style.fill = WHITE
            break
    }
}

function showRefreshButtonOrFearAndGreedIndices(showRefreshButton) {
    if (showRefreshButton) {
        refreshRect.style.display = 'inline'
        refreshText.style.display = 'inline'
        gfMainLabel.style.display = 'none'
        gfStockLabel.style.display = 'none'
        gfCryptoLabel.style.display = 'none'
        gfStockValue.style.display = 'none'
        gfCryptoValue.style.display = 'none'
    } else {
        refreshRect.style.display = 'none'
        refreshText.style.display = 'none'
        gfMainLabel.style.display = 'inline'
        gfStockLabel.style.display = 'inline'
        gfCryptoLabel.style.display = 'inline'
        gfStockValue.style.display = 'inline'
        gfCryptoValue.style.display = 'inline'
    }
}

function onRefreshClick(evt) {
    console.log('refresh clicked')
    requestRefresh()
    ga.send({ name: 'refresh_click' })
}

document.getElementById('refresh-section').addEventListener('click', onRefreshClick)
refreshRect.addEventListener('click', onRefreshClick)
refreshText.addEventListener('click', onRefreshClick)
