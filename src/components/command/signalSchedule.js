// Mirror the plant's mandatory clearance states for each held-phase candidate.
export default function signalSchedule(node,target,horizon=36){
 let state=node.state,phase=node.phase,elapsed=node.elapsed,ped=node.ped,pending=node.pending,scheduled=state!=='Green',selected=scheduled?node.target:target;const result=[];
 for(let k=0;k<horizon;k++){
  if(!scheduled&&state==='Green'&&elapsed>=8&&!ped&&(selected!==phase||pending)){state='Yellow';elapsed=0;scheduled=true;}
  result.push({green:state==='Green',phase,elapsed});elapsed++;
  if(state==='Yellow'&&elapsed>=node.yellow){state='All-red';elapsed=0;}
  else if(state==='All-red'&&elapsed>=node.allRed){if(pending){state='Walk';ped=node.pedestrian;pending=false;elapsed=0;}else{phase=selected;state='Green';elapsed=0;}}
  else if(state==='Walk'){ped=Math.max(0,ped-1);if(!ped){phase=selected;state='Green';elapsed=0;}}
 }
 return result;
}