import {useState} from 'react';
import ExperimentControls from '@/components/command/ExperimentControls';
import ExperimentResults from '@/components/command/ExperimentResults';
import CoverageAudit from '@/components/command/CoverageAudit';
import NetworkCompare from '@/components/command/NetworkCompare';
import SumoBenchmark from '@/components/command/SumoBenchmark';
import useSumoBenchmark from '@/components/command/useSumoBenchmark';
export default function ExperimentLab({sim}){
 const [view,setView]=useState('Batch experiments'),job=sim.experiment,benchmark=useSumoBenchmark();
 function replay(snapshot,seed){sim.replayExperiment(snapshot,seed);setView('Single mission replay');}
 return <div><div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Experiment lab views">{['Batch experiments','Single mission replay','Coverage audit','SUMO benchmark'].map(name=><button type="button" key={name} role="tab" aria-selected={view===name} className={view===name?'cc-primary':'cc-button'} onClick={()=>setView(name)}>{name}</button>)}</div>{view==='SUMO benchmark'?<SumoBenchmark sim={sim} job={benchmark}/>:view==='Coverage audit'?<CoverageAudit/>:view==='Single mission replay'?<NetworkCompare sim={sim}/>:<><ExperimentControls sim={sim}/>{job.result?.rows.length>0?<ExperimentResults key={job.result.startedAt} result={job.result} onReplay={replay}/>:!job.busy&&<p className="cc-muted mt-5">No completed experiment pairs yet. Run a batch using the current draft, then compare outcomes, replay individual seeds, or export results. Export JSON to retain the exact configuration and statistical summaries.</p>}</>}</div>;
}