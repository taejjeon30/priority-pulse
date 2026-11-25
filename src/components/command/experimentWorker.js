import {simulateNetwork} from '@/components/command/networkSimulation';
self.onmessage=({data})=>{
 try{
  const {snapshot,count,startSeed}=data;
  for(let i=0;i<count;i++){
   const seed=startSeed+i,settings={...snapshot.settings,seed},limit=300-settings.dispatch;
   const runs=simulateNetwork(snapshot.network,settings,snapshot.route,['Fixed-Time','Reactive','PriorityPulse'],false);
   self.postMessage({type:'progress',completed:i+1,row:{seed,results:runs.map(r=>({mode:r.mode,...r.metrics,restrictedTravel:r.metrics.evTime??limit}))}});
  }
  self.postMessage({type:'complete'});
 }catch(error){self.postMessage({type:'error',message:error.message});}
};