
import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Gallery } from './components/Gallery';
import { CityPulse } from './components/CityPulse';
import { useTelemetry } from './services/telemetry';
import './index.css';

function App() {
  const [performanceMode, setPerformanceMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('performanceMode') === 'true';
  });
  const telemetry = useTelemetry();

  useEffect(() => {
    try {
      localStorage.setItem('performanceMode', String(performanceMode));
    } catch {
      // Ignore storage errors (private mode, etc.)
    }
  }, [performanceMode]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        performanceMode={performanceMode}
        onTogglePerformance={() => setPerformanceMode((prev) => !prev)}
      />

      <main>
        <Hero />
        <Gallery
          performanceMode={performanceMode}
          validators={telemetry.validators}
          tps={telemetry.tps}
          energy={telemetry.energy}
          clusterIps={telemetry.clusterIps}
          clusterMeta={telemetry.clusterMeta}
          loadingCluster={telemetry.loadingCluster}
          refreshClusterNodes={telemetry.refreshClusterNodes}
        />
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

      <CityPulse stats={telemetry.chainStats} />
    </div>
  );
}

export default App;
