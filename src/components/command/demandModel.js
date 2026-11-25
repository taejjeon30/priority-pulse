export const modelDefaults={startHour:8,demandPrecision:24,splitPrecision:40,priorSeconds:60,kMin:.4,kMax:1.8};
export function modelParameters(settings){const x={...modelDefaults,...settings.demandModel},bound=(v,lo,hi,fallback)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):fallback;return{startHour:bound(x.startHour,0,23.99,8),demandPrecision:bound(x.demandPrecision,2,200,24),splitPrecision:bound(x.splitPrecision,2,200,40),priorSeconds:bound(x.priorSeconds,1,3600,60),kMin:bound(x.kMin,.05,.95,.4),kMax:bound(x.kMax,1.05,3,1.8)};}
export function demandMean(hour,p){
 const peak=(center,width)=>Math.exp(-.5*(Math.min(Math.abs(hour-center),24-Math.abs(hour-center))/width)**2);
 const expected=.65+.65*peak(8,1.5)+.55*peak(17,2);
 return Math.max(.001,Math.min(.999,(expected-p.kMin)/(p.kMax-p.kMin)));
}
export const densityMultiplier = density => ({Low:.4,Medium:1,High:1.6,Extreme:2.4}[density]??1);