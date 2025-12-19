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
    document.getElementById('intervalMinutes').value = settings.intervalMinutes || 60
    document.getElementById('closeAfterSeconds').value = settings.closeAfterSeconds
    document.getElementById('openOnStartup').checked = settings.openOnStartup
  } catch (error) {
    showStatus('Ошибка загрузки настроек', 'error')
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('saveBtn').addEventListener('click', saveSettings)
  document.getElementById('runNowBtn').addEventListener('click', runNow)
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      enabled: document.getElementById('enabled').checked,
      url: document.getElementById('url').value.trim(),
      intervalMinutes: parseInt(document.getElementById('intervalMinutes').value),
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
      ignoreOncePerDay: true
    })

    if (response && response.success) {
      showStatus('Сайт открыт!', 'success')
    } else if (response && response.message) {
      showStatus(response.message, 'error')
    } else if (response && response.error) {
      showStatus(`Ошибка: ${response.error}`, 'error')
    } else {
      showStatus('Не удалось открыть сайт', 'error')
    }
  } catch (error) {
    console.error('Error in runNow:', error)
    showStatus(`Ошибка открытия сайта: ${error.message}`, 'error')
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
