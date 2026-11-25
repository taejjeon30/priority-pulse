import {storage} from '@/components/command/spillbackModel';
// Synchronous link update: reserve receiving space against the start-of-step snapshot.
// Transfers enter at the end of the step, so no vehicle can traverse two links in one second.
export default function linkFlowStep(arcs,nodeMap,vehicles,counts,credit,entered,departed,blocked,t=0){
 const map=new Map(arcs.map(a=>[a.id,a])),groups=Object.fromEntries(arcs.map(a=>[a.id,[]])),room={},entrance={},transfers=[],trips=[];let completed=0,completedDelay=0;
 for(const v of vehicles.values())groups[v.arc].push(v);
 for(const a of arcs){const list=groups[a.id];list.sort((x,y)=>y.progress-x.progress||x.born-y.born||x.id.localeCompare(y.id));room[a.id]=storage(a)-counts[a.id];entrance[a.id]=list.every(v=>v.progress>=7.5/(a.length*a.lanes));}
 for(const a of arcs){
  const n=nodeMap.get(a.to),green=n.state==='Green'&&n.phase===a.approach,gap=7.5/(a.length*a.lanes);
  credit[a.id]=green?Math.min(2*Math.min(a.lanes,n.lanes[a.approach]),credit[a.id]+.5*Math.min(a.lanes,n.lanes[a.approach])*(1-Math.exp(-(n.elapsed+1)/1.6))):0;
  let leader=null;
  for(const v of groups[a.id]){
   const before=v.progress,desired=Math.min(1,before+(a.speed/3.6)/a.length),limit=leader?Math.max(before,leader.progress-gap):1;
   v.progress=Math.min(desired,limit);const atStop=v.progress>=1-1e-9,next=map.get(v.route[v.step+1]),receiving=!next||(room[next.id]>0&&entrance[next.id]);
   if(atStop&&green&&!receiving)blocked[a.id]++;
   if(atStop&&green&&receiving&&credit[a.id]>=1){
    credit[a.id]--;counts[a.id]--;departed[a.id]++;
    if(next){room[next.id]--;entrance[next.id]=false;counts[next.id]++;entered[next.id]++;transfers.push({v,next});}else{vehicles.delete(v.id);completed++;completedDelay+=v.delay+(v.admitted-v.born);trips.push({id:v.id,depart:v.born,arrival:t+1});}
    continue;
   }
   const wasQueued=v.queued;v.queued=atStop||v.progress<desired-1e-9;
   if(v.queued){v.delay++;if(!wasQueued)v.stops++;}leader=v;
  }
 }
 for(const {v,next} of transfers){v.arc=next.id;v.step++;v.progress=0;v.queued=false;}
 return{completed,completedDelay,trips};
}