import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import DeletingTournamentModal from '../DeletingTournamentModal'
import { LanguageProvider } from '../../i18n/LanguageContext'

const renderWithProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  )
}

describe('DeletingTournamentModal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not render when isOpen is false', () => {
    const { container } = renderWithProvider(
      <DeletingTournamentModal
        isOpen={false}
        error={null}
        onClose={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render loading state when isOpen is true and no error', () => {
    renderWithProvider(
      <DeletingTournamentModal
        isOpen={true}
        error={null}
        onClose={vi.fn()}
      />
    )

    const elements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Удаление турнира') || 
             element?.textContent?.includes('Turnīra dzēšana')
    })
    expect(elements.length).toBeGreaterThan(0)

    const messageElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Идет удаление') || 
             element?.textContent?.includes('Notiek turnīra dzēšana')
    })
    expect(messageElements.length).toBeGreaterThan(0)
  })

  it('should display elapsed time counter', () => {
    renderWithProvider(
      <DeletingTournamentModal
        isOpen={true}
        error={null}
        onClose={vi.fn()}
      />
    )

    // Check that timer element exists
    const timerElements = screen.getAllByText((content, element) => {
      const text = element?.textContent || ''
      return /\d+ сек/.test(text) || /\d+ sek/.test(text) || 
             text.includes('Прошло') || text.includes('Pagājis')
    })
    expect(timerElements.length).toBeGreaterThan(0)

    // Advance time by 5 seconds
    vi.advanceTimersByTime(5000)

    // Check that timer is still working
    const elapsedElements = screen.getAllByText((content, element) => {
      const text = element?.textContent || ''
      return /\d+ сек/.test(text) || /\d+ sek/.test(text) || 
             text.includes('Прошло') || text.includes('Pagājis')
    })
    expect(elapsedElements.length).toBeGreaterThan(0)
  })

  it('should show spinner during deletion', () => {
    const { container } = renderWithProvider(
      <DeletingTournamentModal
        isOpen={true}
        error={null}
        onClose={vi.fn()}
      />
    )

    const spinner = container.querySelector('.spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('should display error message when error is provided', () => {
    const errorMessage = 'Failed to delete tournament'
    
    renderWithProvider(
      <DeletingTournamentModal
        isOpen={true}
        error={errorMessage}
        onClose={vi.fn()}
      />
    )

    const errorTitleElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Ошибка при удалении') || 
             element?.textContent?.includes('Kļūda, dzēšot turnīru')
    })
    expect(errorTitleElements.length).toBeGreaterThan(0)
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    
    const adminMessageElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('свяжитесь с администратором') || 
             element?.textContent?.includes('sazinieties ar administratoru')
    })
    expect(adminMessageElements.length).toBeGreaterThan(0)
  })

  it('should show close button when error is present', () => {
    renderWithProvider(
      <DeletingTournamentModal
        isOpen={true}
        error="Test error"
        onClose={vi.fn()}
      />
    )

    const closeButtons = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Закрыть') || 
             element?.textContent?.includes('Aizvērt')
    })
    expect(closeButtons.length).toBeGreaterThan(0)
  })

  it('should not show close button when no error', () => {
    renderWithProvider(
      <DeletingTournamentModal
        isOpen={true}
        error={null}
        onClose={vi.fn()}
      />
    )

    const closeButtons = screen.queryAllByText((content, element) => {
      return element?.textContent?.includes('Закрыть') || 
             element?.textContent?.includes('Aizvērt')
    })
    expect(closeButtons.length).toBe(0)
  })

  it('should call onClose when close button is clicked in error state', () => {
    const onClose = vi.fn()
    
    renderWithProvider(
      <DeletingTournamentModal
        isOpen={true}
        error="Test error"
        onClose={onClose}
      />
    )

    const closeButtons = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('Закрыть') || 
             element?.textContent?.includes('Aizvērt')
    })
    const closeButton = closeButtons.find(btn => btn.tagName === 'BUTTON') || closeButtons[0]
    closeButton.click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should have blocking overlay class', () => {
    const { container } = renderWithProvider(
      <DeletingTournamentModal
        isOpen={true}
        error={null}
        onClose={vi.fn()}
      />
    )

    const overlay = container.querySelector('.deleting-tournament-overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveClass('modal-overlay')
  })
})
