function TeamLogo({ logo, name, size = 'normal' }) {
  const logoClass = size === 'small' ? 'team-logo-small' : 'team-logo'
  
  const handleImageError = (e) => {
    e.target.style.display = 'none'
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = size === 'small' ? 'inline' : 'block'
    }
  }

  if (logo.startsWith('http')) {
    return (
      <>
        <img src={logo} alt={name} onError={handleImageError} />
        <span style={{display: 'none'}}>🏒</span>
      </>
    )
  }
  
  return <span>{logo || '🏒'}</span>
}

export default TeamLogo

