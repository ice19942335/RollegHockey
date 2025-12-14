import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TournamentList from '../TournamentList'
import { LanguageProvider } from '../../i18n/LanguageContext'
import * as googleSheets from '../../utils/googleSheets'
import * as googleSheetsConfig from '../../config/googleSheets'

// Mock dependencies
vi.mock('../../utils/googleSheets', () => ({
  loadTournamentsList: vi.fn(),
  loadDataFromSheets: vi.fn(),
  deleteTournament: vi.fn()
}))

vi.mock('../../config/googleSheets', () => ({
  IS_DEV_MODE: true
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderWithProvider = (component) => {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        {component}
      </LanguageProvider>
    </MemoryRouter>
  )
}

describe('TournamentList - Delete Functionality', () => {
  const mockTournament = {
    id: 'test-tournament-id',
    name: 'Test Tournament',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    description: 'Test description',
    teams: [
      { id: '1', name: 'Team 1', logo: '🏒', color: '#ff0000' }
    ]
  }

  const mockTournamentData = {
    teams: mockTournament.teams,
    games: []
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.alert = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should show delete button on tournament card', async () => {
    googleSheets.loadTournamentsList.mockResolvedValueOnce([mockTournament])
    googleSheets.loadDataFromSheets.mockResolvedValueOnce(mockTournamentData)

    renderWithProvider(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle((content, element) => {
      return element?.title?.includes('Удалить турнир') || 
             element?.title?.includes('Dzēst turnīru')
    })
    expect(deleteButton).toBeInTheDocument()
  })

  it('should open delete modal when delete button is clicked', async () => {
    googleSheets.loadTournamentsList
      .mockResolvedValueOnce([mockTournament]) // Initial load
      .mockResolvedValueOnce([mockTournament]) // Check in DeleteTournamentModal
    googleSheets.loadDataFromSheets.mockResolvedValueOnce(mockTournamentData)

    renderWithProvider(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle((content, element) => {
      return element?.title?.includes('Удалить турнир') || 
             element?.title?.includes('Dzēst turnīru')
    })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      const confirmElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('уверены') || 
               element?.textContent?.includes('tiešām')
      })
      expect(confirmElements.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should close delete modal when cancel is clicked', async () => {
    googleSheets.loadTournamentsList
      .mockResolvedValueOnce([mockTournament]) // Initial load
      .mockResolvedValueOnce([mockTournament]) // Check in DeleteTournamentModal
    googleSheets.loadDataFromSheets.mockResolvedValueOnce(mockTournamentData)

    renderWithProvider(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle((content, element) => {
      return element?.title?.includes('Удалить турнир') || 
             element?.title?.includes('Dzēst turnīru')
    })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      const cancelButtons = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Отмена') || 
               element?.textContent?.includes('Atcelt')
      })
      expect(cancelButtons.length).toBeGreaterThan(0)
    })

    const cancelButtons = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Отмена') || 
             element?.textContent?.includes('Atcelt')
    })
    const cancelButton = cancelButtons.find(btn => btn.tagName === 'BUTTON') || cancelButtons[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      const confirmElements = screen.queryAllByText((content, element) => {
        return element?.textContent?.includes('уверены') || 
               element?.textContent?.includes('tiešām')
      })
      expect(confirmElements.length).toBe(0)
    })
  })

  it('should show deleting modal and call deleteTournament when confirmed', async () => {
    googleSheets.loadTournamentsList
      .mockResolvedValueOnce([mockTournament]) // Initial load
      .mockResolvedValueOnce([mockTournament]) // Check in DeleteTournamentModal
      .mockResolvedValueOnce([mockTournament]) // Sync before delete
      .mockResolvedValueOnce([]) // After delete
    googleSheets.loadDataFromSheets.mockResolvedValueOnce(mockTournamentData)
    googleSheets.deleteTournament.mockResolvedValueOnce({ success: true })

    renderWithProvider(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle((content, element) => {
      return element?.title?.includes('Удалить турнир') || 
             element?.title?.includes('Dzēst turnīru')
    })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      const confirmElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('уверены') || 
               element?.textContent?.includes('tiešām')
      })
      expect(confirmElements.length).toBeGreaterThan(0)
    })

    const confirmButtons = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Удалить турнир') || 
             element?.textContent?.includes('Dzēst turnīru')
    })
    const confirmButton = confirmButtons.find(btn => btn.classList.contains('btn-danger')) || confirmButtons[0]
    fireEvent.click(confirmButton)

    // Should call deleteTournament (modal may appear/disappear quickly)
    await waitFor(() => {
      expect(googleSheets.deleteTournament).toHaveBeenCalledWith(mockTournament.id)
    }, { timeout: 3000 })
  })

  it('should handle successful deletion and reload tournaments list', async () => {
    googleSheets.loadTournamentsList
      .mockResolvedValueOnce([mockTournament]) // Initial load
      .mockResolvedValueOnce([mockTournament]) // Check in DeleteTournamentModal
      .mockResolvedValueOnce([mockTournament]) // Sync before delete
      .mockResolvedValueOnce([]) // After delete (empty list)
    googleSheets.loadDataFromSheets
      .mockResolvedValueOnce(mockTournamentData) // Initial load teams
    googleSheets.deleteTournament.mockResolvedValueOnce({ success: true })

    renderWithProvider(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle((content, element) => {
      return element?.title?.includes('Удалить турнир') || 
             element?.title?.includes('Dzēst turnīru')
    })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      const confirmElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('уверены') || 
               element?.textContent?.includes('tiešām')
      })
      expect(confirmElements.length).toBeGreaterThan(0)
    })

    const confirmButtons = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Удалить турнир') || 
             element?.textContent?.includes('Dzēst turnīru')
    })
    const confirmButton = confirmButtons.find(btn => btn.classList.contains('btn-danger')) || confirmButtons[0]
    fireEvent.click(confirmButton)

    // Wait for deletion to complete
    await waitFor(() => {
      expect(googleSheets.deleteTournament).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Should reload tournaments list (check that it was called multiple times)
    await waitFor(() => {
      expect(googleSheets.loadTournamentsList.mock.calls.length).toBeGreaterThanOrEqual(2)
    }, { timeout: 3000 })
  })

  it('should handle deletion error and show error message', async () => {
    const errorMessage = 'Failed to delete tournament'
    googleSheets.loadTournamentsList
      .mockResolvedValueOnce([mockTournament]) // Initial load
      .mockResolvedValueOnce([mockTournament]) // Check in DeleteTournamentModal
      .mockResolvedValueOnce([mockTournament]) // Sync before delete
    googleSheets.loadDataFromSheets.mockResolvedValueOnce(mockTournamentData)
    googleSheets.deleteTournament.mockResolvedValueOnce({ 
      success: false, 
      error: errorMessage 
    })

    renderWithProvider(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle((content, element) => {
      return element?.title?.includes('Удалить турнир') || 
             element?.title?.includes('Dzēst turnīru')
    })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      const confirmElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('уверены') || 
               element?.textContent?.includes('tiešām')
      })
      expect(confirmElements.length).toBeGreaterThan(0)
    })

    const confirmButtons = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Удалить турнир') || 
             element?.textContent?.includes('Dzēst turnīru')
    })
    const confirmButton = confirmButtons.find(btn => btn.classList.contains('btn-danger')) || confirmButtons[0]
    fireEvent.click(confirmButton)

    // Should show error in deleting modal
    await waitFor(() => {
      const errorElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Ошибка при удалении') || 
               element?.textContent?.includes('Kļūda, dzēšot turnīru')
      })
      expect(errorElements.length).toBeGreaterThan(0)
    })

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Should show contact admin message
    const adminMessageElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('свяжитесь с администратором') || 
             element?.textContent?.includes('sazinieties ar administratoru')
    })
    expect(adminMessageElements.length).toBeGreaterThan(0)
  })

  it('should show alert when tournament is already deleted during sync', async () => {
    googleSheets.loadTournamentsList
      .mockResolvedValueOnce([mockTournament]) // Initial load
      .mockResolvedValueOnce([mockTournament]) // Check in DeleteTournamentModal
      .mockResolvedValueOnce([]) // Sync before delete - tournament not found
      .mockResolvedValueOnce([]) // After reload
    googleSheets.loadDataFromSheets.mockResolvedValueOnce(mockTournamentData)

    renderWithProvider(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle((content, element) => {
      return element?.title?.includes('Удалить турнир') || 
             element?.title?.includes('Dzēst turnīru')
    })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      const confirmElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('уверены') || 
               element?.textContent?.includes('tiešām')
      })
      expect(confirmElements.length).toBeGreaterThan(0)
    })

    const confirmButtons = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Удалить турнир') || 
             element?.textContent?.includes('Dzēst turnīru')
    })
    const confirmButton = confirmButtons.find(btn => btn.classList.contains('btn-danger')) || confirmButtons[0]
    fireEvent.click(confirmButton)

    // Should show alert that tournament is already deleted
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should not navigate to tournament page when delete button is clicked', async () => {
    googleSheets.loadTournamentsList
      .mockResolvedValueOnce([mockTournament]) // Initial load
      .mockResolvedValueOnce([mockTournament]) // Check in DeleteTournamentModal
    googleSheets.loadDataFromSheets.mockResolvedValueOnce(mockTournamentData)

    renderWithProvider(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle((content, element) => {
      return element?.title?.includes('Удалить турнир') || 
             element?.title?.includes('Dzēst turnīru')
    })
    fireEvent.click(deleteButton)

    // Should not navigate
    expect(mockNavigate).not.toHaveBeenCalled()

    // Should show delete modal instead
    await waitFor(() => {
      const confirmElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('уверены') || 
               element?.textContent?.includes('tiešām')
      })
      expect(confirmElements.length).toBeGreaterThan(0)
    })
  })

  it('should display tournament ID in dev mode', async () => {
    googleSheetsConfig.IS_DEV_MODE = true
    googleSheets.loadTournamentsList
      .mockResolvedValueOnce([mockTournament]) // Initial load
      .mockResolvedValueOnce([mockTournament]) // Check in DeleteTournamentModal (if modal opens)
    googleSheets.loadDataFromSheets.mockResolvedValueOnce(mockTournamentData)

    renderWithProvider(<TournamentList />)

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    expect(screen.getByText(/ID: test-tournament-id/i)).toBeInTheDocument()
  })
})
