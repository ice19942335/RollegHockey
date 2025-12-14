import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NavItem from '../NavItem'

describe('NavItem', () => {
  it('should render children text', () => {
    render(<NavItem>Test Menu Item</NavItem>)
    expect(screen.getByText('Test Menu Item')).toBeInTheDocument()
  })

  it('should render as a button', () => {
    render(<NavItem>Test Menu Item</NavItem>)
    const button = screen.getByRole('button', { name: 'Test Menu Item' })
    expect(button).toBeInTheDocument()
  })

  it('should have nav-item class', () => {
    render(<NavItem>Test Menu Item</NavItem>)
    const button = screen.getByRole('button', { name: 'Test Menu Item' })
    expect(button).toHaveClass('nav-item')
  })

  it('should not have nav-item-danger class by default', () => {
    render(<NavItem>Test Menu Item</NavItem>)
    const button = screen.getByRole('button', { name: 'Test Menu Item' })
    expect(button).not.toHaveClass('nav-item-danger')
  })

  it('should have nav-item-danger class when isDanger is true', () => {
    render(<NavItem isDanger={true}>Danger Item</NavItem>)
    const button = screen.getByRole('button', { name: 'Danger Item' })
    expect(button).toHaveClass('nav-item-danger')
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<NavItem onClick={handleClick}>Test Menu Item</NavItem>)
    
    const button = screen.getByRole('button', { name: 'Test Menu Item' })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should pass event to onClick handler', () => {
    const handleClick = vi.fn()
    render(<NavItem onClick={handleClick}>Test Menu Item</NavItem>)
    
    const button = screen.getByRole('button', { name: 'Test Menu Item' })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledWith(expect.any(Object))
  })

  it('should render with complex children', () => {
    render(
      <NavItem>
        <span>Icon</span> Menu Text
      </NavItem>
    )
    expect(screen.getByText('Icon')).toBeInTheDocument()
    expect(screen.getByText('Menu Text')).toBeInTheDocument()
  })
})

