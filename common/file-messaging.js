import { outbox } from 'file-transfer'
import { encode } from 'cbor'

export const FILE_REQUEST_REFRESH = 'request_ticker_refresh'
export const FILE_TICKER_DATA = 'ticker_data'

// triggered by app
export function requestRefresh() {
    enqueueFile(FILE_REQUEST_REFRESH, encode(''))
}

// triggered by companion
export function sendDataToApp(data) {
    // const filename = + (Math.floor(Math.random() * 10000000000000000))
    enqueueFile(FILE_TICKER_DATA, encode(data))
}

function enqueueFile(filename, data) {
    outbox.enqueue(filename, data).then(() => {
        console.log(`CryptoFace: File ${filename} transferred successfully.`)
    }).catch(function (error) {
        console.error(`CryptoFace: File ${filename} failed to transfer.`, error)
    })
}
