import {useEffect,useMemo,useState} from 'react';
import {simulate} from '@/components/pulse/simulation';
export default function useSimulation(){
 const [config,setConfig]=useState({scenario:'rush',seed:7,type:'Ambulance',priority:'Critical',origin:'west',dispatch:30,pedCalls:[]});
 const [active,setActive]=useState(config),[mode,setMode]=useState('PriorityPulse'),[index,setIndex]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(2),[tab,setTab]=useState('Live simulation'),[engineer,setEngineer]=useState(false);
 const runs=useMemo(()=>simulate(active),[active]);const run=runs.find(r=>r.mode===mode),frame=run.frames[index];
 useEffect(()=>{if(!playing)return;const timer=setInterval(()=>setIndex(i=>{if(i>=299){setPlaying(false);return 299;}return i+1;}),1000/speed);return()=>clearInterval(timer);},[playing,speed]);
 function launch(){setActive({...config,dispatch:30,pedCalls:[]});setIndex(0);setPlaying(true);setTab('Live simulation');}
 function pedestrian(i){const updated={...active,pedCalls:[...(active.pedCalls||[]),{t:index,i}]};setActive(updated);}
 return{config,setConfig,active,mode,setMode,index,setIndex,playing,setPlaying,speed,setSpeed,tab,setTab,engineer,setEngineer,runs,run,frame,launch,pedestrian};
}