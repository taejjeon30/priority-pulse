import {storage} from '@/components/command/spillbackModel';
export default function fleetMotion(fleet,nodeMap,vehicles,counts,t){
 const reserved={},crossed=new Set(),positions=fleet.filter(u=>u.arrival===null&&t>=u.dispatch).map(u=>({id:u.id,arc:u.route.arcs[u.evIndex]?.id,progress:u.evProgress,dispatch:u.dispatch}));
 for(const u of fleet){u.velocity=0;if(t<u.dispatch||u.arrival!==null)continue;
  const a=u.route.arcs[u.evIndex],n=nodeMap.get(a.to),speed=Math.min(a.speed/3.6,{Routine:14,Urgent:17,Critical:20}[u.priority]),before=u.evProgress,next=u.route.arcs[u.evIndex+1],queue=[...vehicles.values()].filter(v=>v.arc===a.id&&v.queued).length;
  let progress=Math.min(1,before+speed/a.length);if(queue)progress=Math.min(progress,Math.max(before,1-queue*7.5/(a.length*a.lanes)));
  const leader=positions.filter(p=>p.arc===a.id&&p.id!==u.id&&(p.progress>before||(p.progress===before&&(p.dispatch<u.dispatch||(p.dispatch===u.dispatch&&p.id<u.id))))).sort((x,y)=>x.progress-y.progress)[0];
  if(leader)progress=Math.min(progress,Math.max(before,leader.progress-7.5/a.length));
  const red=n.state!=='Green'||n.phase!==a.approach,full=next&&counts[next.id]+(reserved[next.id]||0)>=storage(next),occupied=crossed.has(n.id);
  if(progress>=1&&(red||full||occupied))progress=Math.max(before,1-1/a.length);
  u.evProgress=progress;u.velocity=(progress-before)*a.length;u.distance+=u.velocity;if(u.velocity<speed*.5)u.evDelay++;if(u.velocity<1&&!u.lastStopped)u.stops++;u.lastStopped=u.velocity<1;
  if(red&&before>=1-Math.max(1,speed)/a.length)u.signalWait++;else if(!red&&u.velocity>1)u.signalWait=0;
  if(progress>=1){crossed.add(n.id);if(next)reserved[next.id]=(reserved[next.id]||0)+1;u.evIndex++;u.evProgress=0;if(u.evIndex===u.route.arcs.length)u.arrival=t+1-u.dispatch;}
 }
}