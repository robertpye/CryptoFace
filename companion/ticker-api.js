import { round, zeroPadDecimal } from '../common/utils'
import log from './log'
import { EXTREME_FEAR, EXTREME_GREED, FEAR, GREED, NEGATIVE, NEUTRAL, POSITIVE, ZERO } from '../common/constants'

export function fetchTickers(tickers) {
    if (!tickers) {
        return Promise.reject(new Error('No tickers provided'))
    }

    const tickerRequests = tickers.map(ticker => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?includePrePost=false&interval=1h&useYfid=true&range=24h&crypto24h=true`
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
                    const isCrypto = meta.instrumentType === 'CRYPTOCURRENCY'
                    const isCurrency = meta.instrumentType === 'CURRENCY'
                    let ticker = meta.symbol
                    const price = meta.regularMarketPrice
                    const priceChangePercent = (price / meta.chartPreviousClose - 1) * 100

                    let priceDecimals = 2
                    if (isCrypto) {
                        const dashIndex = meta.symbol.indexOf('-')
                        ticker = dashIndex > -1 ? meta.symbol.substring(0, dashIndex) : meta.symbol

                        const baseRounded = round(price, 0)
                        if (price < 100.0) {
                            priceDecimals = Math.min(11 - ticker.length - baseRounded.toString().length, 3)
                        }
                    }
                    if (isCurrency) {
                        const dashIndex = meta.symbol.indexOf('=')
                        ticker = dashIndex > -1 ? meta.symbol.substring(0, dashIndex) : meta.symbol
                        priceDecimals = 3
                    }

                    let changePercent = round(priceChangePercent, 2)

                    return {
                        ticker: ticker.substring(0, 6),
                        price: zeroPadDecimal(round(price, priceDecimals)),
                        changeClassification: changePercent === 0 ? ZERO : changePercent > 0 ? POSITIVE : NEGATIVE,
                        changePercent: `${zeroPadDecimal(changePercent)}%`,
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

export function fetchFearAndGreedIndicesApi() {
    const stocksPromise = fetch(`https://production.dataviz.cnn.io/index/fearandgreed/graphdata`)
        .then(response => response.json())
        .then(json => {
            if (!json.fear_and_greed) {
                log.error(`stocks fear and greed api error`, json)
                return null
            }
            return {
                score: Math.round(json.fear_and_greed.score),
                classification: validateClassification(json.fear_and_greed.rating),
            }
        })
        .catch(e => {
            log.error('stocks fear and greed api exception caught', e)
            return null
        })

    const cryptoPromise = fetch(`https://api.alternative.me/fng/`)
        .then(response => response.json())
        .then(json => {
            if (json.metadata.error) {
                log.error(`crypto fear and greed api error`, json.metadata.error)
                return null
            }
            const data = json.data[0]
            if (!data) {
                log.error(`crypto fear and greed api no data`, json)
                return null
            }

            return {
                score: Math.round(Number.parseInt(data.value)),
                classification: validateClassification(data.value_classification),
            }
        })
        .catch(e => {
            log.error('crypto fear and greed api exception caught', e)
            return null
        })

    return Promise.all([ stocksPromise, cryptoPromise ])
        .then(results => {
            const [ stocks, crypto ] = results
            return {
                stocks,
                crypto,
            }
        })
}

function validateClassification(value) {
    const lowercase = value.toLowerCase()
    switch (lowercase) {
        case FEAR:
        case EXTREME_FEAR:
            return FEAR

        case GREED:
        case EXTREME_GREED:
            return GREED

        default:
            return NEUTRAL
    }
}