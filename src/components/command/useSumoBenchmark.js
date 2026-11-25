import {useEffect,useRef,useState} from 'react';
import validateManifest from '@/components/command/sumoManifest';
import sumoImport from '@/components/command/sumoImport';
export default function useSumoBenchmark(){
 const worker=useRef(null),undoState=useRef(null),[canUndo,setCanUndo]=useState(false),[manifest,setManifest]=useState(null),[files,setFiles]=useState(null),[rows,setRows]=useState([]),[busy,setBusy]=useState(false),[reading,setReading]=useState(false),[error,setError]=useState(''),[progress,setProgress]=useState('');
 useEffect(()=>()=>worker.current?.terminate(),[]);
 function remember(){undoState.current={manifest,files,rows,progress};setCanUndo(true);}
 function undo(){if(busy||reading||!undoState.current)return;const prior=undoState.current;setManifest(prior.manifest);setFiles(prior.files);setRows(prior.rows);setProgress(`Last benchmark change undone. ${prior.progress||'Prepare a package or restore a manifest to continue.'}`);setError('');undoState.current=null;setCanUndo(false);}
 function cancel(){worker.current?.terminate();worker.current=null;setBusy(false);setProgress('Preparation cancelled. Existing benchmark data is unchanged.');}
 function prepare(snapshot,startSeed,count){
  if(busy||reading)return;if(!Number.isInteger(count)||count<1||count>10||!Number.isInteger(startSeed)||startSeed<1||startSeed+count-1>999999){setError('Choose 1–10 seeds within 1–999999.');return;}
  setError('');setBusy(true);setProgress('Preparing seed 1…');
  try{const w=new Worker(new URL('./sumoBenchmarkWorker.js',import.meta.url),{type:'module'});worker.current=w;
   const stop=()=>{w.terminate();worker.current=null;setBusy(false);};
   w.onmessage=({data})=>{if(worker.current!==w)return;if(data.type==='progress')setProgress(`Prepared ${data.completed}/${data.total} seeds`);else if(data.type==='complete'){remember();setManifest(data.manifest);setFiles(data.files);setRows([]);setProgress('Package ready. Download it, then run SUMO externally.');stop();}else{setError(`${data.message} Adjust the scenario and prepare again.`);stop();}};
   w.onerror=e=>{e.preventDefault();if(worker.current===w){setError('Preparation stopped. Try fewer seeds or a smaller network.');stop();}};w.postMessage({snapshot:structuredClone(snapshot),startSeed,count});
  }catch(error){worker.current?.terminate();worker.current=null;setBusy(false);setError(`${error.message} Reload and try again.`);}
 }
 async function restore(file){if(!file||busy||reading)return;setError('');setReading(true);try{if(file.size>15*1024*1024)throw new Error('Manifest exceeds 15 MB. Export fewer seeds.');const m=validateManifest(JSON.parse(await file.text()));remember();setManifest(m);setFiles(null);setRows([]);setProgress('Benchmark restored. Import its SUMO tripinfo files.');}catch(error){setError(error instanceof SyntaxError?'This is not valid manifest JSON. Select manifest.json from the exported package.':error.message);}finally{setReading(false);}}
 async function importResults(selected){if(!manifest||!selected.length||busy||reading)return;setError('');setReading(true);try{
  if(selected.length>10||selected.some(f=>f.size>15*1024*1024)||selected.reduce((sum,f)=>sum+f.size,0)>50*1024*1024)throw new Error('Select at most 10 XML files, each under 15 MB and under 50 MB total.');
  const parsed=[];for(const f of selected)parsed.push(sumoImport(await f.text(),manifest));if(new Set(parsed.map(r=>r.seed)).size!==parsed.length)throw new Error('More than one output has the same seed. Select one tripinfo file per seed.');
  remember();setRows(previous=>[...previous.filter(r=>!parsed.some(p=>p.seed===r.seed)),...parsed].sort((a,b)=>a.seed-b.seed));setProgress('SUMO inputs validated. Compare the results and model differences below.');
 }catch(error){setError(error.message);}finally{setReading(false);}}
 return {manifest,files,rows,busy,reading,error,progress,prepare,cancel,restore,importResults,canUndo,undo};
}