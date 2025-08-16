// utils/storage.js
import { openDB } from 'idb'

const DB_NAME = 'sleepTrackerDB'
const DB_VERSION = 1

export const STORE_NAMES = {
  SESSIONS: 'sessions',
  MOVEMENT: 'movement',
  SETTINGS: 'settings',
  ACTIVE: 'activeSession'
}

let dbPromise

async function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
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
        if (!db.objectStoreNames.contains(STORE_NAMES.ACTIVE)) {
          db.createObjectStore(STORE_NAMES.ACTIVE)
        }
      }
    })
  }
  return dbPromise
}

export const saveToStorage = async (store, value, key) => {
  try {
    const db = await initDB()
    return db.put(store, value, key)
  } catch (error) {
    console.error('Error saving to IndexedDB:', error)
  }
}

export const getFromStorage = async (store, key) => {
  try {
    const db = await initDB()
    return db.get(store, key)
  } catch (error) {
    console.error('Error getting from IndexedDB:', error)
    return null
  }
}

export const getAllFromStorage = async (store) => {
  try {
    const db = await initDB()
    return db.getAll(store)
  } catch (error) {
    console.error('Error getting all from IndexedDB:', error)
    return []
  }
}

export const removeFromStorage = async (store, key) => {
  try {
    const db = await initDB()
    return db.delete(store, key)
  } catch (error) {
    console.error('Error removing from IndexedDB:', error)
  }
}

export const clearStorage = async (store) => {
  try {
    const db = await initDB()
    return db.clear(store)
  } catch (error) {
    console.error('Error clearing IndexedDB:', error)
  }
}
