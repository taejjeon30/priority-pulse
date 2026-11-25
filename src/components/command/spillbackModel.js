import {forecastLink,queueBand} from '@/components/command/queueForecast';
export const storage = a => Math.max(1,Math.floor(a.length*a.lanes/7.5));
export function roadState(a,count,queue,previous,entered,departed,blocked,admitted,oldCount,transferred=0,vehicles=[],estimate,boundary=0,node){
 const capacity=storage(a),jam=a.lanes/7.5,free=a.speed/3.6;
 // Both flows cross the physical link boundary. Rejected external demand stays outside.
 const inFlow=(previous?.inFlow||0)*.9+.1*admitted,outFlow=(previous?.outFlow||0)*.9+.1*departed,transferFlow=(previous?.transferFlow||0)*.9+.1*transferred;
 const arrivalDensity=Math.min(.95*jam,inFlow/Math.max(1,free));
 const shockwave=queue?Math.max(-free,Math.min(free,(outFlow-inFlow)/(jam-arrivalDensity))):0;
 const queueLength=queue?Math.min(a.length,Math.max(...vehicles.filter(v=>v.queued).map(v=>(1-v.progress)*a.length))+7.5/a.lanes):0,projectedFront=Math.max(0,Math.min(a.length,queueLength-shockwave*30));
 const forecast=forecastLink(a,vehicles,estimate,transferFlow,boundary),green=node.state==='Green'&&node.phase===a.approach,queuePrediction=queueBand(queue,forecast,k=>green?.5*Math.min(a.lanes,node.lanes[a.approach])*(1-Math.exp(-(node.elapsed+k+1)/1.6)):0,capacity);
 return{queuePrediction,capacity,count,queue,queueLength,projectedFront,shockwave,inFlow,outFlow,transferFlow,density:count/a.length,occupancy:count/capacity,entered,departed,blocked,massError:count-(oldCount+entered-departed),reachesUpstream:queueLength>=a.length-1e-6};
}