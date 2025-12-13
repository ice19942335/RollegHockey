import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StandingsTable from '../StandingsTable'
import { LanguageProvider } from '../../i18n/LanguageContext'

const mockTeams = [
  { id: '1', name: 'Team 1', logo: '🏒', color: '#1e3c72' },
  { id: '2', name: 'Team 2', logo: '🥅', color: '#c62828' }
]

const mockGames = [
  {
    id: '1',
    homeTeamId: '1',
    awayTeamId: '2',
    homeScore: 3,
    awayScore: 2,
    gameType: 'regular',
    date: '01.01.2025'
  }
]

const renderWithProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  )
}

describe('StandingsTable', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should render nothing when teams array is empty', () => {
    const { container } = renderWithProvider(
      <StandingsTable teams={[]} games={[]} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render standings table with teams', () => {
    renderWithProvider(
      <StandingsTable teams={mockTeams} games={mockGames} />
    )
    
    expect(screen.getByText('Team 1')).toBeInTheDocument()
    expect(screen.getByText('Team 2')).toBeInTheDocument()
  })

  it('should display correct position numbers', () => {
    renderWithProvider(
      <StandingsTable teams={mockTeams} games={mockGames} />
    )
    
    // Check that position class exists and has correct values
    const positionCells = document.querySelectorAll('.position')
    expect(positionCells.length).toBe(2)
    expect(positionCells[0]).toHaveTextContent('1')
    expect(positionCells[1]).toHaveTextContent('2')
  })

  it('should display team statistics', () => {
    renderWithProvider(
      <StandingsTable teams={mockTeams} games={mockGames} />
    )
    
    // Team 1 should have 1 game played, 1 win, 3 points
    const team1Row = screen.getByText('Team 1').closest('tr')
    expect(team1Row).toBeInTheDocument()
    expect(team1Row).toHaveTextContent('1') // games played
    expect(team1Row).toHaveTextContent('3') // points
  })

  it('should display legend section', () => {
    renderWithProvider(
      <StandingsTable teams={mockTeams} games={mockGames} />
    )
    
    const legend = screen.getByText(/Легенда|Legend/i)
    expect(legend).toBeInTheDocument()
  })

  it('should display scoring system section', () => {
    renderWithProvider(
      <StandingsTable teams={mockTeams} games={mockGames} />
    )
    
    const scoringSystem = screen.getByText(/Система очков|Punktu sistēma/i)
    expect(scoringSystem).toBeInTheDocument()
  })

  it('should render team logos', () => {
    renderWithProvider(
      <StandingsTable teams={mockTeams} games={mockGames} />
    )
    
    expect(screen.getByText('🏒')).toBeInTheDocument()
    expect(screen.getByText('🥅')).toBeInTheDocument()
  })

  it('should display goal difference with correct sign', () => {
    renderWithProvider(
      <StandingsTable teams={mockTeams} games={mockGames} />
    )
    
    // Team 1: 3 goals for, 2 goals against = +1
    const team1Row = screen.getByText('Team 1').closest('tr')
    expect(team1Row).toHaveTextContent('+1')
  })
})

