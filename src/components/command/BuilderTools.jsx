import {MousePointer2,Plus,GitBranch} from 'lucide-react';
export default function BuilderTools({sim}){
 const tools=[['inspect','Inspect & edit',MousePointer2],['intersection','Add intersection',Plus],['road','Add road',GitBranch]];
 return <div className="cc-builder-tools">{tools.map(([id,label,Icon])=><button key={id} className={'cc-button '+(sim.tool===id?'selected':'')} onClick={()=>{sim.setTool(id);sim.setFirst(null);sim.setPlaying(false);}}><Icon size={14}/>{label}</button>)}<p>Select a signal or road to edit it. Undo last edit reverses your most recent change. Dispatch again to run the updated settings.</p></div>;
}