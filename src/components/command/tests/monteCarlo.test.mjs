import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {arcsOf,findRoute,starterNetwork} from '@/components/command/network';
import trafficDemand from '@/components/command/trafficDemand';
import missionEndpoints from '@/components/command/missionEndpoints';

const settings={seed:7,density:'Medium',priority:'Critical',dispatch:5,pedCalls:[]};
test('Monte Carlo demand repeats the same seed and changes consecutive seeds',()=>{
 const arcs=arcsOf(starterNetwork()),first=trafficDemand(arcs,settings),repeat=trafficDemand(arcs,settings),next=trafficDemand(arcs,{...settings,seed:8});
 assert.deepEqual(first,repeat);
 assert.notDeepEqual(first.map(row=>row.arrivals),next.map(row=>row.arrivals));
 assert.notDeepEqual(first.map(row=>row.vehicles),next.map(row=>row.vehicles));
});

test('the default corridor experiment advances seeds, shares demand within each pair, and replays reproducibly',async t=>{
 const network=JSON.parse(readFileSync(new URL('../lakeForestCorridor.json',import.meta.url),'utf8')),ends=missionEndpoints(network),route=findRoute(network,ends.origin,ends.destination),snapshot={network,settings,...ends,route};
 const previous=globalThis.self;let messages=[];
 globalThis.self={postMessage:message=>messages.push(message)};
 try{
  await import('@/components/command/experimentWorker');
  const runBatch=()=>{messages=[];self.onmessage({data:{snapshot,count:2,startSeed:7}});assert.ok(!messages.some(m=>m.type==='error'),JSON.stringify(messages.find(m=>m.type==='error')));return messages.filter(m=>m.type==='progress').map(m=>m.row);};
  const rows=runBatch();assert.deepEqual(rows.map(r=>r.seed),[7,8]);assert.deepEqual(runBatch(),rows);
  for(const row of rows){assert.equal(new Set(row.results.map(r=>r.external)).size,1);assert.ok(row.results.every(r=>r.seed===row.seed));}
  assert.notEqual(rows[0].results[0].external,rows[1].results[0].external);
  t.diagnostic(JSON.stringify({routeLinks:route.arcs.length,routeMetres:route.distance,seeds:rows.map(row=>({seed:row.seed,results:row.results.map(r=>({mode:r.mode,arrived:r.evTime!==null,travel:r.restrictedTravel,offered:r.external,ordinaryDelay:r.averageTrafficDelay,completed:r.completed}))}))}));
 }finally{if(previous===undefined)delete globalThis.self;else globalThis.self=previous;}
});