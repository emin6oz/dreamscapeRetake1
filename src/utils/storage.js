// utils/storage.js - Fixed version to handle IndexedDB constraints properly

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
        // Sessions store - uses 'id' as keyPath
        if (!db.objectStoreNames.contains(STORE_NAMES.SESSIONS)) {
          db.createObjectStore(STORE_NAMES.SESSIONS, { keyPath: 'id' })
        }
        
        // Movement store - uses 'timestamp' as keyPath
        if (!db.objectStoreNames.contains(STORE_NAMES.MOVEMENT)) {
          db.createObjectStore(STORE_NAMES.MOVEMENT, { keyPath: 'timestamp' })
        }
        
        // Settings store - no keyPath, uses provided keys
        if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
          db.createObjectStore(STORE_NAMES.SETTINGS)
        }
        
        // Active session store - no keyPath, uses provided keys  
        if (!db.objectStoreNames.contains(STORE_NAMES.ACTIVE)) {
          db.createObjectStore(STORE_NAMES.ACTIVE)
        }
      }
    })
  }
  return dbPromise
}

export const saveToStorage = async (store, value, key = undefined) => {
  try {
    const db = await initDB()
    
    // Handle different store types properly
    if (store === STORE_NAMES.MOVEMENT) {
      // Movement store uses timestamp as keyPath - don't pass separate key
      if (!value.timestamp) {
        throw new Error('Movement data must have timestamp field')
      }
      return await db.put(store, value)
    } else if (store === STORE_NAMES.SESSIONS) {
      // Sessions store uses id as keyPath - don't pass separate key
      if (!value.id) {
        throw new Error('Session data must have id field')
      }
      return await db.put(store, value)
    } else if (store === STORE_NAMES.SETTINGS || store === STORE_NAMES.ACTIVE) {
      // Settings and Active stores need explicit keys
      if (!key) {
        throw new Error(`${store} requires a key parameter`)
      }
      return await db.put(store, value, key)
    } else {
      // Default behavior
      return await db.put(store, value, key)
    }
  } catch (error) {
    console.error(`Error saving to ${store}:`, error)
    console.error('Value being saved:', value)
    console.error('Key being used:', key)
    throw error
  }
}

export const getFromStorage = async (store, key) => {
  try {
    const db = await initDB()
    return await db.get(store, key)
  } catch (error) {
    console.error(`Error getting from ${store}:`, error)
    return null
  }
}

export const getAllFromStorage = async (store) => {
  try {
    const db = await initDB()
    return await db.getAll(store)
  } catch (error) {
    console.error(`Error getting all from ${store}:`, error)
    return []
  }
}

export const removeFromStorage = async (store, key) => {
  try {
    const db = await initDB()
    return await db.delete(store, key)
  } catch (error) {
    console.error(`Error removing from ${store}:`, error)
  }
}

export const clearStorage = async (store) => {
  try {
    const db = await initDB()
    return await db.clear(store)
  } catch (error) {
    console.error(`Error clearing ${store}:`, error)
  }
}

// Debug helper function
export const debugStorage = async () => {
  try {
    const db = await initDB()
    
    console.log('🔍 Database Debug Info:')
    console.log('Database name:', db.name)
    console.log('Database version:', db.version)
    console.log('Object stores:', [...db.objectStoreNames])
    
    // Check each store
    for (const storeName of Object.values(STORE_NAMES)) {
      try {
        const data = await db.getAll(storeName)
        console.log(`📊 ${storeName}:`, data.length, 'items')
        if (data.length > 0) {
          console.log(`   Sample item:`, data[0])
        }
      } catch (storeError) {
        console.error(`❌ Error accessing ${storeName}:`, storeError)
      }
    }
  } catch (error) {
    console.error('❌ Database debug failed:', error)
  }
}