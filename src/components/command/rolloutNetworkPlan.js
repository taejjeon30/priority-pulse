import signalSchedule from '@/components/command/signalSchedule';
export default function rolloutNetworkPlan(model,targets,mission,horizon=36){
 const {links,nodes,index}=model,schedules=nodes.map(n=>signalSchedule(n,targets[n.id],horizon));
 const counts=links.map(a=>a.count),queues=links.map(a=>a.queue),boundary=links.map(a=>a.boundary),due=links.map(()=>Array(horizon).fill(0));
 links.forEach((a,i)=>a.moving.forEach(k=>{if(k<horizon)due[i][k]++;}));
 let delay=0,squares=0,spillback=0,blocked=0,evWait=0,weightedWait=0;
 const missions=(mission.fleet||[mission]).map(m=>({...m,index:m.evIndex,progress:m.evProgress}));
 for(let k=0;k<horizon;k++){
  const room=links.map((a,i)=>Math.max(0,a.capacity-counts[i])),departures=links.map(()=>0),entries=links.map(()=>0);
  links.forEach((a,i)=>{
   if(k>0)boundary[i]+=a.rate;
   const admission=Math.min(1,boundary[i],room[i]);boundary[i]-=admission;counts[i]+=admission;room[i]-=admission;
   if(k+a.travel-1<horizon)due[i][k+a.travel-1]+=admission;
   queues[i]=Math.min(counts[i],queues[i]+due[i][k]);
  });
  links.forEach((a,i)=>{
   const s=schedules[a.node][k];if(!s.green||s.phase!==a.approach)return;
   const service=.5*Math.min(a.lanes,nodes[a.node].lanes[a.approach])*(1-Math.exp(-(s.elapsed+1)/1.6)),offered=Math.min(queues[i],service);
   let flow=offered;for(const b of a.shares)if(b.index!==undefined)flow=Math.min(flow,room[b.index]/b.share);
   blocked+=offered-flow;departures[i]=flow;
   for(const b of a.shares)if(b.index!==undefined){const amount=flow*b.share;room[b.index]-=amount;entries[b.index]+=amount;if(k+links[b.index].travel<horizon)due[b.index][k+links[b.index].travel]+=amount;}
  });
  links.forEach((a,i)=>{queues[i]=Math.max(0,queues[i]-departures[i]);counts[i]+=entries[i]-departures[i];delay+=queues[i]+boundary[i];squares+=(queues[i]+boundary[i])**2;spillback+=a.capacity*Math.max(0,counts[i]/a.capacity-.85)**2;});
  for(const m of missions){if(m.arrived||k<m.dispatchIn||m.index>=m.route.arcs.length)continue;
      const arc=m.route.arcs[m.index],i=index.get(arc.id),a=links[i],s=schedules[a.node][k],speed=Math.min(a.speed/3.6,{Routine:14,Urgent:17,Critical:20}[m.priority]),before=m.progress,freeStep=speed/a.length,next=m.route.arcs[m.index+1];
      m.progress=Math.min(1,m.progress+freeStep);if(queues[i]>0)m.progress=Math.min(m.progress,Math.max(before,1-queues[i]*7.5/(a.length*a.lanes)));
      if(m.progress>=1&&(!s.green||s.phase!==a.approach||(next&&counts[index.get(next.id)]>=links[index.get(next.id)].capacity-1)))m.progress=Math.max(before,1-1/a.length);
      const wait=Math.max(0,1-(m.progress-before)/freeStep);evWait+=wait;weightedWait+=({Routine:16,Urgent:32,Critical:64}[m.priority]||16)*wait;if(m.progress>=1){m.index++;m.progress=0;}
     }
 }
 const changes=nodes.filter(n=>targets[n.id]!==n.phase).length;
 return{evWait,delay,squares,spillback,blocked,changes,queue:queues.reduce((s,v)=>s+v,0),overflow:boundary.reduce((s,v)=>s+v,0),cost:weightedWait+.3*delay+.012*squares+8*spillback+2*blocked+5*changes};
}