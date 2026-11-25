import {random} from '@/components/pulse/demand';
import {turnAllowed} from '@/components/command/network';
import {beta,poisson,weightedPick,posterior} from '@/components/command/stochasticMath';
import {modelParameters,demandMean,densityMultiplier} from '@/components/command/demandModel';
export default function trafficDemand(arcs,settings){
 const r=random(settings.seed),routeRandom=random((Number(settings.seed)^0x51ED270B)>>>0),p=modelParameters(settings),mult=densityMultiplier(settings.density),rows=[],groups=new Map(),observed=Object.fromEntries(arcs.map(a=>[a.id,0]));let id=0,total=0,splits={};
 const base=Object.fromEntries(arcs.map(a=>[a.id,Math.max(0,a.volume)/3600*mult]));
 for(const a of arcs){if(!groups.has(a.to))groups.set(a.to,[]);groups.get(a.to).push(a);}
 for(let t=0;t<300;t++){
  // Normalize Beta weights at each junction; preserve the sum of configured local entry rates.
  if(t%30===0)for(const group of groups.values()){
   const sum=group.reduce((s,a)=>s+base[a.id],0),weights=group.map(a=>base[a.id]===0?0:beta(base[a.id]/Math.max(sum,1e-12),p.splitPrecision,r)),norm=weights.reduce((s,v)=>s+v,0);
   group.forEach((a,i)=>{splits[a.id]=norm?weights[i]/norm:0;});
  }
  const hour=(p.startHour+t/3600)%24,mean=demandMean(hour,p),K=p.kMin+(p.kMax-p.kMin)*beta(mean,p.demandPrecision,r),vehicles=[],rates={},estimates={},arrivals={};
  for(const group of groups.values()){
   const sum=group.reduce((s,a)=>s+base[a.id],0);
   for(const arc of group){
    const rate=sum*splits[arc.id]*K,count=poisson(rate,r);rates[arc.id]=rate;arrivals[arc.id]=count;observed[arc.id]+=count;total+=count;
    estimates[arc.id]=posterior(Math.max(.001,base[arc.id])*p.priorSeconds,p.priorSeconds,observed[arc.id],t+1);
    for(let k=0;k<count;k++){
     const route=[arc.id];let last=arc;const hops=1+Math.floor(routeRandom()*4);
     for(let j=0;j<hops;j++){const options=arcs.filter(a=>a.from===last.to&&turnAllowed(last,a,route));if(!options.length)break;const weights=options.map(a=>{const turn=(a.approach-last.approach+4)%4;return beta(turn===0?.6:.2,p.splitPrecision,routeRandom);});last=weightedPick(options,weights,routeRandom);route.push(last.id);}
     vehicles.push({id:`v${++id}`,route});
    }
   }
  }
  rows.push({vehicles,rates,estimates,arrivals,K,hour,betaDemand:{mean,alpha:mean*p.demandPrecision,beta:(1-mean)*p.demandPrecision},splits:{...splits},observed:total,parameters:p});
 }
 return rows;
}