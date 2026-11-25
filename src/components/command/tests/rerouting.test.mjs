import test from 'node:test';
import assert from 'node:assert/strict';
import {starterNetwork,findRoute,arcsOf,turnAllowed} from '@/components/command/network';
import fleetMissions from '@/components/command/fleetMissions';
import reassessRoutes from '@/components/command/emergencyRouting';
import fleetArbitration from '@/components/command/fleetArbitration';
import {simulateNetwork} from '@/components/command/networkSimulation';
import {readFileSync} from 'node:fs';
import missionEndpoints from '@/components/command/missionEndpoints';
const settings={seed:7,density:'Low',priority:'Critical',dispatch:5,pedCalls:[]};
test('the real Lake Forest corridor runs with multiple units and preserved safety',()=>{
 const n=JSON.parse(readFileSync(new URL('../lakeForestCorridor.json',import.meta.url),'utf8')),ends=missionEndpoints(n),route=findRoute(n,ends.origin,ends.destination),s={...settings,missions:[{id:'AMB-002',...ends,priority:'Urgent',dispatch:10}]},r=simulateNetwork(n,s,route,['PriorityPulse'],false)[0];assert.equal(r.fleetOutcomes.length,2);assert.equal(r.metrics.safety,100);assert.equal(r.metrics.maxConservationError,0);assert.ok(r.fleetOutcomes.every(u=>u.route.arcs.length));
});
test('reroutes only the future suffix, obeys legal turns, and enforces cooldown',()=>{
 const network=starterNetwork(),route=findRoute(network,'i0','i8'),arcs=arcsOf(network),fleet=fleetMissions(network,{...settings,dispatch:0},route),events=[],nodes=new Map(network.nodes.map(n=>[n.id,{...n,state:'Green',phase:0,elapsed:10,ped:0}])),queues={[route.arcs[1].id]:100};
 reassessRoutes(fleet,arcs,nodes,queues,0,true,events);assert.equal(events.length,1);assert.equal(fleet[0].route.arcs[0].id,route.arcs[0].id);assert.ok(events[0].before-events[0].after>=5);
 const chosen=fleet[0].route.arcs;for(let i=1;i<chosen.length;i++)assert.ok(turnAllowed(chosen[i-1],chosen[i],chosen.slice(0,i),'emergency'));
 reassessRoutes(fleet,arcs,nodes,{},5,true,events);assert.equal(events.length,1);assert.equal(fleet[0].reroutes,1);
});
test('disabled rerouting leaves the original route unchanged',()=>{
 const n=starterNetwork(),route=findRoute(n,'i0','i8'),fleet=fleetMissions(n,settings,route),events=[];reassessRoutes(fleet,arcsOf(n),new Map(),{},10,false,events);assert.equal(events.length,0);assert.equal(fleet[0].route,route);
});
test('conflict ranking ages a waiting lower-priority request deterministically',()=>{
 const make=(id,priority,approach,wait)=>({id,priority,signalWait:wait,dispatch:0,arrival:null,evIndex:0,evProgress:0,route:{arcs:[{id,from:id,to:'junction',length:100,speed:36,lanes:1,approach}]}}),routine=make('AMB-001','Routine',0,0),critical=make('AMB-002','Critical',1,0);
 assert.equal(fleetArbitration([routine,critical],{},0).conflicts[0].winner,'AMB-002');routine.signalWait=90;assert.equal(fleetArbitration([critical,routine],{},0).conflicts[0].winner,'AMB-001');
});
test('fleet simulations preserve shared demand, deterministic outcomes and legal clearances',()=>{
 const n=starterNetwork(),route=findRoute(n,'i0','i8'),s={...settings,missions:[{id:'AMB-002',origin:'i6',destination:'i2',priority:'Urgent',dispatch:10}]},runs=simulateNetwork(n,s,route),repeat=simulateNetwork(n,s,route,['PriorityPulse'],false)[0];
 assert.equal(new Set(runs.map(r=>r.metrics.external)).size,1);assert.deepEqual(runs[2].metrics,repeat.metrics);
 for(const r of runs){assert.equal(r.fleetOutcomes.length,2);assert.equal(r.metrics.maxConservationError,0);assert.equal(r.metrics.safety,100);assert.equal(r.frames.length,300);for(const frame of r.frames)for(const u of frame.fleet){assert.ok(u.evProgress>=0&&u.evProgress<=1);for(let i=1;i<u.route.arcs.length;i++)assert.ok(turnAllowed(u.route.arcs[i-1],u.route.arcs[i],u.route.arcs.slice(0,i),'emergency'));}}
});