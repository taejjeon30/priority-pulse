// Gamma uses the shape/rate convention. All draws use the caller's seeded RNG.
export const normal = r => Math.sqrt(-2*Math.log(Math.max(r(),1e-12)))*Math.cos(2*Math.PI*r());
export function gamma(shape,r){
 if(shape<1)return gamma(shape+1,r)*Math.pow(Math.max(r(),1e-12),1/shape);
 const d=shape-1/3,c=1/Math.sqrt(9*d);
 for(;;){const x=normal(r),v=1+c*x;if(v<=0)continue;const cube=v*v*v,u=Math.max(r(),1e-12);if(u<1-.0331*x**4||Math.log(u)<.5*x*x+d*(1-cube+Math.log(cube)))return d*cube;}
}
export function beta(mean,precision,r){const m=Math.max(.001,Math.min(.999,mean)),a=gamma(m*precision,r),b=gamma((1-m)*precision,r);return a/(a+b);}
export function poisson(rate,r){if(rate<=0)return 0;const threshold=Math.exp(-rate);let product=1,k=0;do{product*=r();k++;}while(product>threshold);return k-1;}
export function weightedPick(items,weights,r){const total=weights.reduce((s,w)=>s+w,0);let x=r()*total;for(let i=0;i<items.length;i++){x-=weights[i];if(x<=0)return items[i];}return items.at(-1);}
export function posterior(shape,exposure,count,seconds){const alpha=shape+count,beta=exposure+seconds,mean=alpha/beta,sd=Math.sqrt(alpha)/beta;return{alpha,beta,mean,sd,low:Math.max(0,mean-1.96*sd),high:mean+1.96*sd};}