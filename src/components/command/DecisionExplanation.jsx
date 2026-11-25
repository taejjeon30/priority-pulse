import {approachNames} from '@/components/command/network';
export default function DecisionExplanation({decision:d,mode}){
 const phase=approachNames[d.target],plans={'Hold / required recovery':'complete required recovery before considering priority','Independent local proposals':'balance approach queues and predicted ambulance delay','Emergency corridor':'prepare the ambulance corridor ahead of its arrival','Downstream queue relief':'release queued traffic to free receiving space','Coordinated corridor + relief':'coordinate the ambulance corridor with congested receiving roads'};
 let reason=d.reason;
 if(d.reason==='Protected pedestrian clearance requested')reason='Begin yellow and all-red clearance, then provide a protected pedestrian walk before traffic resumes.';
 else if(d.reason==='Maximum green reached')reason=`Request the ${phase} approach because the current green reached its time limit.`;
 else if(d.reason==='Longest-waiting approach prioritized')reason=`Request the ${phase} approach to serve the longest-waiting traffic.`;
 else if(mode==='PriorityPulse')reason=`${d.target===d.phase?'Keep':'Request'} the ${phase} approach to ${plans[d.networkPlan]||'follow the lowest-cost legal network plan'}. ${d.target===d.phase?'Required clearance is still respected.':'Yellow and all-red clearance come before the new green.'}`;
 else if(mode==='Reactive')reason=`Request the ${phase} approach ${d.reason.includes('serve the emergency')?'because the ambulance has reached its incoming road':'to resume the configured signal cycle'}. Required clearance comes first.`;
 else reason=`Advance to the ${phase} approach on the configured fixed-time schedule, after yellow and all-red clearance.`;
 return <strong>{reason}</strong>;
}