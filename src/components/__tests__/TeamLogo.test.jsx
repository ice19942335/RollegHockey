import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TeamLogo from '../TeamLogo'

describe('TeamLogo', () => {
  it('should render emoji logo when logo is an emoji', () => {
    render(<TeamLogo logo="🏒" name="Test Team" />)
    const logoElement = screen.getByText('🏒')
    expect(logoElement).toBeInTheDocument()
  })

  it('should render default emoji when logo is empty', () => {
    render(<TeamLogo logo="" name="Test Team" />)
    const logoElement = screen.getByText('🏒')
    expect(logoElement).toBeInTheDocument()
  })

  it('should render image when logo is a URL', () => {
    const logoUrl = 'https://example.com/logo.png'
    render(<TeamLogo logo={logoUrl} name="Test Team" />)
    const imageElement = screen.getByAltText('Test Team')
    expect(imageElement).toBeInTheDocument()
    expect(imageElement).toHaveAttribute('src', logoUrl)
  })

  it('should render correctly with different sizes', () => {
    const { rerender } = render(<TeamLogo logo="🏒" name="Test Team" size="small" />)
    expect(screen.getByText('🏒')).toBeInTheDocument()
    
    rerender(<TeamLogo logo="🏒" name="Test Team" size="normal" />)
    expect(screen.getByText('🏒')).toBeInTheDocument()
    
    rerender(<TeamLogo logo="🏒" name="Test Team" />)
    expect(screen.getByText('🏒')).toBeInTheDocument()
  })
})

