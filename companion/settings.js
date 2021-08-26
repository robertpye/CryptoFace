import { settingsStorage } from 'settings'
import { sendValue } from './message'

export function init(callback) {
  settingsStorage.addEventListener('change', evt => {
    // no need to send to app
    // if (evt.oldValue !== evt.newValue) {
    //   sendValue('settings', {
    //     settingKey: evt.key,
    //     value: JSON.parse(evt.newValue),
    //   });
    // }
    
    if (evt.oldValue !== evt.newValue) {
      callback()
    }
  })
}

/**
Helper to read value of setting. getItem seems to return an stringified object with `.name` key containing the value, or null. 
This seems weird so just in case other devices dont do this, normalize it to always return the value or null
*/
export function readValue(key) {
  const raw = settingsStorage.getItem(key)
  
  if (raw) {
    const maybeObj = JSON.parse(raw)
    return maybeObj.name || (maybeObj.name === '' ? null : raw)
  }
  return raw
}