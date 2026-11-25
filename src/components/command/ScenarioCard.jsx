import {useState} from 'react';
import {FolderOpen,Copy,Trash2} from 'lucide-react';
export default function ScenarioCard({scenario:s,busy,onOpen,onDuplicate,onDelete}){
 const [confirming,setConfirming]=useState(false);
 return <section className="cc-card">
  <span className="cc-tag">SEED {s.settings.seed}</span><h3>{s.name}</h3>
  <p>{s.network.nodes.length} intersections · {s.network.roads.length} roads</p><small>{s.network.source}</small>
  {confirming?<div className="mt-3"><p>Delete “{s.name}”? Its saved network and traffic settings will be removed from your account. Your current browser draft stays. You can restore the most recently deleted scenario here.</p><div className="cc-actions"><button className="cc-button" disabled={busy} onClick={()=>onDelete(s)}><Trash2 size={14}/>Delete scenario</button><button className="cc-button" disabled={busy} onClick={()=>setConfirming(false)}>Keep scenario</button></div></div>:<div className="cc-actions">
   <button className="cc-button" disabled={busy} onClick={()=>onOpen(s)}><FolderOpen size={14}/>Open</button>
   <button className="cc-button" disabled={busy} onClick={()=>onDuplicate(s)}><Copy size={14}/>Duplicate</button>
   <button className="cc-button" disabled={busy} onClick={()=>setConfirming(true)}><Trash2 size={14}/>Delete</button>
  </div>}
 </section>;
}