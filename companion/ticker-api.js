import { round } from '../common/utils'
import log from './log'

export function fetchTickers(tickers) {
    if (!tickers) {
        return Promise.reject(new Error('No tickers provided'))
    }

    const tickerRequests = tickers.map(ticker => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?includePrePost=false&interval=2m&useYfid=true&range=1d`
        const dashIndex = ticker.indexOf('-') // crypto
        const userInputTicker = dashIndex > -1 ? ticker.substring(0, dashIndex) : ticker
        const errorJson = {
            ticker: userInputTicker,
        }

        return fetch(url)
            .then(response => response.json())
            .then(json => {
                if (json.chart.error) {
                    log.warn(`yfinance error`, json.chart.error) // this could be an error due to user input for tickers so log as debug. This isn't an app error
                    return errorJson
                }
                const tickerValues = json.chart.result.map(data => {
                    const meta = data.meta
                    const dashIndex = meta.symbol.indexOf('-') // crypto
                    const ticker = dashIndex > -1 ? meta.symbol.substring(0, dashIndex) : meta.symbol
                    const price = meta.regularMarketPrice
                    const priceChangePercent = (price / meta.previousClose - 1) * 100
                    return {
                        ticker,
                        price: round(price, 2),
                        // change: round(data.regularMarketChange, 2),
                        changePercent: round(priceChangePercent, 2),
                    }
                })
                return tickerValues[0]
            })
            .catch(e => {
                log.error('exception caught', e)
                return errorJson
            })
    })


    return Promise.all(tickerRequests)
}
