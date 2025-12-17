import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateStandings } from '../utils/calculateStats'
import TeamLogo from './TeamLogo'
import { useLanguage } from '../i18n/LanguageContext'

function StandingsTable({ teams, games, tournamentName }) {
  const { t } = useLanguage()
  const [isLegendExpanded, setIsLegendExpanded] = useState(false)
  const [isScoringSystemExpanded, setIsScoringSystemExpanded] = useState(false)
  const [isWideInfoLayout, setIsWideInfoLayout] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const exportCounterRef = useRef(0)
  const legendContainerRef = useRef(null)
  const standings = useMemo(() => {
    return calculateStandings(teams, games)
  }, [teams, games])

  if (standings.length === 0) return null

  // Detect when legend + scoring are side-by-side (same row).
  // This is more reliable than matchMedia if CSS breakpoints ever change.
  useEffect(() => {
    const container = legendContainerRef.current
    if (!container) return

    const apply = () => {
      const legend = container.querySelector('.legend-wrapper')
      const scoring = container.querySelector('.scoring-system-wrapper')
      if (!legend || !scoring) return
      setIsWideInfoLayout(legend.offsetTop === scoring.offsetTop)
    }

    apply()
    window.addEventListener('resize', apply)

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null
    if (ro) ro.observe(container)

    return () => {
      window.removeEventListener('resize', apply)
      ro?.disconnect()
    }
  }, [])

  // If we are in wide layout and states got out of sync (or only one was opened),
  // force both to the same value so BOTH contents show/hide together.
  useEffect(() => {
    if (!isWideInfoLayout) return
    if (isLegendExpanded === isScoringSystemExpanded) return
    const next = isLegendExpanded || isScoringSystemExpanded
    setIsLegendExpanded(next)
    setIsScoringSystemExpanded(next)
  }, [isWideInfoLayout, isLegendExpanded, isScoringSystemExpanded])

  const toggleLegend = () => {
    if (isWideInfoLayout) {
      const next = !(isLegendExpanded || isScoringSystemExpanded)
      setIsLegendExpanded(next)
      setIsScoringSystemExpanded(next)
      return
    }
    setIsLegendExpanded(prev => !prev)
  }

  const toggleScoringSystem = () => {
    if (isWideInfoLayout) {
      const next = !(isLegendExpanded || isScoringSystemExpanded)
      setIsLegendExpanded(next)
      setIsScoringSystemExpanded(next)
      return
    }
    setIsScoringSystemExpanded(prev => !prev)
  }

  const handleExportPdf = async () => {
    const exportRoot = document.querySelector('.pdf-export-root')
    if (!exportRoot) return
    setIsExportingPdf(true)
    try {
      // Даем React/браузеру отрисовать спиннер перед тяжёлой работой
      await new Promise(resolve =>
        (typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(resolve) : setTimeout(resolve, 0))
      )

      document.body.classList.add('pdf-exporting')
      const [{ default: html2canvas }, jspdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ])

      const jsPDF = jspdfModule.jsPDF || jspdfModule.default
      const canvas = await html2canvas(exportRoot, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 24

      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let y = margin
      let remaining = imgHeight

      // Рисуем одним большим изображением с переносом по страницам
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
        remaining -= (pageHeight - margin * 2)
        if (remaining > 0) {
          pdf.addPage()
          y = margin - (imgHeight - remaining)
        }
      }

      exportCounterRef.current += 1
      const exportNumber = exportCounterRef.current

      const uniqueId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

      const safeTournamentName = (tournamentName || 'tournament')
        .toString()
        .normalize('NFKD')
        .replace(/[\\\/:*?"<>|]+/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60) || 'tournament'

      pdf.save(`${safeTournamentName}_${exportNumber}_${uniqueId}.pdf`)
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      document.body.classList.remove('pdf-exporting')
      setIsExportingPdf(false)
    }
  }

  return (
    <section className="section standings-section">
      <div className="standings-header">
        <h2>{t('standingsTitle')}</h2>
        <button
          type="button"
          className={`btn-export-pdf ${isExportingPdf ? 'btn-loading' : ''}`}
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          title={t('exportStandingsPdfTitle')}
        >
          {isExportingPdf && <span className="btn-spinner"></span>}
          {t('exportStandingsPdf')}
        </button>
      </div>
      <div className="standings-table-wrapper">
        <table className="standings-table">
          <thead>
            <tr>
              <th></th>
              <th>{t('teamColumn')}</th>
              <th>{t('pointsColumn')}</th>
              <th>{t('gamesColumn')}</th>
              <th>{t('winsRegularColumn')}</th>
              <th>{t('winsShootoutColumn')}</th>
              <th>{t('lossesRegularColumn')}</th>
              <th>{t('lossesShootoutColumn')}</th>
              <th>{t('drawsColumn')}</th>
              <th>{t('goalsForColumn')}</th>
              <th>{t('goalsAgainstColumn')}</th>
              <th>{t('goalDiffColumn')}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr key={team.id}>
                <td className="position">{index + 1}</td>
                <td className="team-cell">
                  <span 
                    className="team-color-bar"
                    style={{ backgroundColor: team.color || '#1e3c72' }}
                  />
                  <span className="team-logo-small">
                    <TeamLogo logo={team.logo} name={team.name} size="small" />
                  </span>
                  {team.name}
                </td>
                <td className="points">{team.points}</td>
                <td>{team.gamesPlayed}</td>
                <td>{team.wins}</td>
                <td>{team.winsOT}</td>
                <td>{team.losses}</td>
                <td>{team.lossesOT}</td>
                <td>{team.draws || 0}</td>
                <td>{team.goalsFor}</td>
                <td>{team.goalsAgainst}</td>
                <td className={team.goalDifference >= 0 ? 'positive' : 'negative'}>
                  {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend-container" ref={legendContainerRef}>
        <div className="legend-wrapper">
          <div 
            className="section-header-collapsible"
            onClick={toggleLegend}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <p><strong>{t('legend')}</strong></p>
            <span className={`collapse-icon ${isLegendExpanded ? 'expanded' : 'collapsed'}`}>
              ▼
            </span>
          </div>
          <div className={`section-collapsible-content ${isLegendExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="legend">
              <ul>
                <li>{t('legendPoints')}</li>
                <li>{t('legendGames')}</li>
                <li>{t('legendWinsRegular')}</li>
                <li>{t('legendWinsShootout')}</li>
                <li>{t('legendLossesRegular')}</li>
                <li>{t('legendLossesShootout')}</li>
                <li>{t('legendDraws')}</li>
                <li>{t('legendGoalsFor')}</li>
                <li>{t('legendGoalsAgainst')}</li>
                <li>{t('legendGoalDiff')}</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="scoring-system-wrapper">
          <div 
            className="section-header-collapsible"
            onClick={toggleScoringSystem}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <p><strong>{t('scoringSystem')}</strong></p>
            <span className={`collapse-icon ${isScoringSystemExpanded ? 'expanded' : 'collapsed'}`}>
              ▼
            </span>
          </div>
          <div className={`section-collapsible-content ${isScoringSystemExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="scoring-system">
              <ul>
                <li>{t('scoringWinRegular')}</li>
                <li>{t('scoringWinShootout')}</li>
                <li>{t('scoringDrawRegular')}</li>
                <li>{t('scoringDrawShootout')}</li>
                <li>{t('scoringLoss')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default StandingsTable

