import {CircleMarker,Tooltip} from 'react-leaflet';
export default function PrioritySignalLayers({sim,frame,network,mode}){
 if(mode!=='PriorityPulse'||!sim.layers.signals||!frame||!frame.fleet?.some(u=>u.arrival===null&&frame.t>=u.dispatch))return null;
 const active=frame.decisions.filter(d=>d.eta>=0&&d.eta<=36&&d.target===d.evPhase&&d.networkPlan&&d.networkPlan!=='Hold / required recovery'&&frame.nodes.some(n=>n.id===d.id&&n.state==='Green'&&n.phase===d.evPhase));
 return active.map(d=>{const node=network.nodes.find(n=>n.id===d.id);return node?<CircleMarker key={`priority-${d.id}`} bubblingMouseEvents={false} center={[node.lat,node.lng]} radius={16} pathOptions={{className:'cc-priority-ring',color:'hsl(var(--ring))',weight:4,fill:false}} eventHandlers={{click:()=>sim.nodeClick(node.id)}}><Tooltip>{node.name} · Priority plan serving the ambulance approach<br/>Forecast ambulance ETA: {d.eta.toFixed(1)}s</Tooltip></CircleMarker>:null;});
}