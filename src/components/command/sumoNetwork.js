import {turnAllowed} from '@/components/command/network';
export const xml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export const documentXml=(tag,rows)=>`<?xml version="1.0" encoding="UTF-8"?>\n<${tag}>\n${rows.join('\n')}\n</${tag}>\n`;
export default function sumoNetwork(network,arcs,run,demand){
 const nodeIds=new Map(network.nodes.map((n,i)=>[n.id,`n${i}`])),edgeIds=new Map(arcs.map((a,i)=>[a.id,`e${i}`])),exits=new Map(network.nodes.map((n,i)=>[n.id,`exit${i}`])),connections=[],assignments=[],nodeRows=[],edgeRows=[],logic=[];
 const [lat,lng]=network.center,xy=p=>[(p[1]-lng)*111320*Math.cos(lat*Math.PI/180),(p[0]-lat)*111320],format=p=>xy(p).map(n=>n.toFixed(3)).join(',');
 const pairs=new Set();for(const ids of [...demand.flatMap(row=>row.vehicles.map(v=>v.route)),...run.fleetOutcomes.map(u=>u.route.arcs.map(a=>a.id))])for(let i=1;i<ids.length;i++)pairs.add(`${ids[i-1]}|${ids[i]}`);
 for(const n of network.nodes){
  const id=nodeIds.get(n.id),[x,y]=xy([n.lat,n.lng]),incoming=arcs.filter(a=>a.to===n.id),outgoing=arcs.filter(a=>a.from===n.id),links=[];
  nodeRows.push(`<node id="${id}" x="${x.toFixed(3)}" y="${y.toFixed(3)}" type="${incoming.length?'traffic_light':'priority'}" radius="0.1"/>`,`<node id="sink${id}" x="${(x+1).toFixed(3)}" y="${(y+1).toFixed(3)}" type="priority"/>`);
  edgeRows.push(`<edge id="${exits.get(n.id)}" from="${id}" to="sink${id}" numLanes="1" speed="30" length="1"/>`);
  for(const a of incoming){
   const targets=outgoing.filter(b=>turnAllowed(a,b,[a])||turnAllowed(a,b,[a],'emergency')||pairs.has(`${a.id}|${b.id}`));
   for(const target of [...targets,null])for(let lane=0;lane<a.lanes;lane++){
    const index=links.length;links.push(a.approach);const attributes=`from="${edgeIds.get(a.id)}" to="${target?edgeIds.get(target.id):exits.get(n.id)}" fromLane="${lane}" toLane="${target?Math.min(lane,target.lanes-1):0}"`;connections.push(`<connection ${attributes}/>`);assignments.push(`<connection ${attributes} tl="${id}" linkIndex="${index}"/>`);
   }
  }
  if(links.length){const phases=[];for(const frame of run.frames){const live=frame.nodes.find(v=>v.id===n.id),state=links.map(phase=>live.phase===phase?(live.state==='Green'?'G':live.state==='Yellow'?'y':'r'):'r').join('');if(phases.at(-1)?.state===state)phases.at(-1).duration++;else phases.push({state,duration:1});}
   logic.push(`<tlLogic id="${id}" type="static" programID="0" offset="0">${phases.map(p=>`<phase duration="${p.duration}" state="${p.state}"/>`).join('')}</tlLogic>`);
  }
 }
 for(const a of arcs)edgeRows.push(`<edge id="${edgeIds.get(a.id)}" from="${nodeIds.get(a.from)}" to="${nodeIds.get(a.to)}" numLanes="${a.lanes}" speed="${(a.speed/3.6).toFixed(6)}" length="${a.length}" shape="${a.geometry.map(format).join(' ')}"/>`);
 return {files:{'network.nod.xml':documentXml('nodes',nodeRows),'network.edg.xml':documentXml('edges',edgeRows),'network.con.xml':documentXml('connections',connections),'signals.tll.xml':documentXml('tlLogics',[...logic,...assignments])},edgeIds,exits};
}