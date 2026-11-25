import { useState } from 'react';
import ScenarioCard from '@/components/command/ScenarioCard';
import { Save } from 'lucide-react';

const STORAGE_KEY = 'prioritypulse_scenarios';

function loadScenarios() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function ScenarioLibrary({ sim }) {
  const [scenarios, setScenarios] = useState(loadScenarios);
  const [name, setName] = useState('Ambulance scenario');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [deleted, setDeleted] = useState(null);

  const payload = (s) => ({
    name: s.name,
    network: s.network,
    settings: s.settings,
    origin: s.origin,
    destination: s.destination,
  });

  function persist(next, message) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setScenarios(next);
      setError('');
      setStatus(message);
    } catch {
      setError('Could not save to browser storage. Your current draft is unchanged.');
    }
  }

  function save() {
    const entry = { id: crypto.randomUUID(), updated_date: new Date().toISOString(), name: name.trim(), ...sim.draft };
    persist([entry, ...scenarios], 'Scenario saved to this browser.');
  }

  function remove(s) {
    setDeleted(payload(s));
    persist(
      scenarios.filter((item) => item.id !== s.id),
      `Deleted “${s.name}”. Use Restore scenario to recover it before leaving this screen.`
    );
  }

  function restore() {
    const entry = { id: crypto.randomUUID(), updated_date: new Date().toISOString(), ...deleted };
    setDeleted(null);
    persist([entry, ...scenarios], 'Scenario restored.');
  }

  function duplicate(s) {
    const entry = { id: crypto.randomUUID(), updated_date: new Date().toISOString(), ...payload(s), name: `${s.name} (copy)` };
    persist([entry, ...scenarios], 'Scenario duplicated. The original is unchanged.');
  }

  function open(s) {
    sim.edit({ network: s.network, settings: s.settings, origin: s.origin, destination: s.destination });
    sim.setSelection(null);
    sim.setTab('Command center');
    sim.setMessage(`Opened ${s.name}. Dispatch to replay with the saved seed.`);
  }

  return (
    <div className="cc-library">
      <div className="cc-section-header">
        <div>
          <span className="cc-eyebrow">SAVED CONFIGURATIONS</span>
          <h2>My scenarios</h2>
          <p className="cc-muted">Save a network and its traffic settings to run again later.</p>
        </div>
      </div>
      <form className="cc-card cc-library-save" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label htmlFor="scenario-name">SAVE CURRENT CONFIGURATION</label>
        <div>
          <input id="scenario-name" required maxLength="100" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="cc-primary" disabled={!name.trim()}>
            <Save size={15} /> Save scenario
          </button>
        </div>
        {error && <p role="alert" className="cc-error">{error}</p>}
      </form>
      {status && <p role="status" className="cc-muted mt-3">{status}</p>}
      {deleted && (
        <div className="cc-notice mt-3">
          <span>“{deleted.name}” can still be restored here.</span>
          <button className="cc-button" onClick={restore}>Restore scenario</button>
        </div>
      )}
      {scenarios.length === 0 ? (
        <p className="cc-muted">No saved scenarios yet. Save the current network to begin.</p>
      ) : (
        <div className="cc-library-grid">
          {scenarios.map((s) => (
            <ScenarioCard key={s.id} scenario={s} busy={false} onOpen={open} onDelete={remove} onDuplicate={duplicate} />
          ))}
        </div>
      )}
    </div>
  );
}
