import { useState, useEffect, useRef } from 'react';

export default function usePlaceSearch(query, center) {
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const generation = useRef(0);

  useEffect(() => {
    generation.current++;
    setResults([]);
    setError('');
    setSearched(false);
  }, [query]);

  useEffect(() => () => { generation.current++; }, []);

  async function search() {
    if (busy) return;
    if (query.trim().length < 3) {
      setError('Enter at least 3 characters. Include a city to find a street outside this network.');
      return;
    }
    const token = ++generation.current;
    setBusy(true);
    setError('');
    setResults([]);
    setSearched(false);
    try {
      const response = await fetch('/api/loadRoadNetwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: query.trim(), lat: center[0], lng: center[1] }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Place search failed.');
      if (token === generation.current) {
        setResults(data.results || []);
        setSearched(true);
      }
    } catch (e) {
      if (token === generation.current) setError(e.message || 'Place search failed.');
    } finally {
      setBusy(false);
    }
  }

  return { results, busy, error, searched, search };
}
