// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  url: 'https://ice19942335.github.io/RollegHockey/',
  intervalMinutes: 60,
  closeAfterSeconds: 5,
  openOnStartup: true
}

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get(['settings'])
  if (!result.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS })
  }
  await setupAlarms()
})

// Setup alarms based on settings
async function setupAlarms() {
  // Clear existing alarms
  const alarms = await chrome.alarms.getAll()
  alarms.forEach(alarm => {
    if (alarm.name === 'openSite') {
      chrome.alarms.clear(alarm.name)
    }
  })

  const result = await chrome.storage.local.get(['settings'])
  const settings = result.settings || DEFAULT_SETTINGS

  if (!settings.enabled) return

  // Interval mode (in minutes)
  const intervalMinutes = settings.intervalMinutes || 60
  chrome.alarms.create('openSite', {
    delayInMinutes: intervalMinutes,
    periodInMinutes: intervalMinutes
  })
}

// Store active timers for tab closing
const tabCloseTimers = new Map()

// Handle alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'openSite') {
    await openSite()
    // Interval mode handles itself with periodInMinutes
  }
})

// Open site function
async function openSite(ignoreOncePerDay = false) {
  try {
    const result = await chrome.storage.local.get(['settings', 'lastOpened'])
    const settings = result.settings || DEFAULT_SETTINGS
    const lastOpened = result.lastOpened || ''

    // No check for "already opened" - always allow opening when manually triggered

    // Check if there are any open windows, if not create one
    let windows
    try {
      windows = await chrome.windows.getAll()
    } catch (error) {
      console.error('Error getting windows:', error)
      windows = []
    }
    
    let tabId = null
    
    if (windows.length === 0) {
      // No windows open, create a new one
      try {
        const newWindow = await chrome.windows.create({
          url: settings.url,
          focused: false
        })
        
        // Update last opened date
        const today = new Date().toISOString().slice(0, 10)
        await chrome.storage.local.set({ lastOpened: today })
        
        // Schedule tab close if enabled
        if (settings.closeAfterSeconds > 0 && newWindow.tabs && newWindow.tabs.length > 0) {
          tabId = newWindow.tabs[0].id
          const timerId = setTimeout(async () => {
            try {
              await chrome.tabs.remove(tabId)
              tabCloseTimers.delete(tabId)
            } catch (error) {
              // Tab might already be closed
              tabCloseTimers.delete(tabId)
            }
          }, settings.closeAfterSeconds * 1000)
          
          tabCloseTimers.set(tabId, timerId)
        }
        
        return { success: true }
      } catch (error) {
        console.error('Error creating window:', error)
        return { success: false, error: error.message }
      }
    } else {
      // Windows exist, create tab in the first window
      try {
        const tab = await chrome.tabs.create({
          url: settings.url,
          active: false
        })
        
        tabId = tab.id

        // Update last opened date
        const today = new Date().toISOString().slice(0, 10)
        await chrome.storage.local.set({ lastOpened: today })

        // Schedule tab close if enabled
        if (settings.closeAfterSeconds > 0) {
          // Use setTimeout for precise timing (alarms have minimum 1 minute interval)
          const timerId = setTimeout(async () => {
            try {
              await chrome.tabs.remove(tabId)
              tabCloseTimers.delete(tabId)
            } catch (error) {
              // Tab might already be closed
              tabCloseTimers.delete(tabId)
            }
          }, settings.closeAfterSeconds * 1000)
          
          tabCloseTimers.set(tabId, timerId)
        }
        
        return { success: true }
      } catch (error) {
        console.error('Error creating tab:', error)
        return { success: false, error: error.message }
      }
    }
  } catch (error) {
    console.error('Error opening site:', error)
    return { success: false, error: error.message }
  }
}

// Clean up timers when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabCloseTimers.has(tabId)) {
    clearTimeout(tabCloseTimers.get(tabId))
    tabCloseTimers.delete(tabId)
  }
})

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_SETTINGS') {
    chrome.storage.local.get(['settings']).then(result => {
      sendResponse({ settings: result.settings || DEFAULT_SETTINGS })
    })
    return true // Keep channel open for async response
  }

  if (request.action === 'SET_SETTINGS') {
    chrome.storage.local.set({ settings: request.settings }).then(() => {
      setupAlarms()
      sendResponse({ success: true })
    })
    return true
  }

  if (request.action === 'RUN_NOW') {
    openSite(request.ignoreOncePerDay || false).then((result) => {
      sendResponse(result || { success: true })
    }).catch((error) => {
      sendResponse({ success: false, error: error.message })
    })
    return true
  }
})

// Handle startup (when browser starts)
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get(['settings'])
  const settings = result.settings || DEFAULT_SETTINGS
  if (settings.openOnStartup && settings.enabled) {
    await openSite()
  }
  await setupAlarms()
})

// Setup alarms when service worker starts (for reliability)
// This ensures alarms are set even if service worker was inactive
setupAlarms()
