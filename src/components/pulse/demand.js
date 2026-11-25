export const scenarios = [
 {id:'rush',name:'Rush-Hour Ambulance',tag:'Heavy commute. Every second matters.',intensity:.82,speed:1,flow:1,side:1},
 {id:'school',name:'School Dismissal',tag:'Protect crossings during the afternoon rush.',intensity:.62,speed:.75,flow:.9,side:1.5},
 {id:'stadium',name:'Stadium Exit',tag:'Outbound surges test the storage guard.',intensity:.9,speed:1,flow:1,side:2.5},
 {id:'crash',name:'Crash Diversion',tag:'A restricted block changes the whole corridor.',intensity:.7,speed:.85,flow:.65,side:1.8},
 {id:'fire',name:'Fire Station Dispatch',tag:'Coordinate three signals for a fire engine.',intensity:.6,speed:1,flow:1,side:1},
 {id:'snow',name:'Rain or Snow',tag:'Lower speeds. Longer queue clearance.',intensity:.66,speed:.65,flow:.72,side:1}
];
export const modes=['Fixed-Time','Reactive','PriorityPulse'];
export const streets=['Oak St','Pine Ave','Maple Dr'];
export function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function normal(r){return Math.sqrt(-2*Math.log(Math.max(r(),1e-10)))*Math.cos(2*Math.PI*r());}
function gamma(a,r){if(a<1)return gamma(a+1,r)*Math.pow(r(),1/a);const d=a-1/3,c=1/Math.sqrt(9*d);for(;;){let x=normal(r),v=1+c*x;if(v<=0)continue;v=v*v*v;let u=r();if(u<1-.0331*x*x*x*x||Math.log(u)<.5*x*x+d*(1-v+Math.log(v)))return d*v;}}
function poisson(l,r){let p=1,k=0;do{k++;p*=r();}while(p>Math.exp(-l));return k-1;}
export function demand(config){const s=scenarios.find(x=>x.id===config.scenario),r=random(config.seed),rows=[];for(let t=0;t<300;t++){const a=gamma(s.intensity*28,r),b=gamma((1-s.intensity)*28,r),K=.05+.95*a/(a+b);rows.push({arrivals:Array.from({length:12},(_,j)=>poisson((j%4<2?.65:.23*s.side)*K,r)),peds:Array.from({length:3},()=>r()<(s.id==='school'?.035:.008))});}return rows;}