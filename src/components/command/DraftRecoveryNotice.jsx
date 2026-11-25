import {Undo2} from 'lucide-react';
export default function DraftRecoveryNotice({sim}){
 return <div className="cc-notice flex flex-wrap items-center justify-between gap-3">
  <div>{sim.message&&<p role="status">{sim.message}</p>}{sim.draftWarning?<p className="cc-error" role="alert">{sim.draftWarning} <button className="cc-text-button" onClick={()=>sim.setTab('My scenarios')}>Save to account</button></p>:<small className="text-muted-foreground">Draft saved in this browser, not to your account.</small>}</div>
  {sim.canUndo&&<button className="cc-button" onClick={sim.undoDraft}><Undo2 size={14}/>Undo last edit</button>}
 </div>;
}