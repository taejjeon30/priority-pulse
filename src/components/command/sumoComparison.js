const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
export default function sumoComparison(records,configuration,manifest,version='Not reported'){
 const run=manifest.runs.find(r=>records[0]?.id?.startsWith(r.prefix));if(!run)throw new Error('Scenario or seed mismatch. Import output from this benchmark package.');
 const network=configuration['net-file']?.replace(/\\/g,'/').split('/').at(-1);
 if(Number(configuration.seed)!==run.seed||Number(configuration.end)!==300||Number(configuration.begin||0)!==0||Number(configuration['step-length']||1)!==1||network!==run.netFile)throw new Error('SUMO settings do not match the exported seed, network or 1s/300s observation. Run the unmodified exported configuration.');
 const expected=new Map(run.expected.map(v=>[run.prefix+v.id,v])),seen=new Map();
 for(const record of records){const {id}=record,v=expected.get(id);if(!v||seen.has(id))throw new Error('Unknown or duplicate vehicle IDs. Do not combine seeds or modify the exported demand.');
  const number=key=>{const raw=record[key];if(raw===null||raw===undefined||raw===''||!Number.isFinite(Number(raw)))throw new Error(`Missing numeric ${key} for ${id}. Re-export complete tripinfo.`);return Number(raw);};
  const depart=number('depart'),arrival=number('arrival'),delay=number('departDelay');
  if(depart>300.01||(depart<0&&depart!==-1)||(arrival<0&&arrival!==-1)||arrival>300.01||(arrival>=0&&(depart<0||arrival<depart||arrival<v.depart))||(depart>=0&&(delay<0||depart<v.depart-.01||Math.abs(depart-delay-v.depart)>.05))||['true','1'].includes(record.vaporized)||Number(record.rerouteNo||0)>0)throw new Error('Inconsistent departures, observation bounds, external reroutes or removed vehicles. Run the unmodified configuration.');
  seen.set(id,{...v,arrival,depart});
 }
 if(seen.size!==expected.size)throw new Error(`${expected.size-seen.size} offered vehicles are missing. Keep write-unfinished and write-undeparted enabled and run through 300s.`);
 const ordinary=[...seen.values()].filter(v=>v.kind==='ordinary'),finished=ordinary.filter(v=>v.arrival>=0),completedById=new Map(finished.map(v=>[v.id,v])),common=run.reference.trips.filter(v=>completedById.has(v.id));
 const units=run.reference.fleet.map(u=>{const v=seen.get(run.prefix+u.id);return {id:u.id,pp:u.arrival??300-u.dispatch,sumo:v.arrival>=0?v.arrival-u.dispatch:300-u.dispatch,ppArrived:u.arrival!==null,sumoArrived:v.arrival>=0};});
 return {seed:run.seed,commonCount:common.length,units,version,metrics:{emergency:{pp:mean(units.map(u=>u.pp)),sumo:mean(units.map(u=>u.sumo))},completed:{pp:run.reference.trips.length,sumo:finished.length},commonTravel:{pp:mean(common.map(v=>v.arrival-v.depart)),sumo:mean(common.map(v=>completedById.get(v.id).arrival-v.depart))}}};
}