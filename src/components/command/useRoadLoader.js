export default function useRoadLoader(sim) {
  return async function loadRoads(center, name, options = {}) {
    if (sim.loading) return null;
    sim.setLoading(true);
    sim.setPlaying(false);
    sim.setMessage('Loading real street geometry and connected intersections…');
    try {
      const response = await fetch('/api/loadRoadNetwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: center[0], lng: center[1], name, ...options }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Road data endpoint unavailable.');
      if (!data.network?.nodes?.length || !data.network?.roads?.length) {
        throw new Error('No connected streets returned for this location. Try a nearby map center.');
      }
      sim.load(data.network);
      sim.setMessage(data.note);
      return data.network;
    } catch (error) {
      sim.setMessage(`${error.message || 'Road data could not be loaded.'} Your current network and settings are unchanged. Retry the import or use the preloaded Lake Forest corridor.`);
      return null;
    } finally {
      sim.setLoading(false);
    }
  };
}
