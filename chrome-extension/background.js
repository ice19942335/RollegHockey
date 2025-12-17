// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  url: 'https://ice19942335.github.io/RollegHockey/',
  scheduleMode: 'daily', // 'daily' or 'interval'
  dailyTime: '09:00',
  intervalHours: 24,
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
    if (alarm.name.startsWith('openSite') || alarm.name.startsWith('closeTab')) {
      chrome.alarms.clear(alarm.name)
    }
  })

  const result = await chrome.storage.local.get(['settings'])
  const settings = result.settings || DEFAULT_SETTINGS

  if (!settings.enabled) return

  if (settings.scheduleMode === 'daily') {
    // Parse daily time
    const [hours, minutes] = settings.dailyTime.split(':').map(Number)
    const now = new Date()
    const targetTime = new Date()
    targetTime.setHours(hours, minutes, 0, 0)

    // If time has passed today, schedule for tomorrow
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1)
    }

    const delayInMinutes = Math.round((targetTime - now) / 1000 / 60)
    chrome.alarms.create('openSite', { delayInMinutes })
  } else {
    // Interval mode
    chrome.alarms.create('openSite', {
      delayInMinutes: settings.intervalHours * 60,
      periodInMinutes: settings.intervalHours * 60
    })
  }
}

// Handle alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'openSite') {
    await openSite()
    await setupAlarms() // Schedule next alarm
  } else if (alarm.name.startsWith('closeTab_')) {
    const tabId = parseInt(alarm.name.split('_')[1])
    chrome.tabs.remove(tabId).catch(() => {
      // Tab might already be closed
    })
  }
})

// Open site function
async function openSite(ignoreOncePerDay = false) {
  const result = await chrome.storage.local.get(['settings', 'lastOpened'])
  const settings = result.settings || DEFAULT_SETTINGS
  const lastOpened = result.lastOpened || ''

  // Check if already opened today (unless force run)
  if (!ignoreOncePerDay && settings.scheduleMode === 'daily') {
    const today = new Date().toISOString().slice(0, 10)
    if (lastOpened === today) {
      return // Already opened today
    }
  }

  // Open tab
  const tab = await chrome.tabs.create({
    url: settings.url,
    active: false
  })

  // Update last opened date
  const today = new Date().toISOString().slice(0, 10)
  await chrome.storage.local.set({ lastOpened: today })

  // Schedule tab close if enabled
  if (settings.closeAfterSeconds > 0) {
    chrome.alarms.create(`closeTab_${tab.id}`, {
      delayInMinutes: settings.closeAfterSeconds / 60
    })
  }
}

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
    openSite(request.ignoreOncePerDay || false).then(() => {
      sendResponse({ success: true })
    })
    return true
  }
})

// Handle startup
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get(['settings'])
  const settings = result.settings || DEFAULT_SETTINGS
  if (settings.openOnStartup && settings.enabled) {
    await openSite()
  }
  await setupAlarms()
})
