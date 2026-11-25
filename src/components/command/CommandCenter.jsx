import {Activity,Layers,GitBranch} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import {Link} from 'react-router-dom';
import useCommand from '@/components/command/useCommand';
import CommandNavigation from '@/components/command/CommandNavigation';
import CommandMap from '@/components/command/CommandMap';
import AreaLoader from '@/components/command/AreaLoader';
import DispatchCard from '@/components/command/DispatchCard';
import CommandPlayback from '@/components/command/CommandPlayback';
import NetworkTimeline from '@/components/command/NetworkTimeline';
import InspectionPanel from '@/components/command/InspectionPanel';
import LiveAnalytics from '@/components/command/LiveAnalytics';
import DecisionLog from '@/components/command/DecisionLog';
import ExperimentLab from '@/components/command/ExperimentLab';
import ScenarioLibrary from '@/components/command/ScenarioLibrary';
import AlgorithmView from '@/components/command/AlgorithmView';
import BuilderTools from '@/components/command/BuilderTools';
import MapTools from '@/components/command/MapTools';
import IncidentPanel from '@/components/command/IncidentPanel';
import DemandDiagnostics from '@/components/command/DemandDiagnostics';
import '@/components/command/intelligence.css';
import '@/components/command/command.css';
import '@/components/command/humane.css';
import {controllerLabels} from '@/components/command/controllerLabels';
import DraftRecoveryNotice from '@/components/command/DraftRecoveryNotice';
import QuickStart from '@/components/command/QuickStart';
import CorridorImportDetails from '@/components/command/CorridorImportDetails';
import FleetStatus from '@/components/command/FleetStatus';
export default function CommandCenter(){
 const sim=useCommand(),{user}=useAuth(),builder=sim.tab==='Scenario builder',mapTab=builder||sim.tab==='Command center';
 return <div className="command-shell"><CommandNavigation sim={sim}/><div className="cc-workspace"><header className="cc-topbar"><span>Operations <i>/</i><b>{sim.tab==='Comparison lab'?'Experiment lab':sim.tab}</b></span><div><span className="cc-environment"><i/> SIMULATION ONLY</span><div className="cc-view-switch"><button className={!sim.engineer?'selected':''} onClick={()=>sim.setEngineer(false)}>Community</button><button className={sim.engineer?'selected':''} onClick={()=>sim.setEngineer(true)}>Engineer</button></div>{!user&&<Link to="/login?returnTo=/">Sign in</Link>}</div></header><main className="cc-main"><div className="cc-heading"><div><span className="cc-eyebrow"><Activity size={12}/> TRAFFIC SIMULATION</span><h1>{builder?'Build a traffic scenario':sim.tab==='Comparison lab'?'Compare signal controllers':sim.tab==='My scenarios'?'Save and reopen scenarios':sim.tab==='Command center'?'Simulate an ambulance response':'Inspect the traffic model'}</h1></div></div>
 <DraftRecoveryNotice sim={sim}/>{sim.tab==='Command center'&&<QuickStart/>}{mapTab?<><AreaLoader sim={sim}/><CorridorImportDetails network={sim.draft.network}/>{builder?<BuilderTools sim={sim}/>:<><LiveAnalytics sim={sim}/><DemandDiagnostics sim={sim}/></>}<div className="cc-command-grid"><div className="cc-map-column"><MapTools sim={sim}/><section className="cc-card cc-map-card"><div className="cc-map-toolbar"><div><b>{sim.draft.network.name}</b><small>{sim.draft.network.nodes.length} intersections · {sim.draft.network.roads.length} roads</small><small>{sim.draft.network.source} · Traffic is simulated</small></div><label><input type="checkbox" checked={sim.heat} onChange={e=>sim.setHeat(e.target.checked)}/><Layers size={14}/> Heatmap</label></div>{!builder&&<div className="cc-mode-tabs">{['Fixed-Time','Reactive','PriorityPulse'].map(m=><button className={sim.mode===m?'selected':''} key={m} onClick={()=>sim.setMode(m)}>{controllerLabels[m]}</button>)}<span>Signal color indicates the active approach only</span></div>}<CommandMap sim={sim}/><div className="cc-legend"><span><i className="low"/>Low &lt;40%</span><span><i className="moderate"/>Moderate 40–65%</span><span><i className="heavy"/>Heavy 65–85%</span><span><i className="severe"/>Severe ≥85%</span><span>Blue: origin · Purple: hospital endpoint</span><span>Dashed ring: priority plan serving ambulance approach</span></div></section><CommandPlayback sim={sim}/>{!builder&&<><NetworkTimeline sim={sim}/><FleetStatus sim={sim}/><DecisionLog sim={sim}/></>}</div><aside className="cc-detail-column">{builder?<section className="cc-card cc-builder-intro"><GitBranch size={24}/><h2>Shape your scenario</h2><p>Place intersections, connect roads, then click any item to configure it. Load real roads above to begin from geography.</p><button className="cc-primary" onClick={()=>sim.setTab('Command center')}>Finish & dispatch</button></section>:<><IncidentPanel sim={sim}/><DispatchCard sim={sim}/></>}<InspectionPanel sim={sim}/></aside></div></>:sim.tab==='Comparison lab'?<ExperimentLab sim={sim}/>:sim.tab==='My scenarios'?<ScenarioLibrary sim={sim}/>:<AlgorithmView/>}
 <footer className="cc-footer">Evaluate emergency response strategies before field deployment.<span>Simulation estimates · Model scope in Algorithm view</span></footer></main></div></div>;
}