import {findRoute} from '@/components/command/network';
export default function missionEndpoints(network){
 const outgoing=new Set(network.roads.filter(r=>!r.closed).flatMap(r=>r.direction==='both'?[r.from,r.to]:r.direction==='reverse'?[r.to]:[r.from]));
 if(network.hospital?.endpointId&&network.nodes.some(n=>n.id===network.hospital.endpointId)){
  const destination=network.hospital.endpointId,candidates=network.nodes.filter(n=>n.id!==destination&&outgoing.has(n.id)).map(n=>({origin:n.id,route:findRoute(network,n.id,destination)})).filter(c=>c.route);
  const withinWindow=candidates.filter(c=>c.route.prediction<=240),pool=withinWindow.length?withinWindow:candidates;
  pool.sort((a,b)=>withinWindow.length?b.route.distance-a.route.distance:a.route.prediction-b.route.prediction);
  if(pool.length)return {origin:pool[0].origin,destination};
 }
 const origin=network.nodes.find(n=>outgoing.has(n.id))?.id;let match=null;
 for(const n of network.nodes){if(n.id===origin)continue;const route=findRoute(network,origin,n.id);if(route&&(!match||route.distance>match.distance))match={...route,id:n.id};}
 return {origin,destination:match?.id||network.nodes.at(-1)?.id};
}