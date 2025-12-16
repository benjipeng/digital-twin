
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Gallery } from './components/Gallery';
import { CityPulse } from './components/CityPulse';
import './index.css';

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main>
        <Hero />
        <Gallery />
      </main>

      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--color-glass-border)',
        marginTop: 'auto',
        color: 'var(--color-text-muted)',
        fontSize: '0.9rem'
      }}>
        <p>&copy; {new Date().getFullYear()} NEXUSTWIN Protocol. Built on Solana.</p>
      </footer>

      <CityPulse />
    </div>
  );
}

export default App;
