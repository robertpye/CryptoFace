import { round } from '../common/utils'
import log from './log'

let lastFetch = 0

export function fetchTickers(tickers) {
  if (!tickers) {
    return Promise.reject(new Error('No tickers provided'))
  }
  
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers}`
  return fetch(url)
    .then(response => response.json())
    .then(json => {
      if (json.quoteResponse.error) {
        log.debug(`yfinance error ${json.quoteResponse.error}`) // this could be an error due to user input for tickers so log as debug. This isn't an app error
        return null
      }
      const result = {}
      const tickerValues = json.quoteResponse.result.map(data => {
        const dashIndex = data.symbol.indexOf('-') // crypto
        const ticker = dashIndex > -1 ? data.symbol.substring(0, dashIndex) : data.symbol
        return {
          ticker,
          price: round(data.regularMarketPrice, 2),
          // change: round(data.regularMarketChange, 2),
          changePercent: round(data.regularMarketChangePercent, 2),
        }
      })
      // tickerValues.forEach(value => {
      //   result[value.ticker] = value
      // })
      return tickerValues
    })
    .catch(e => {
      log.error('exception caught', e)
      // const result = {}
      // tickers.forEach(ticker => {
      //   result[ticker] = 'error'
      // })
      return null
    })
}