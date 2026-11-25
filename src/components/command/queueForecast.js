// Gamma–Poisson predictive moments (negative binomial), not a Poisson plug-in mean alone.
export function gammaPoissonMoments(p,seconds){const mean=p.alpha*seconds/p.beta;return{mean,variance:mean+p.alpha*seconds*seconds/(p.beta*p.beta)};}
export function forecastLink(a,vehicles,posterior,transferFlow=0,boundary=0,horizon=36){
 const travel=a.length/(a.speed/3.6),known=Array(horizon).fill(0),arrivals=[],variance=[];let knownTotal=0;
 for(const v of vehicles)if(!v.queued){const step=Math.max(0,Math.ceil((1-v.progress)*travel)-1);if(step<horizon)known[step]++;}
 // Boundary vehicles already observed are not sampled again. Earliest admission is one per second.
 for(let i=0;i<boundary;i++){const step=Math.ceil(travel)+i;if(step>=horizon)break;known[step]++;}
 let previous=0;
 for(let k=0;k<horizon;k++){
  knownTotal+=known[k];const exposure=Math.max(0,k+1-travel),g=gammaPoissonMoments(posterior,exposure),internal=transferFlow*exposure,total=knownTotal+g.mean+internal;
  arrivals.push(Math.max(0,total-previous));variance.push(g.variance+internal);previous=total;
 }
 return{arrivals,variance};
}
export function forecastApproaches(incoming,slots,input,previousRoads,backlog){
 const arrivals=Array.from({length:36},()=>[0,0,0,0]),variance=Array.from({length:36},()=>[0,0,0,0]),capacity=[0,0,0,0],links={};
 for(const a of incoming){const f=forecastLink(a,slots[a.id],input.estimates[a.id],previousRoads[a.id]?.transferFlow||0,backlog.filter(v=>v.route[0]===a.id).length);links[a.id]=f;capacity[a.approach]+=Math.max(1,Math.floor(a.length*a.lanes/7.5));for(let k=0;k<36;k++){arrivals[k][a.approach]+=f.arrivals[k];variance[k][a.approach]+=f.variance[k];}}
 return{arrivals,variance,capacity,links};
}
export function queueBand(queue,forecast,service,capacity,horizon=30){
 let q=queue,waiting=0;for(let k=0;k<horizon;k++){const offered=Math.max(0,q+waiting+forecast.arrivals[k]-(typeof service==='function'?service(k):service));waiting=Math.max(0,offered-capacity);q=Math.min(capacity,offered);}const sd=Math.sqrt(forecast.variance[horizon-1]);
 return{mean:q,low:Math.max(0,q-1.96*sd),high:Math.min(capacity,q+1.96*sd),overflow:waiting};
}