import {arcsOf} from '@/components/command/network';
import trafficDemand from '@/components/command/trafficDemand';
import {predictActions} from '@/components/command/predictor';
import {storage,roadState} from '@/components/command/spillbackModel';
import linkFlowStep from '@/components/command/linkFlowStep';
import {forecastApproaches} from '@/components/command/queueForecast';
import networkController from '@/components/command/networkController';
import fleetMissions from '@/components/command/fleetMissions';
import fleetArbitration from '@/components/command/fleetArbitration';
import fleetMotion from '@/components/command/fleetMotion';
import reassessRoutes,{predictedArcTime} from '@/components/command/emergencyRouting';
export function simulateNetwork(network,settings,route,modes=['Fixed-Time','Reactive','PriorityPulse'],retainFrames=true){const arcs=arcsOf(network),demand=trafficDemand(arcs,settings);return modes.map(mode=>run(network,settings,route,arcs,demand,mode,retainFrames));}
function run(network,settings,route,arcs,inputs,mode,retainFrames){
 const arcMap=new Map(arcs.map(a=>[a.id,a])),nodes=network.nodes.map((n,i)=>({...n,yellow:Math.max(3,n.yellow||3),allRed:Math.max(2,n.allRed||2),pedestrian:Math.max(19,n.pedestrian||19),greens:n.greens.map(g=>Math.max(8,g||8)),phase:i%4,state:'Green',elapsed:8,ped:0,pending:false,target:0,wait:[0,0,0,0]})),nodeMap=new Map(nodes.map(n=>[n.id,n]));
 const fleet=fleetMissions(network,settings,route),routeEvents=[],tripOutcomes=[];
 const vehicles=new Map(),backlog=[],credit=Object.fromEntries(arcs.map(a=>[a.id,0])),frames=[],logs=[];let completed=0,idle=0,maxQueue=0,spillback=0,transitions=0,legal=0,stops=0,evDelay=0,distance=0,arrival=null,evIndex=0,evProgress=0,totalBorn=0;const occupied={},audits={};let previousRoads={},blockedSeconds=0,maxConservationError=0,upstreamEpisodes=0,queueSum=0,maxWaitObserved=0,completedDelay=0;const upstream={},blockedNodes=new Set();
 for(let t=0;t<300;t++){
  const slots=Object.fromEntries(arcs.map(a=>[a.id,[]]));for(const v of vehicles.values())slots[v.arc].push(v);for(const a of arcs)slots[a.id].sort((x,y)=>y.progress-x.progress||x.born-y.born);
  const queued=Object.fromEntries(arcs.map(a=>[a.id,slots[a.id].filter(v=>v.queued).length])),counts=Object.fromEntries(arcs.map(a=>[a.id,slots[a.id].length]));
  const oldCounts={...counts},entered=Object.fromEntries(arcs.map(a=>[a.id,0])),localEntered={...entered},departed={...entered},blockedTransfers={...entered};
  for(const spawn of inputs[t].vehicles){backlog.push({...spawn,born:t});totalBorn++;}for(let i=0;i<backlog.length;){const s=backlog[i],a=arcMap.get(s.route[0]);if(counts[a.id]>=storage(a)||[...vehicles.values()].some(v=>v.arc===a.id&&v.progress<7.5/(a.length*a.lanes))){i++;continue;}vehicles.set(s.id,{...s,arc:a.id,step:0,progress:0,queued:false,delay:0,stops:0,admitted:t});counts[a.id]++;entered[a.id]++;localEntered[a.id]++;backlog.splice(i,1);}
  for(const a of arcs)slots[a.id]=[];for(const v of vehicles.values())slots[v.arc].push(v);
  const routingQueues=Object.fromEntries(arcs.map(a=>[a.id,Math.max(queued[a.id]||0,previousRoads[a.id]?.queuePrediction?.mean||0)]));
  reassessRoutes(fleet,arcs,nodeMap,routingQueues,t,mode==='PriorityPulse'&&settings.dynamicRouting!==false,routeEvents);
  for(const u of fleet)u.predictedRemaining=u.arrival!==null?0:u.route.arcs.slice(u.evIndex).reduce((sum,a,i)=>sum+predictedArcTime(a,nodeMap.get(a.to),routingQueues,u.priority)*(i===0?1-u.evProgress:1),0);
  const {etas,conflicts}=fleetArbitration(fleet,queued,t,mode==='Reactive');
  for(const n of nodes)n.pending=n.pending||(settings.pedCalls||[]).some(c=>c.t===t&&c.id===n.id);
  const optimization=mode==='PriorityPulse'?networkController({arcs,nodes,slots,counts,queued,input:inputs[t],previousRoads,backlog,etas,mission:{priority:settings.priority,fleet:fleet.map(u=>({...u,dispatchIn:Math.max(0,u.dispatch-t),arrived:u.arrival!==null}))}}):null;
  const decisions=[];
  for(const n of nodes){n.pending=n.pending||(settings.pedCalls||[]).some(c=>c.t===t&&c.id===n.id);const incoming=arcs.filter(a=>a.to===n.id),q=[0,0,0,0],rates=[0,0,0,0],lanes=[0,0,0,0],down=[0,0,0,0];for(const a of incoming){q[a.approach]+=queued[a.id];rates[a.approach]+=inputs[t].estimates[a.id].mean;lanes[a.approach]+=Math.min(a.lanes,n.lanes[a.approach]);const out=arcs.filter(b=>b.from===n.id&&b.to!==a.from);down[a.approach]=out.length?Math.max(...out.map(b=>counts[b.id]/Math.max(1,Math.floor(b.length*b.lanes/7.5)))):0;}
   const needsForecast=mode==='PriorityPulse'||retainFrames,forecast=needsForecast?forecastApproaches(incoming,slots,inputs[t],previousRoads,backlog):null,e=etas[n.id]||{eta:-1,phase:0},p=optimization?optimization.locals[n.id]:needsForecast?predictActions(n,q,rates,lanes,e.eta,e.phase,down,settings.priority,forecast):{reason:'Baseline control',redDelay:0,table:[0,1,2,3].map(target=>({target,evWait:0,delay:0,queue:q.reduce((s,v)=>s+v,0)}))};let target=n.phase,reason=p.reason;
   if(mode==='Fixed-Time'){if(n.elapsed>=n.greens[n.phase])target=(n.phase+1)%4;reason='Configured fixed-time schedule';}else{if(mode==='Reactive'){if(e.eta>=0){target=e.phase;reason=`Conventional preemption: ${e.unit} ranked first for this incoming approach`;}else if(n.elapsed>=n.greens[n.phase]){target=(n.phase+1)%4;reason='Preemption baseline: resume configured fixed-time cycle';}else{target=n.phase;reason='Preemption baseline: hold configured phase';}}else{target=optimization.targets[n.id];reason=`Network forecast: ${optimization.summary.name} · cost ${optimization.summary.cost.toFixed(1)}`;}if(n.elapsed>=Math.max(45,...n.greens)){target=(n.phase+1)%4;reason='Maximum green reached';}if(Math.max(...n.wait)>=120){target=n.wait.indexOf(Math.max(...n.wait));reason='Longest-waiting approach prioritized';}}
   if(n.state!=='Green'||n.elapsed<8||n.ped)target=n.phase;
   const hold=p.table.find(c=>c.target===n.phase),chosen=p.table.find(c=>c.target===target)||hold;
   if(n.pending)reason='Protected pedestrian clearance requested';
   const d={id:n.id,name:n.name,t,eta:e.eta,evPhase:e.phase,down:down[e.phase],queue:q[e.phase],target,phase:n.phase,state:n.state,benefit:hold.evWait-chosen.evWait,trafficCost:(chosen.delay-hold.delay)/Math.max(1,q.reduce((s,v)=>s+v,0)),queueImpact:chosen.queue-hold.queue,redDelay:p.redDelay,reason,table:p.table,queues:q,arbitration:conflicts.find(c=>c.id===n.id)||null};
   if(optimization){d.benefit=optimization.summary.benefit;d.trafficCost=optimization.summary.trafficCost/Math.max(1,Object.values(queued).reduce((s,v)=>s+v,0));d.queueImpact=optimization.summary.queueImpact;d.redDelay=optimization.summary.table[0].evWait;d.networkPlan=optimization.summary.name;}
   decisions.push(d);
   if((target!==n.phase||n.pending)&&n.state==='Green'&&n.elapsed>=8&&!n.ped){audits[n.id]={start:t,green:n.elapsed,ped:n.ped};n.target=target;n.state='Yellow';n.elapsed=0;logs.push(d);}
   for(let j=0;j<4;j++)n.wait[j]=q[j]&&(n.state!=='Green'||n.phase!==j)?n.wait[j]+1:0;
  }
  const movement=linkFlowStep(arcs,nodeMap,vehicles,counts,credit,entered,departed,blockedTransfers,t);completed+=movement.completed;completedDelay+=movement.completedDelay;if(retainFrames)tripOutcomes.push(...movement.trips);
  for(const a of arcs)if(blockedTransfers[a.id]>0)blockedNodes.add(a.to);
    for(const a of arcs){const ratio=counts[a.id]/storage(a);if(ratio>=.85&&!occupied[a.id])spillback++;occupied[a.id]=ratio>=.85;}
  fleetMotion(fleet,nodeMap,vehicles,counts,t);const primary=fleet[0],velocity=primary.velocity;({distance,evIndex,evProgress,arrival,stops,evDelay}=primary);
  const live=[...vehicles.values()],queues=Object.fromEntries(arcs.map(a=>[a.id,live.filter(v=>v.arc===a.id&&v.queued).length])),total=Object.values(queues).reduce((s,v)=>s+v,0);idle+=total+backlog.length;queueSum+=total;maxWaitObserved=Math.max(maxWaitObserved,...nodes.flatMap(n=>n.wait));maxQueue=Math.max(maxQueue,...Object.values(queues));
  const roads=Object.fromEntries(arcs.map(a=>[a.id,roadState(a,counts[a.id],queues[a.id],previousRoads[a.id],entered[a.id],departed[a.id],blockedTransfers[a.id],entered[a.id],oldCounts[a.id],entered[a.id]-localEntered[a.id],live.filter(v=>v.arc===a.id),inputs[t].estimates[a.id],backlog.filter(v=>v.route[0]===a.id).length,nodeMap.get(a.to))])),blocked=Object.values(blockedTransfers).reduce((s,v)=>s+v,0),massError=totalBorn-completed-live.length-backlog.length;
  blockedSeconds+=blocked;maxConservationError=Math.max(maxConservationError,Math.abs(massError),...Object.values(roads).map(s=>Math.abs(s.massError)));
  for(const a of arcs){if(roads[a.id].reachesUpstream&&!upstream[a.id])upstreamEpisodes++;upstream[a.id]=roads[a.id].reachesUpstream;}previousRoads=roads;
  if(retainFrames)frames.push({t,fleet:fleet.map(u=>({...u})),arbitration:conflicts,routeEvents:routeEvents.slice(-12),networkDecision:optimization?.summary||null,demand:inputs[t],roads,blocked,massError,nodes:nodes.map(n=>({...n,wait:[...n.wait]})),decisions,logs:logs.slice(-12),vehicles:live.slice(0,180).map(v=>({id:v.id,arc:v.arc,progress:v.progress,queued:v.queued,delay:v.delay,stops:v.stops})),queues,counts:{...counts},total,completed,backlog:backlog.length,vehicleCount:live.length,distance,velocity,evIndex,evProgress,arrival,stops,evDelay,idle,spillback,maxQueue,etas});
  for(const n of nodes){n.elapsed++;if(n.state==='Yellow'&&n.elapsed>=n.yellow){n.state='All-red';audits[n.id].yellow=n.elapsed;n.elapsed=0;}else if(n.state==='All-red'&&n.elapsed>=n.allRed){const audit=audits[n.id];transitions++;if(audit.green>=8&&!audit.ped&&audit.yellow>=3&&n.elapsed>=2)legal++;if(n.pending){n.state='Walk';n.ped=n.pedestrian;n.pending=false;n.elapsed=0;}else{n.phase=n.target;n.state='Green';n.elapsed=0;}}else if(n.state==='Walk'){n.ped=Math.max(0,n.ped-1);if(!n.ped){n.phase=n.target;n.state='Green';n.elapsed=0;}}}
 }
 return{mode,frames,logs,tripOutcomes,fleetOutcomes:fleet.map(u=>({...u})),routeEvents,metrics:{evTime:arrival,evDelay,ambulancesArrived:fleet.filter(u=>u.arrival!==null).length,reroutes:fleet.reduce((sum,u)=>sum+u.reroutes,0),blockedIntersections:blockedNodes.size,averageTrafficDelay:totalBorn?idle/totalBorn:null,delay:completed?idle/completed:0,completedTripDelay:completed?completedDelay/completed:null,averageQueue:queueSum/300,signalChanges:logs.length,completed,maxQueue,spillback,stops,idle,safety:transitions?100*legal/transitions:null,recovery:null,maxWait:maxWaitObserved,external:totalBorn,seed:settings.seed,blockedSeconds,upstreamEpisodes,maxConservationError}};
}