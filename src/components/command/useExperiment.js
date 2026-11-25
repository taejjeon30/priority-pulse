import {useEffect,useRef,useState} from 'react';
import {controllerVersion,controllerLabels} from '@/components/command/controllerLabels';
export default function useExperiment(){
 const worker=useRef(null),rows=useRef([]),finishRef=useRef(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState({completed:0,total:0}),[result,setResult]=useState(null),[error,setError]=useState('');
 useEffect(()=>()=>worker.current?.terminate(),[]);
 function start(snapshot,count,startSeed){
  if(busy)return;
  if(!Number.isInteger(count)||count<2||count>1000||!Number.isInteger(startSeed)||startSeed<1||startSeed+count-1>999999){setError('Choose 2–1,000 runs and a seed range within 1–999999.');return;}
  if(!snapshot.route?.arcs.length){setError('Choose a legal emergency route before running experiments.');return;}
  if(!Number.isFinite(snapshot.settings.dispatch)||snapshot.settings.dispatch<0||snapshot.settings.dispatch>=300){setError('Emergency dispatch must occur within the 300-second observation.');return;}
  const config=structuredClone(snapshot),manifest={snapshot:config,requested:count,startSeed,startedAt:new Date().toISOString(),observationSeconds:300,model:'Beta/Gamma–Poisson synchronous network v4',controllerVersion,controllerDefinitions:controllerLabels,sampling:'Seeds vary arrivals, Beta demand, and vehicle route sampling. Geometry, timing, speeds, initial emergency routes, dispatch offsets and pedestrian calls are fixed. PriorityPulse can reroute when enabled; baselines retain initial routes.'};
  rows.current=[];setResult(null);setError('');setBusy(true);setProgress({completed:0,total:count});let w;
  const finish=(status,message='')=>{if(w)w.terminate();worker.current=null;finishRef.current=null;setBusy(false);setError(message);setResult({...manifest,status,rows:[...rows.current]});};
  try{
   w=new Worker(new URL('./experimentWorker.js',import.meta.url),{type:'module'});worker.current=w;finishRef.current=finish;
   w.onmessage=({data})=>{if(worker.current!==w)return;if(data.type==='progress'){rows.current.push(data.row);setProgress({completed:data.completed,total:count});}else if(data.type==='complete')finish('Complete');else if(data.type==='error')finish('Failed','The experiments stopped before all seeds finished. Completed pairs are kept below. Export them or run a smaller batch to try again.');};
   w.onerror=e=>{e.preventDefault();if(worker.current===w)finish('Failed','The experiments stopped before all seeds finished. Completed pairs are kept below. Export them or run a smaller batch to try again.');};
   w.postMessage({snapshot:config,count,startSeed});
  }catch{finish('Failed','The experiments could not start. Keep your current settings and reload this page to try again.');}
 }
 return{busy,progress,result,error,start,cancel:()=>finishRef.current?.('Cancelled · partial results')};
}