export const benchmarkWarnings=[
 'This is an open-loop SUMO plant benchmark, not PriorityPulse running inside SUMO and not field calibration. SUMO replays the exported 300-second signal trace and final realized emergency routes; online reroute decisions are not replayed at their original times.',
 'Inputs match by seed, exact offered demand, explicit vehicle routes, dispatch times, modeled lengths, lane counts, speeds and 1-second observation steps. Microscopic acceleration, car-following, lane changing, junction geometry and queue service differ.',
 'All modeled junction signals are simulated, not surveyed signal plans. Pedestrian clearances become all-red holds; pedestrian agents are not generated. Conditional OSM restrictions remain unsupported; explicit routes preserve supported turn rules, not a general SUMO routing restriction model.',
 'One-metre terminal connectors with arrival position zero preserve final-signal crossing as closely as possible. SUMO may still differ at step boundaries. Emergency vehicles are simplified probes in PriorityPulse and are not part of ordinary traffic conservation counts.',
 'Compare emergency response capped at 300s, ordinary completions, and offered-to-arrival time on the common completed-vehicle cohort. Do not equate SUMO waitingTime/timeLoss with PriorityPulse queued delay. Uncertainty is across matched seeds, not proof of field accuracy.'
];
export default function validateManifest(m){
 if(m?.schema!=='prioritypulse-sumo-v1'||!/^[a-f0-9]{16}$/.test(m.id)||!Array.isArray(m.runs)||m.runs.length<1||m.runs.length>10||m.observationSeconds!==300||m.stepSeconds!==1)throw new Error('Choose the manifest.json from an exported PriorityPulse SUMO package.');
 const seeds=new Set();
 for(const r of m.runs){
  if(!Number.isInteger(r.seed)||r.seed<1||r.seed>999999||seeds.has(r.seed)||r.prefix!==`pp-${m.id}-s${r.seed}-`||r.netFile!==`network-${m.id}-${r.seed}.net.xml`||!Array.isArray(r.expected)||r.expected.length>50000||!Array.isArray(r.reference?.trips)||!Array.isArray(r.reference?.fleet))throw new Error('Manifest run definitions are invalid. Re-export the benchmark.');seeds.add(r.seed);
  const ids=new Set();for(const v of r.expected){if(typeof v.id!=='string'||!v.id||ids.has(v.id)||!['ordinary','emergency'].includes(v.kind)||!Number.isFinite(v.depart)||v.depart<0||v.depart>=300)throw new Error('Manifest vehicle definitions are invalid. Re-export the benchmark.');ids.add(v.id);}
  const emergency=r.expected.filter(v=>v.kind==='emergency');if(!emergency.length||emergency.length>4||r.reference.fleet.length!==emergency.length)throw new Error('Manifest ambulance reference is missing. Re-export the benchmark.');
  const expected=new Map(r.expected.map(v=>[v.id,v])),trips=new Set();for(const v of r.reference.trips){if(expected.get(v.id)?.kind!=='ordinary'||expected.get(v.id)?.depart!==v.depart||trips.has(v.id)||!Number.isFinite(v.arrival)||v.arrival<0||v.arrival>300||!Number.isFinite(v.depart)||v.depart<0||v.arrival<v.depart)throw new Error('Manifest reference trips are invalid. Re-export the benchmark.');trips.add(v.id);}
  if(new Set(r.reference.fleet.map(u=>u.id)).size!==emergency.length)throw new Error('Duplicate ambulance reference. Re-export the benchmark.');
  for(const u of r.reference.fleet)if(!emergency.some(v=>v.id===u.id&&v.depart===u.dispatch)||!(u.arrival===null||(Number.isFinite(u.arrival)&&u.arrival>=0&&u.arrival+u.dispatch<=300)))throw new Error('Manifest emergency outcomes are invalid. Re-export the benchmark.');
 }
 return m;
}