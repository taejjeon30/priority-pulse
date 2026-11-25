export const priorityRank={Routine:1,Urgent:2,Critical:3};
export function compareRequests(a,b){return (priorityRank[b.priority]+Math.floor(b.wait/30))-(priorityRank[a.priority]+Math.floor(a.wait/30))||a.dispatch-b.dispatch||a.eta-b.eta||a.unit.localeCompare(b.unit);}
export default function fleetArbitration(fleet,queues,t,currentOnly=false){
 const requests={};
 for(const u of fleet){if(u.arrival!==null)continue;let future=Math.max(0,u.dispatch-t);for(let i=u.evIndex;i<u.route.arcs.length;i++){
  const a=u.route.arcs[i],speed=Math.min(a.speed/3.6,{Routine:14,Urgent:17,Critical:20}[u.priority]);future+=(i===u.evIndex?1-u.evProgress:1)*a.length/speed+(queues[a.id]||0)/Math.max(.5,.5*a.lanes);
  if(currentOnly&&(i!==u.evIndex||t<u.dispatch))continue;
  const r={unit:u.id,eta:future,phase:a.approach,arc:a.id,priority:u.priority,dispatch:u.dispatch,wait:u.signalWait};if(!requests[a.to])requests[a.to]=[];requests[a.to].push(r);
 }}
 const etas={},conflicts=[];
 for(const [id,all] of Object.entries(requests)){
  const near=all.filter(r=>r.eta<=36),ranked=(near.length?near:all).sort(compareRequests),winner=ranked[0],competing=near.filter(r=>r.phase!==winner.phase);
  etas[id]={...winner,conflict:competing.length>0};
  if(competing.length)conflicts.push({id,winner:winner.unit,phase:winner.phase,requests:ranked,reason:'Priority tier + one aging tier per 30s signal wait; then earlier dispatch, nearer ETA, unit ID.'});
 }
 return {etas,conflicts};
}