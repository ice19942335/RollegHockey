import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Header from '../Header'
import { LanguageProvider } from '../../i18n/LanguageContext'

const renderWithProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  )
}

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should render company name', () => {
    renderWithProvider(<Header />)
    expect(screen.getByText('ROLLEG')).toBeInTheDocument()
  })

  it('should render header title', () => {
    renderWithProvider(<Header />)
    const title = screen.getByText(/Турнирная таблица|Hokeja turnīra tabula/i)
    expect(title).toBeInTheDocument()
  })

  it('should render header subtitle', () => {
    renderWithProvider(<Header />)
    const subtitle = screen.getByText(/Управление командами|Komandu, spēļu/i)
    expect(subtitle).toBeInTheDocument()
  })

  it('should render language selector button', () => {
    renderWithProvider(<Header />)
    const languageButton = screen.getByRole('button', { name: /Выбрать язык/i })
    expect(languageButton).toBeInTheDocument()
  })

  it('should display current language flag', () => {
    renderWithProvider(<Header />)
    // Default language is Russian, so Russian flag should be visible
    expect(screen.getByText('🇷🇺')).toBeInTheDocument()
  })

  it('should open language dropdown when button is clicked', async () => {
    renderWithProvider(<Header />)
    const languageButton = screen.getByRole('button', { name: /Выбрать язык/i })
    
    fireEvent.click(languageButton)
    
    await waitFor(() => {
      expect(screen.getByText('🇱🇻')).toBeInTheDocument()
    })
  })

  it('should change language when language option is clicked', async () => {
    renderWithProvider(<Header />)
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
    renderWithProvider(<Header />)
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
})

