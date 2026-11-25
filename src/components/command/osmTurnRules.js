function historyIds(history,incoming){return history?.length?history.map(a=>typeof a==='string'?a:a.id):incoming?[incoming.id]:[];}
function progress(rule,ids){
 return rule.paths.flatMap((path,index)=>{
  for(let step=Math.min(ids.length,path.approach.length);step>0;step--){if(path.approach.slice(0,step).every((id,i)=>id===ids[ids.length-step+i]))return[{index,step,next:path.approach[step]||path.exit}];}
  return[];
 });
}
export function osmTurnAllowed(incoming,outgoing,history,vehicleClass='motorcar'){
 const ids=historyIds(history,incoming);
 for(const rule of incoming.osmTurnRules||[]){
  if(rule.except?.some(v=>v===vehicleClass||v==='motor_vehicle'||v==='vehicle'||(v==='motorcar'&&vehicleClass==='emergency')))continue;
  if(rule.type==='no'){if(rule.paths.some(p=>p.exit===outgoing.id&&p.approach.length<=ids.length&&p.approach.every((id,i)=>id===ids[ids.length-p.approach.length+i])))return false;}
  else{const active=progress(rule,ids),step=Math.max(0,...active.map(p=>p.step));if(step&&!active.some(p=>p.step===step&&p.next===outgoing.id))return false;}
 }
 return true;
}
export function turnState(history){
 const incoming=history.at(-1);if(!incoming?.osmTurnRules?.length)return'';const ids=historyIds(history,incoming);
 return incoming.osmTurnRules.flatMap(rule=>progress(rule,ids).map(p=>`${rule.id}:${p.index}:${p.step}`)).sort().join(',');
}
export default function attachTurnRules(arcs,rules=[]){
 const byArc=new Map();for(const rule of rules)for(const id of new Set(rule.paths.flatMap(p=>p.approach))){if(!byArc.has(id))byArc.set(id,[]);byArc.get(id).push(rule);}
 return arcs.map(arc=>({...arc,osmTurnRules:byArc.get(arc.id)||[]}));
}