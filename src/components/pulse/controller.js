export function candidates(node,down,eta,rate,flow,mode){
 const actions=[{name:'Hold current phase',target:node.phase,start:99},{name:'Transition now',target:1-node.phase,start:0},{name:'Extend 5 seconds, then transition',target:1-node.phase,start:5}];
 return actions.map(a=>{let q=[...node.q],wait=[...node.wait],terms={emergency:0,queue:0,delay:0,spillback:0,fairness:0,change:a.start<36?6:0};
 for(let k=0;k<36;k++){const clearance=a.start<99&&k>=a.start&&k<a.start+5,phase=k>=a.start+5?a.target:node.phase,elapsed=k>=a.start+5?k-a.start-5:node.elapsed+k;
 for(let j=0;j<4;j++){const can=!clearance&&phase===(j<2?0:1)&&down[j]<.85;const d=can?Math.min(q[j]+rate[j],flow*(1-Math.exp(-(elapsed+1)/1.6))):0;q[j]=Math.max(0,q[j]+rate[j]-d);wait[j]=d>0?0:wait[j]+1;terms.queue+=.012*q[j]*q[j];terms.delay+=.35*q[j];terms.spillback+=8*Math.pow(q[j]/node.cap[j],3);terms.fairness+=30*Math.pow(Math.max(0,(wait[j]-60)/60),2);}
 if(eta>=0&&k>=eta&&(!(!clearance&&phase===0)||q[node.evDir]>1))terms.emergency+=eta<=25?160:40;
 }
 const legal=node.state==='Green'&&node.elapsed>=8&&node.ped===0;
 return {...a,terms,cost:Object.values(terms).reduce((a,b)=>a+b,0),legal:a.start===99||legal};
 });
}
export function choose(node,table,eta,mode,prep){
 if(node.state!=='Green'||node.elapsed<8||node.ped>0)return{target:node.phase,reason:node.ped?'Pedestrian clearance is protected':'Minimum green or safety clearance is protected'};
 let target=node.phase,reason='Lowest predicted 36-second cost';
 if(mode==='Fixed-Time'){target=node.elapsed>=(node.phase===0?34:20)?1-node.phase:node.phase;reason='Scheduled fixed-time phase';}
 else if(mode==='Reactive'){target=eta>=0&&eta<=12?0:(node.elapsed>=(node.phase===0?34:20)?1-node.phase:node.phase);reason=eta>=0&&eta<=12?'Emergency detected within 12 seconds':'Scheduled phase; detector not active';}
 else{const best=table.filter(x=>x.legal).sort((a,b)=>a.cost-b.cost)[0];target=best.start===0?best.target:node.phase;if(eta>=0&&eta<=prep){target=0;reason='Proactive queue clearance: ETA is within preparation time';}else if(Math.max(...node.wait)>=100){target=node.wait.indexOf(Math.max(...node.wait))<2?0:1;reason='Anti-starvation: serve the longest-waiting approach';}}
 if(node.elapsed>=45){target=1-node.phase;reason='Maximum green reached; safe transition required';}
 return{target,reason};
}