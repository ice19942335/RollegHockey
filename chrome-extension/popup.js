// Load settings on popup open
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings()
  setupEventListeners()
})

// Load settings from storage
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'GET_SETTINGS' })
    const settings = response.settings

    document.getElementById('enabled').checked = settings.enabled
    document.getElementById('url').value = settings.url
    document.getElementById('scheduleMode').value = settings.scheduleMode
    document.getElementById('dailyTime').value = settings.dailyTime
    document.getElementById('intervalHours').value = settings.intervalHours
    document.getElementById('closeAfterSeconds').value = settings.closeAfterSeconds
    document.getElementById('openOnStartup').checked = settings.openOnStartup

    updateScheduleModeVisibility()
  } catch (error) {
    showStatus('Ошибка загрузки настроек', 'error')
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('saveBtn').addEventListener('click', saveSettings)
  document.getElementById('runNowBtn').addEventListener('click', runNow)
  document.getElementById('forceRunBtn').addEventListener('click', forceRun)
  document.getElementById('scheduleMode').addEventListener('change', updateScheduleModeVisibility)
}

// Update visibility based on schedule mode
function updateScheduleModeVisibility() {
  const mode = document.getElementById('scheduleMode').value
  const dailyTimeGroup = document.getElementById('dailyTimeGroup')
  const intervalHoursGroup = document.getElementById('intervalHoursGroup')

  if (mode === 'daily') {
    dailyTimeGroup.classList.remove('hidden')
    intervalHoursGroup.classList.add('hidden')
  } else {
    dailyTimeGroup.classList.add('hidden')
    intervalHoursGroup.classList.remove('hidden')
  }
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      enabled: document.getElementById('enabled').checked,
      url: document.getElementById('url').value.trim(),
      scheduleMode: document.getElementById('scheduleMode').value,
      dailyTime: document.getElementById('dailyTime').value,
      intervalHours: parseInt(document.getElementById('intervalHours').value),
      closeAfterSeconds: parseInt(document.getElementById('closeAfterSeconds').value),
      openOnStartup: document.getElementById('openOnStartup').checked
    }

    // Validate URL
    if (!settings.url || !settings.url.startsWith('http')) {
      showStatus('Введите корректный URL', 'error')
      return
    }

    const response = await chrome.runtime.sendMessage({
      action: 'SET_SETTINGS',
      settings
    })

    if (response.success) {
      showStatus('Настройки сохранены!', 'success')
    }
  } catch (error) {
    showStatus('Ошибка сохранения настроек', 'error')
  }
}

// Run now
async function runNow() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'RUN_NOW',
      ignoreOncePerDay: false
    })

    if (response.success) {
      showStatus('Сайт открыт!', 'success')
    }
  } catch (error) {
    showStatus('Ошибка открытия сайта', 'error')
  }
}

// Force run (ignore once per day check)
async function forceRun() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'RUN_NOW',
      ignoreOncePerDay: true
    })

    if (response.success) {
      showStatus('Сайт открыт (Force Run)!', 'success')
    }
  } catch (error) {
    showStatus('Ошибка открытия сайта', 'error')
  }
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('status')
  statusEl.textContent = message
  statusEl.className = `status status-${type}`
  statusEl.classList.remove('hidden')

  setTimeout(() => {
    statusEl.classList.add('hidden')
  }, 3000)
}
