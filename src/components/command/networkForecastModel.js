import {turnAllowed} from '@/components/command/network';
import {storage} from '@/components/command/spillbackModel';
export default function networkForecastModel(arcs,nodes,slots,counts,input,backlog){
 const index=new Map(arcs.map((a,i)=>[a.id,i])),nodeIndex=new Map(nodes.map((n,i)=>[n.id,i]));
 const links=arcs.map(a=>{
  const observed=new Map(),list=slots[a.id]||[];
  for(const v of list){const next=v.route[v.step+1];observed.set(next,(observed.get(next)||0)+1);}
  const legal=arcs.filter(b=>b.from===a.to&&turnAllowed(a,b,[a]));
  const shares=list.length?[...observed].map(([id,n])=>({index:index.get(id),share:n/list.length})):legal.length?[{index:undefined,share:.25},...legal.map(b=>({index:index.get(b.id),share:.75/legal.length}))]:[{index:undefined,share:1}];
  return{...a,node:nodeIndex.get(a.to),capacity:storage(a),count:counts[a.id]||0,queue:list.filter(v=>v.queued).length,travel:Math.max(1,Math.ceil(a.length/(a.speed/3.6))),rate:input.estimates[a.id].mean,boundary:backlog.filter(v=>v.route[0]===a.id).length,shares,moving:list.filter(v=>!v.queued).map(v=>Math.max(0,Math.ceil((1-v.progress)*a.length/(a.speed/3.6))-1))};
 });
 return{links,index,nodes};
}