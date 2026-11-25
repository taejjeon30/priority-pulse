import {turnAllowed,routeSignature} from '@/components/command/network';
import {turnState} from '@/components/command/osmTurnRules';
export function predictedArcTime(a,n,queues,priority){
 const speed=Math.min(a.speed/3.6,{Routine:14,Urgent:17,Critical:20}[priority]||14),queue=(queues[a.id]||0)/Math.max(.5,.5*a.lanes);
 const clearance=n.state==='Green'?(n.phase===a.approach?0:Math.max(0,8-n.elapsed)+n.yellow+n.allRed):n.state==='Walk'?n.ped:n.state==='Yellow'?Math.max(0,n.yellow-n.elapsed)+n.allRed:Math.max(0,n.allRed-n.elapsed);
 return a.length/speed+queue+clearance;
}
export default function reassessRoutes(fleet,arcs,nodeMap,queues,t,enabled,events){
 if(!enabled||t%5)return;
 const outgoing=new Map();for(const a of arcs){if(!outgoing.has(a.from))outgoing.set(a.from,[]);outgoing.get(a.from).push(a);}
 for(const unit of fleet){
  if(unit.arrival!==null||t<unit.dispatch||t-unit.lastReroute<15)continue;
  const prefix=unit.route.arcs.slice(0,unit.evIndex+1),current=prefix.at(-1);if(!current||current.to===unit.destination)continue;
  const blocked=new Set(prefix.map(a=>a.from)),todo=[{node:current.to,path:[],cost:0}],visited=new Set();let candidate=null;
  while(todo.length){todo.sort((a,b)=>a.cost-b.cost||routeSignature({arcs:a.path}).localeCompare(routeSignature({arcs:b.path})));const x=todo.shift(),history=[...prefix,...x.path],last=history.at(-1),key=x.node+'|'+last.id+'|'+turnState(history);if(visited.has(key))continue;visited.add(key);
   if(x.node===unit.destination){candidate=x;break;}
   for(const a of outgoing.get(x.node)||[]){if(blocked.has(a.to)||x.path.some(p=>p.from===a.to)||!turnAllowed(last,a,history,'emergency'))continue;todo.push({node:a.to,path:[...x.path,a],cost:x.cost+predictedArcTime(a,nodeMap.get(a.to),queues,unit.priority)});}
  }
  const old=unit.route.arcs.slice(unit.evIndex+1),before=old.reduce((sum,a)=>sum+predictedArcTime(a,nodeMap.get(a.to),queues,unit.priority),0);
  unit.predictedRemaining=(1-unit.evProgress)*predictedArcTime(current,nodeMap.get(current.to),queues,unit.priority)+(candidate?.cost??before);
  if(!candidate){unit.routeReason='No legal alternative; retaining the current reachable route.';continue;}
  const saving=before-candidate.cost;if(saving<Math.max(5,before*.15)||routeSignature({arcs:old})===routeSignature({arcs:candidate.path}))continue;
  const next=[...prefix,...candidate.path];unit.route={arcs:next,distance:next.reduce((sum,a)=>sum+a.length,0),prediction:unit.predictedRemaining};unit.lastReroute=t;unit.reroutes++;
  unit.routeReason=`Predicted remaining time improved ${before.toFixed(1)}s → ${candidate.cost.toFixed(1)}s after the current road; ≥5s and ≥15% improvement, 15s cooldown.`;
  events.push({t,unit:unit.id,reason:unit.routeReason,before,after:candidate.cost});
 }
}