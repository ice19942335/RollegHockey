import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})

