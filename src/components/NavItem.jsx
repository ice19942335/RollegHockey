function NavItem({ children, onClick, isDanger = false }) {
  return (
    <button 
      className={`nav-item ${isDanger ? 'nav-item-danger' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default NavItem

