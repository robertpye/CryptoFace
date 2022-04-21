import { round } from '../common/utils'
import log from './log'

export function fetchTickers(tickers) {
    if (!tickers) {
        return Promise.reject(new Error('No tickers provided'))
    }

    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers}`
    return fetch(url)
        .then(response => response.json())
        .then(json => {
            if (json.quoteResponse.error) {
                log.warn(`yfinance error ${json.quoteResponse.error}`) // this could be an error due to user input for tickers so log as debug. This isn't an app error
                return null
            }
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
            return tickerValues
        })
        .catch(e => {
            log.error('exception caught', e)
            return null
        })
}
