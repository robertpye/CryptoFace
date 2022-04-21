import { localStorage } from 'local-storage'
import { uuidv4 } from '../common/utils'

const USER_ID_KEY = 'userId'

export function getUserId() {
    const existing = localStorage.getItem(USER_ID_KEY)
    if (!existing) {
        const userId = uuidv4()
        localStorage.setItem(USER_ID_KEY, userId)
        return userId
    }
    return existing
}
