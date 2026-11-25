import {findRoute} from '@/components/command/network';
export default function fleetMissions(network,settings,route){
 const primary={id:settings.primaryUnit||'AMB-001',origin:route.arcs[0]?.from,destination:route.arcs.at(-1)?.to,priority:settings.priority,dispatch:settings.dispatch,route};
 return [primary,...(settings.missions||[]).slice(0,3)].map(config=>{
  const selected=config.route||findRoute(network,config.origin,config.destination);if(!selected?.arcs.length)throw new Error(`${config.id} has no legal route. Choose different endpoints or reopen a road.`);
  return {...config,route:selected,evIndex:0,evProgress:0,arrival:null,velocity:0,distance:0,evDelay:0,stops:0,lastStopped:false,signalWait:0,lastReroute:-15,reroutes:0,predictedRemaining:selected.prediction,routeReason:'Initial legal route; predicted travel times are estimates.'};
 });
}