import {predictActions} from '@/components/command/predictor';
import {turnAllowed} from '@/components/command/network';
import {forecastApproaches} from '@/components/command/queueForecast';
import networkForecastModel from '@/components/command/networkForecastModel';
import rolloutNetworkPlan from '@/components/command/rolloutNetworkPlan';
// Safety and anti-starvation policies are applied before any plan is scored.
const permitted=(n,target)=>n.state!=='Green'||n.elapsed<8||n.ped?n.phase:Math.max(...n.wait)>=120?n.wait.indexOf(Math.max(...n.wait)):n.elapsed>=Math.max(45,...n.greens)?(n.phase+1)%4:target;
export default function networkController({arcs,nodes,slots,counts,queued,input,previousRoads,backlog,etas,mission}){
 const locals={},incoming=new Map(nodes.map(n=>[n.id,arcs.filter(a=>a.to===n.id)]));
 for(const n of nodes){
  const ins=incoming.get(n.id),q=[0,0,0,0],rates=[0,0,0,0],lanes=[0,0,0,0],down=[0,0,0,0];
  for(const a of ins){q[a.approach]+=queued[a.id];rates[a.approach]+=input.estimates[a.id].mean;lanes[a.approach]+=Math.min(a.lanes,n.lanes[a.approach]);const out=arcs.filter(b=>b.from===n.id&&turnAllowed(a,b,[a]));down[a.approach]=Math.max(down[a.approach],out.length?Math.max(...out.map(b=>counts[b.id]/Math.max(1,Math.floor(b.length*b.lanes/7.5)))):0);}
  const e=etas[n.id]||{eta:-1,phase:0};locals[n.id]=predictActions(n,q,rates,lanes,e.eta,e.phase,down,e.priority||mission.priority,forecastApproaches(ins,slots,input,previousRoads,backlog));
 }
 const hold=Object.fromEntries(nodes.map(n=>[n.id,permitted(n,n.phase)])),local=Object.fromEntries(nodes.map(n=>[n.id,permitted(n,locals[n.id].target)])),emergency={...local},relief={...local};
 for(const n of nodes){const e=etas[n.id];if(e?.eta>=0&&e.eta<=36)emergency[n.id]=permitted(n,e.phase);}
 // Open receiving-link exits before feeding their upstream stop lines.
 for(const n of nodes){const congested=incoming.get(n.id).filter(a=>counts[a.id]/Math.max(1,Math.floor(a.length*a.lanes/7.5))>=.65).sort((a,b)=>counts[b.id]-counts[a.id]);if(congested.length)relief[n.id]=permitted(n,congested[0].approach);}
 const coordinated={...emergency};for(const n of nodes){const congested=incoming.get(n.id).filter(a=>counts[a.id]/Math.max(1,Math.floor(a.length*a.lanes/7.5))>=.85).sort((a,b)=>counts[b.id]-counts[a.id]);if(congested.length)coordinated[n.id]=permitted(n,congested[0].approach);}
 const model=networkForecastModel(arcs,nodes,slots,counts,input,backlog),seen=new Set(),table=[];
 for(const [name,targets] of [['Hold / required recovery',hold],['Independent local proposals',local],['Emergency corridor',emergency],['Downstream queue relief',relief],['Coordinated corridor + relief',coordinated]]){
  for(const n of nodes){const e=etas[n.id];if(e?.conflict&&e.eta<=36)targets[n.id]=permitted(n,e.phase);}
  const signature=nodes.map(n=>targets[n.id]).join(',');if(seen.has(signature))continue;seen.add(signature);table.push({name,targets,...rolloutNetworkPlan(model,targets,mission)});
 }
 const best=table.reduce((a,b)=>b.cost<a.cost?b:a),baseline=table[0];
 return{targets:best.targets,locals,summary:{horizon:36,name:best.name,cost:best.cost,benefit:baseline.evWait-best.evWait,trafficCost:best.delay-baseline.delay,queueImpact:best.queue-baseline.queue,table:table.map(({targets,...r})=>r)}};
}