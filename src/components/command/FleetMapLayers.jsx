import {Fragment} from 'react';
import {Polyline,CircleMarker,Tooltip} from 'react-leaflet';
import {pointOn} from '@/components/command/network';
export default function FleetMapLayers({sim,frame}){
 if(!frame?.fleet)return null;
 return frame.fleet.map(u=>{const a=u.route.arcs[Math.min(u.evIndex,u.route.arcs.length-1)],position=pointOn(a,u.arrival!==null?1:u.evProgress);return <Fragment key={u.id}>{sim.layers.routes&&<Polyline positions={u.route.arcs.flatMap(a=>a.geometry)} pathOptions={{color:u.id==='AMB-001'?'hsl(var(--primary))':'hsl(var(--muted-foreground))',weight:u.id==='AMB-001'?4:3,dashArray:u.id==='AMB-001'?'7 5':'3 7'}}/>}{sim.layers.traffic&&<CircleMarker center={position} radius={10} pathOptions={{color:'hsl(var(--background))',weight:3,fillColor:u.id==='AMB-001'?'hsl(var(--primary))':'hsl(var(--muted-foreground))',fillOpacity:1}} eventHandlers={{click:()=>sim.setSelection({type:'ambulance',id:u.id})}}><Tooltip permanent direction="top">{u.id} · {frame.t<u.dispatch?'Pending':u.arrival!==null?'Arrived':`${u.reroutes} reroutes`}</Tooltip></CircleMarker>}</Fragment>;});
}