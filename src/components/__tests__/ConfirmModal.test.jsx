import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmModal from '../ConfirmModal'
import { LanguageProvider } from '../../i18n/LanguageContext'

const renderWithProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  )
}

describe('ConfirmModal', () => {
  it('should not render when isOpen is false', () => {
    const { container } = renderWithProvider(
      <ConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test Title"
        message="Test Message"
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render when isOpen is true', () => {
    renderWithProvider(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test Title"
        message="Test Message"
      />
    )
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Message')).toBeInTheDocument()
  })

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn()
    renderWithProvider(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Test Title"
        message="Test Message"
      />
    )
    
    const cancelButton = screen.getByText(/Отмена|Atcelt/i)
    fireEvent.click(cancelButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn()
    renderWithProvider(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Test Title"
        message="Test Message"
      />
    )
    
    const confirmButton = screen.getByText(/Подтвердить|Apstiprināt/i)
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    const { container } = renderWithProvider(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Test Title"
        message="Test Message"
      />
    )
    
    const overlay = container.querySelector('.modal-overlay')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not call onClose when modal content is clicked', () => {
    const onClose = vi.fn()
    const { container } = renderWithProvider(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Test Title"
        message="Test Message"
      />
    )
    
    const modalContent = container.querySelector('.modal-content')
    fireEvent.click(modalContent)
    expect(onClose).not.toHaveBeenCalled()
  })
})

