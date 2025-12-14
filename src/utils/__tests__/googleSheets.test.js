import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { deleteTournament } from '../googleSheets'
import * as googleSheetsConfig from '../../config/googleSheets.js'

// Mock configuration
vi.mock('../../config/googleSheets.js', () => ({
  getGoogleAppsScriptId: vi.fn(),
  IS_DEV_MODE: true
}))

// Mock global fetch
global.fetch = vi.fn()

describe('deleteTournament', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return error if Google Apps Script is not configured', async () => {
    googleSheetsConfig.getGoogleAppsScriptId.mockReturnValue('YOUR_SCRIPT_ID')
    
    const result = await deleteTournament('test-id')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Google Apps Script не настроен')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should return error if Google Apps Script ID is empty', async () => {
    googleSheetsConfig.getGoogleAppsScriptId.mockReturnValue('')
    
    const result = await deleteTournament('test-id')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Google Apps Script не настроен')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should return error if tournamentId is not provided', async () => {
    googleSheetsConfig.getGoogleAppsScriptId.mockReturnValue('valid-script-id')
    
    const result = await deleteTournament(null)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('ID турнира не указан')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should return error if tournamentId is empty string', async () => {
    googleSheetsConfig.getGoogleAppsScriptId.mockReturnValue('valid-script-id')
    
    const result = await deleteTournament('')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('ID турнира не указан')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should send POST request with correct data when all parameters are valid', async () => {
    const scriptId = 'test-script-id-123'
    const tournamentId = 'test-tournament-id'
    googleSheetsConfig.getGoogleAppsScriptId.mockReturnValue(scriptId)
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '{}'
    })
    
    const result = await deleteTournament(tournamentId)
    
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      `https://script.google.com/macros/s/${scriptId}/exec`,
      expect.objectContaining({
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'deleteTournament',
          tournamentId: tournamentId
        })
      })
    )
    
    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
  })

  it('should return success when fetch completes without errors', async () => {
    const scriptId = 'test-script-id-123'
    const tournamentId = 'test-tournament-id'
    googleSheetsConfig.getGoogleAppsScriptId.mockReturnValue(scriptId)
    
    global.fetch.mockResolvedValueOnce({
      ok: true
    })
    
    const result = await deleteTournament(tournamentId)
    
    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
  })

  it('should return error when fetch throws an error', async () => {
    const scriptId = 'test-script-id-123'
    const tournamentId = 'test-tournament-id'
    googleSheetsConfig.getGoogleAppsScriptId.mockReturnValue(scriptId)
    
    const fetchError = new Error('Network error')
    global.fetch.mockRejectedValueOnce(fetchError)
    
    const result = await deleteTournament(tournamentId)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('should return error with default message when fetch throws error without message', async () => {
    const scriptId = 'test-script-id-123'
    const tournamentId = 'test-tournament-id'
    googleSheetsConfig.getGoogleAppsScriptId.mockReturnValue(scriptId)
    
    const fetchError = new Error()
    global.fetch.mockRejectedValueOnce(fetchError)
    
    const result = await deleteTournament(tournamentId)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Ошибка при удалении турнира')
  })

  it('should handle general errors and return error message', async () => {
    googleSheetsConfig.getGoogleAppsScriptId.mockImplementation(() => {
      throw new Error('Config error')
    })
    
    const result = await deleteTournament('test-id')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Config error')
  })
})
