import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DeleteTournamentModal from '../DeleteTournamentModal'
import { LanguageProvider } from '../../i18n/LanguageContext'
import * as googleSheets from '../../utils/googleSheets'

// Mock loadTournamentsList
vi.mock('../../utils/googleSheets', () => ({
  loadTournamentsList: vi.fn()
}))

const renderWithProvider = (component) => {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        {component}
      </LanguageProvider>
    </MemoryRouter>
  )
}

describe('DeleteTournamentModal', () => {
  const mockTournament = {
    id: 'test-tournament-id',
    name: 'Test Tournament',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    teams: [
      { id: '1', name: 'Team 1', logo: '🏒', color: '#ff0000' },
      { id: '2', name: 'Team 2', logo: '⛸️', color: '#0000ff' }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    const { container } = renderWithProvider(
      <DeleteTournamentModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        tournament={mockTournament}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should not render when tournament is null', () => {
    const { container } = renderWithProvider(
      <DeleteTournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        tournament={null}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should show loading state when checking tournament existence', async () => {
    googleSheets.loadTournamentsList.mockImplementation(() => 
      new Promise(() => {}) // Infinite promise to simulate loading
    )

    renderWithProvider(
      <DeleteTournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        tournament={mockTournament}
      />
    )

    await waitFor(() => {
      const elements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Синхронизация') || 
               element?.textContent?.includes('Sinhronizācija')
      })
      expect(elements.length).toBeGreaterThan(0)
    }, { timeout: 1000 })
  })

  it('should show "tournament already deleted" message when tournament does not exist', async () => {
    googleSheets.loadTournamentsList.mockResolvedValueOnce([]) // Empty list

    renderWithProvider(
      <DeleteTournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        tournament={mockTournament}
      />
    )

    await waitFor(() => {
      const elements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('удален') || 
               element?.textContent?.includes('dzēsts')
      })
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  it('should show confirmation form when tournament exists', async () => {
    googleSheets.loadTournamentsList.mockResolvedValueOnce([mockTournament])

    renderWithProvider(
      <DeleteTournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        tournament={mockTournament}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const confirmElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('уверены') || 
             element?.textContent?.includes('tiešām')
    })
    expect(confirmElements.length).toBeGreaterThan(0)
  })

  it('should display tournament information correctly', async () => {
    googleSheets.loadTournamentsList.mockResolvedValueOnce([mockTournament])

    renderWithProvider(
      <DeleteTournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        tournament={mockTournament}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    // Check dates are present
    const startDateElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Дата начала') || 
             element?.textContent?.includes('Sākuma datums')
    })
    expect(startDateElements.length).toBeGreaterThan(0)

    const endDateElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Дата окончания') || 
             element?.textContent?.includes('Beigu datums')
    })
    expect(endDateElements.length).toBeGreaterThan(0)
    
    // Check teams are present
    const teamsElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Команды') || 
             element?.textContent?.includes('Komandas')
    })
    expect(teamsElements.length).toBeGreaterThan(0)
  })

  it('should call onClose when cancel button is clicked', async () => {
    const onClose = vi.fn()
    googleSheets.loadTournamentsList.mockResolvedValueOnce([mockTournament])

    renderWithProvider(
      <DeleteTournamentModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        tournament={mockTournament}
      />
    )

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
    cancelButton.click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm when delete button is clicked', async () => {
    const onConfirm = vi.fn()
    googleSheets.loadTournamentsList.mockResolvedValueOnce([mockTournament])

    renderWithProvider(
      <DeleteTournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        tournament={mockTournament}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Удалить турнир') || 
             element?.textContent?.includes('Dzēst turnīru')
    })
    const deleteButton = deleteButtons.find(btn => btn.tagName === 'BUTTON') || deleteButtons[0]
    deleteButton.click()
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when overlay is clicked', async () => {
    const onClose = vi.fn()
    googleSheets.loadTournamentsList.mockResolvedValueOnce([mockTournament])

    const { container } = renderWithProvider(
      <DeleteTournamentModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        tournament={mockTournament}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    const overlay = container.querySelector('.modal-overlay')
    overlay.click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should handle tournament without dates', async () => {
    const tournamentWithoutDates = {
      ...mockTournament,
      startDate: null,
      endDate: null
    }
    googleSheets.loadTournamentsList.mockResolvedValueOnce([tournamentWithoutDates])

    renderWithProvider(
      <DeleteTournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        tournament={tournamentWithoutDates}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    // Dates should not be displayed
    const startDateElements = screen.queryAllByText((content, element) => {
      return element?.textContent?.includes('Дата начала') || 
             element?.textContent?.includes('Sākuma datums')
    })
    expect(startDateElements.length).toBe(0)
  })

  it('should handle tournament without teams', async () => {
    const tournamentWithoutTeams = {
      ...mockTournament,
      teams: []
    }
    googleSheets.loadTournamentsList.mockResolvedValueOnce([tournamentWithoutTeams])

    renderWithProvider(
      <DeleteTournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        tournament={tournamentWithoutTeams}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    })

    // Teams should not be displayed
    const teamsElements = screen.queryAllByText((content, element) => {
      return element?.textContent?.includes('Команды') || 
             element?.textContent?.includes('Komandas')
    })
    expect(teamsElements.length).toBe(0)
  })
})
