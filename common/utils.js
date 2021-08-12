// Add zero in front of numbers < 10
export function zeroPad(i) {
  if (i < 10) {
    i = '0' + i
  }
  return i
}

export function round(value, numDecimals = 0) {
  const shift = Math.pow(10, numDecimals)
  return Math.floor(value * shift) / shift
}

export function getLastUpdateTimeString(lastUpdated, cur) {
  if (lastUpdated <= 0) {
    return ''
  }
  
  const diffMinutes = Math.floor((cur - lastUpdated) / 60000)
  if (diffMinutes <= 0) return `recently`
  if (diffMinutes == 1) return `1 minute ago`
  return `${diffMinutes} minutes ago`
}