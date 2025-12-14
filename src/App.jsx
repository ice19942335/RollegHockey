import { Routes, Route } from 'react-router-dom'
import './App.css'
import Navigation from './components/Navigation'
import Header from './components/Header'
import TournamentList from './components/TournamentList'
import CreateTournament from './components/CreateTournament'
import TournamentView from './pages/TournamentView'

function App() {
  return (
    <div className="app">
      <Navigation />
      <Routes>
        <Route path="/" element={
          <>
            <Header />
            <TournamentList />
          </>
        } />
        <Route path="/create" element={
          <>
            <Header />
            <CreateTournament />
          </>
        } />
        <Route path="/t/:id" element={<TournamentView />} />
      </Routes>
    </div>
  )
}

export default App
