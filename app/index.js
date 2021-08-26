import document from 'document'
import { preferences } from 'user-settings'
import * as util from '../common/utils'
import { sendValue } from './message'

// import * as simpleActivity from "./activity"
import * as clock from './clock'
import * as hrm from './hrm'
import * as settings from './device-settings'
import * as tickers from './tickers'


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

const background = document.getElementById("background")
const txtTime = document.getElementById("time")
const txtDate = document.getElementById("date")
const txtHRM = document.getElementById("hrm-text")
const iconHRM = document.getElementById("hrm-icon")
const hrmSymbolImage = iconHRM.getElementById("hrm-symbol-image")
const tickerName1 = document.getElementById("ticker-name1")
const tickerPrice1 = document.getElementById("ticker-price1")
const tickerChange1 = document.getElementById("ticker-change1")
const tickerName2 = document.getElementById("ticker-name2")
const tickerPrice2 = document.getElementById("ticker-price2")
const tickerChange2 = document.getElementById("ticker-change2")
const tickerName3 = document.getElementById("ticker-name3")
const tickerPrice3 = document.getElementById("ticker-price3")
const tickerChange3 = document.getElementById("ticker-change3")
const tickerName4 = document.getElementById("ticker-name4")
const tickerPrice4 = document.getElementById("ticker-price4")
const tickerChange4 = document.getElementById("ticker-change4")
const tickerName5 = document.getElementById("ticker-name5")
const tickerPrice5 = document.getElementById("ticker-price5")
const tickerChange5 = document.getElementById("ticker-change5")
const tickerName6 = document.getElementById("ticker-name6")
const tickerPrice6 = document.getElementById("ticker-price6")
const tickerChange6 = document.getElementById("ticker-change6")
const lastUpdate = document.getElementById("last-update")


tickerName1.text = "Loading"
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
clock.init("minutes", "shortDateWithDay", clockCallback)

/* -------- HRM ------------- */
function hrmCallback(data) {
  txtHRM.text = `${data.bpm}`
  if (data.zone === "out-of-range") {
    hrmSymbolImage.href = "images/heart_open.png"
  } else {
    hrmSymbolImage.href = "images/heart_solid.png"
  }
  if (data.bpm !== "--") {
    iconHRM.animate("highlight")
  }
}
hrm.init(hrmCallback)

/* -------- SETTINGS -------- */
function settingsCallback(data) {
}
settings.init(settingsCallback)

/* -------- TICKER DATA -------- */

function applyTickerColor(node, changePercent) {
  node.style.fill = changePercent > 0 ? GREEN : RED
}

function tickerCallback(data) {
  if (!data) {
    return
  }
  
  // update last updated node
  const timestamp = +new Date()
  lastUpdatedTimestamp = timestamp
  updateLastUpdateNode(timestamp)
  
  if (data[0]) {
    tickerName1.text = data[0].ticker
    tickerPrice1.text = data[0].price
    tickerChange1.text = `${data[0].changePercent}%`
    applyTickerColor(tickerChange1, data[0].changePercent)
  }
  if (data[1]) {
    tickerName2.text = data[1].ticker
    tickerPrice2.text = data[1].price
    tickerChange2.text = `${data[1].changePercent}%`
    applyTickerColor(tickerChange2, data[1].changePercent)
  }
  if (data[2]) {
    tickerName3.text = data[2].ticker
    tickerPrice3.text = data[2].price
    tickerChange3.text = `${data[2].changePercent}%`
    applyTickerColor(tickerChange3, data[2].changePercent)
  }
  if (data[3]) {
    tickerName4.text = data[3].ticker
    tickerPrice4.text = data[3].price
    tickerChange4.text = `${data[3].changePercent}%`
    applyTickerColor(tickerChange4, data[3].changePercent)
  }
  if (data[4]) {
    tickerName5.text = data[4].ticker
    tickerPrice5.text = data[4].price
    tickerChange5.text = `${data[4].changePercent}%`
    applyTickerColor(tickerChange5, data[4].changePercent)
  }
  if (data[5]) {
    tickerName6.text = data[5].ticker
    tickerPrice6.text = data[5].price
    tickerChange6.text = `${data[5].changePercent}%`
    applyTickerColor(tickerChange6, data[5].changePercent)
  }
}
tickers.init(tickerCallback)

function onRefreshClick(evt) {
  console.log('refresh clicked')
  sendValue('refresh', '')
}

document.getElementById("refresh-section").addEventListener("click", onRefreshClick)
document.getElementById("refresh-rect").addEventListener("click", onRefreshClick)
document.getElementById("refresh-text").addEventListener("click", onRefreshClick)