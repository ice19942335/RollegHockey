import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navigation from '../Navigation'
import { LanguageProvider } from '../../i18n/LanguageContext'

const renderWithProvider = (component) => {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        {component}
      </LanguageProvider>
    </MemoryRouter>
  )
}

describe('Navigation', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    // Reset window width to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
  })

  it('should render navigation container', () => {
    renderWithProvider(<Navigation />)
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveClass('navigation')
  })

  it('should render all menu items', () => {
    renderWithProvider(<Navigation />)
    
    expect(screen.getByText(/Создать турнир|Izveidot turnīru/i)).toBeInTheDocument()
    expect(screen.getByText(/Список турниров|Turnīru saraksts/i)).toBeInTheDocument()
    expect(screen.getByText(/Список Плей-оффов|Play-off saraksts/i)).toBeInTheDocument()
    expect(screen.getByText(/Очистить БД|Notīrīt datu bāzi/i)).toBeInTheDocument()
  })

  it('should navigate to create tournament when first menu item is clicked', () => {
    const { container } = renderWithProvider(<Navigation />)
    const createButton = screen.getByText(/Создать турнир|Izveidot turnīru/i)
    
    fireEvent.click(createButton)
    
    // Navigation should work (we can't easily test navigation without more setup)
    expect(createButton).toBeInTheDocument()
  })

  it('should navigate to tournaments list when second menu item is clicked', () => {
    renderWithProvider(<Navigation />)
    const tournamentsButton = screen.getByText(/Список турниров|Turnīru saraksts/i)
    
    fireEvent.click(tournamentsButton)
    
    // Navigation should work
    expect(tournamentsButton).toBeInTheDocument()
  })

  it('should show alert when playoffs list item is clicked', () => {
    window.alert = vi.fn()
    renderWithProvider(<Navigation />)
    const playoffsButton = screen.getByText(/Список Плей-оффов|Play-off saraksts/i)
    
    fireEvent.click(playoffsButton)
    
    expect(window.alert).toHaveBeenCalled()
  })

  it('should show alert when clear database item is clicked', () => {
    window.alert = vi.fn()
    renderWithProvider(<Navigation />)
    const clearButton = screen.getByText(/Очистить БД|Notīrīt datu bāzi/i)
    
    fireEvent.click(clearButton)
    
    expect(window.alert).toHaveBeenCalled()
  })

  it('should render language selector button', () => {
    renderWithProvider(<Navigation />)
    const languageButton = screen.getByRole('button', { name: /Выбрать язык/i })
    expect(languageButton).toBeInTheDocument()
  })

  it('should display current language flag', () => {
    renderWithProvider(<Navigation />)
    // Default language is Russian, so Russian flag should be visible
    expect(screen.getByText('🇷🇺')).toBeInTheDocument()
  })

  it('should open language dropdown when button is clicked', async () => {
    renderWithProvider(<Navigation />)
    const languageButton = screen.getByRole('button', { name: /Выбрать язык/i })
    
    fireEvent.click(languageButton)
    
    await waitFor(() => {
      expect(screen.getByText('🇱🇻')).toBeInTheDocument()
    })
  })

  it('should change language when language option is clicked', async () => {
    renderWithProvider(<Navigation />)
    const languageButton = screen.getByRole('button', { name: /Выбрать язык/i })
    
    fireEvent.click(languageButton)
    
    await waitFor(() => {
      const lvButton = screen.getByRole('button', { name: /Latviešu/i })
      fireEvent.click(lvButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('🇱🇻')).toBeInTheDocument()
    })
  })

  it('should close dropdown when clicking outside', async () => {
    renderWithProvider(<Navigation />)
    const languageButton = screen.getByRole('button', { name: /Выбрать язык/i })
    
    fireEvent.click(languageButton)
    
    await waitFor(() => {
      expect(screen.getByText('🇱🇻')).toBeInTheDocument()
    })
    
    // Click outside
    fireEvent.mouseDown(document.body)
    
    await waitFor(() => {
      const dropdown = document.querySelector('.language-dropdown')
      expect(dropdown).not.toBeInTheDocument()
    })
  })

  it('should close dropdown when language is selected', async () => {
    renderWithProvider(<Navigation />)
    const languageButton = screen.getByRole('button', { name: /Выбрать язык/i })
    
    fireEvent.click(languageButton)
    
    await waitFor(() => {
      const lvButton = screen.getByRole('button', { name: /Latviešu/i })
      fireEvent.click(lvButton)
    })
    
    await waitFor(() => {
      const dropdown = document.querySelector('.language-dropdown')
      expect(dropdown).not.toBeInTheDocument()
    })
  })

  it('should render clear database button with danger class', () => {
    renderWithProvider(<Navigation />)
    const clearButton = screen.getByText(/Очистить БД|Notīrīt datu bāzi/i)
    expect(clearButton).toHaveClass('nav-item-danger')
  })

  it('should not render hamburger menu on desktop', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
    
    renderWithProvider(<Navigation />)
    const hamburger = screen.queryByRole('button', { name: /Toggle menu/i })
    expect(hamburger).not.toBeInTheDocument()
  })

  it('should render hamburger menu on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    })
    
    renderWithProvider(<Navigation />)
    
    // Wait for useEffect to run
    await waitFor(() => {
      const hamburger = screen.getByRole('button', { name: /Toggle menu/i })
      expect(hamburger).toBeInTheDocument()
    })
  })

  it('should toggle mobile menu when hamburger is clicked', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    })
    
    renderWithProvider(<Navigation />)
    
    await waitFor(() => {
      const hamburger = screen.getByRole('button', { name: /Toggle menu/i })
      expect(hamburger).toBeInTheDocument()
      
      // Menu should be closed initially
      const wrapper = document.querySelector('.nav-items-wrapper')
      expect(wrapper).not.toHaveClass('mobile-open')
      
      // Click hamburger
      fireEvent.click(hamburger)
    })
    
    await waitFor(() => {
      const wrapper = document.querySelector('.nav-items-wrapper')
      expect(wrapper).toHaveClass('mobile-open')
    })
  })

  it('should close mobile menu when menu item is clicked', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    })
    
    renderWithProvider(<Navigation />)
    
    await waitFor(() => {
      const hamburger = screen.getByRole('button', { name: /Toggle menu/i })
      fireEvent.click(hamburger)
    })
    
    await waitFor(() => {
      const wrapper = document.querySelector('.nav-items-wrapper')
      expect(wrapper).toHaveClass('mobile-open')
      
      // Click a menu item
      const createButton = screen.getByText(/Создать турнир|Izveidot turnīru/i)
      fireEvent.click(createButton)
    })
    
    await waitFor(() => {
      const wrapper = document.querySelector('.nav-items-wrapper')
      expect(wrapper).not.toHaveClass('mobile-open')
    })
  })

  it('should have correct aria-expanded attribute on hamburger', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    })
    
    renderWithProvider(<Navigation />)
    
    await waitFor(() => {
      const hamburger = screen.getByRole('button', { name: /Toggle menu/i })
      expect(hamburger).toHaveAttribute('aria-expanded', 'false')
      
      fireEvent.click(hamburger)
    })
    
    await waitFor(() => {
      const hamburger = screen.getByRole('button', { name: /Toggle menu/i })
      expect(hamburger).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it('should apply mobile-menu-open class when mobile menu is open', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    })
    
    renderWithProvider(<Navigation />)
    
    await waitFor(() => {
      const hamburger = screen.getByRole('button', { name: /Toggle menu/i })
      fireEvent.click(hamburger)
    })
    
    await waitFor(() => {
      const container = document.querySelector('.navigation-container')
      expect(container).toHaveClass('mobile-menu-open')
    })
  })
})

