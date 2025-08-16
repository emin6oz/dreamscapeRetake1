// utils/db.js
import { openDB } from 'idb'

const DB_NAME = 'sleepTrackerDB'
const DB_VERSION = 1
const STORE_NAMES = {
  SESSIONS: 'sessions',
  MOVEMENT: 'movement',
  SETTINGS: 'settings'
}

// Initialize DB
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAMES.SESSIONS)) {
        db.createObjectStore(STORE_NAMES.SESSIONS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.MOVEMENT)) {
        db.createObjectStore(STORE_NAMES.MOVEMENT, { keyPath: 'timestamp' })
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
        db.createObjectStore(STORE_NAMES.SETTINGS)
      }
    }
  })
}

// Generic helpers
export async function saveItem(store, value) {
  const db = await initDB()
  return db.put(store, value)
}

export async function getItem(store, key) {
  const db = await initDB()
  return db.get(store, key)
}

export async function getAll(store) {
  const db = await initDB()
  return db.getAll(store)
}

export async function deleteItem(store, key) {
  const db = await initDB()
  return db.delete(store, key)
}

export async function clearStore(store) {
  const db = await initDB()
  return db.clear(store)
}

export { STORE_NAMES }
