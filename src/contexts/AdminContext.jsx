import { createContext, useContext, useState, useEffect } from 'react'

const AdminContext = createContext()

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}

export const AdminProvider = ({ children }) => {
  const [isAdminEnabled, setIsAdminEnabled] = useState(() => {
    // Загружаем состояние из localStorage
    const saved = localStorage.getItem('adminEnabled')
    return saved === 'true'
  })

  // Сохраняем состояние в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('adminEnabled', isAdminEnabled.toString())
  }, [isAdminEnabled])

  const enableAdmin = () => {
    setIsAdminEnabled(true)
  }

  const disableAdmin = () => {
    setIsAdminEnabled(false)
    localStorage.removeItem('adminEnabled')
  }

  return (
    <AdminContext.Provider value={{ isAdminEnabled, enableAdmin, disableAdmin }}>
      {children}
    </AdminContext.Provider>
  )
}
