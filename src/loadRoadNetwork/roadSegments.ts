import {drivableWay,oneWay,directionAttributes,osmTags} from './roadAttributes.ts';
import {distance,clipWays} from './corridorGraph.ts';
export default function roadSegments(elements,center,radius,restrictionNodes){
 const points=new Map(elements.filter(e=>e.type==='node').map(e=>[e.id,e])),ways=clipWays(elements.filter(e=>e.type==='way'&&drivableWay(e)),points,center,radius),counts=new Map(),segments=[];
 for(const w of ways)for(const id of new Set(w.nodes))counts.set(id,(counts.get(id)||0)+1);
 for(const way of ways){let start=0;for(let i=1;i<way.nodes.length;i++){
  const id=way.nodes[i];if(i!==way.nodes.length-1&&(counts.get(id)||0)<2&&!restrictionNodes.has(id)&&points.get(id)?.tags?.highway!=='traffic_signals')continue;
  const path=way.nodes.slice(start,i+1).map(n=>points.get(n));start=i;
  if(path.length<2||path[0].id===path.at(-1).id)continue;
  const length=path.slice(1).reduce((sum,p,j)=>sum+distance(path[j],p),0);if(length<2)continue;
  const tags=way.tags,direction=oneWay(tags),reverse=direction==='reverse',forward=directionAttributes(tags,reverse?'backward':'forward',direction),backward=directionAttributes(tags,'backward',direction),oriented=reverse?[...path].reverse():path;
  segments.push({id:`r${way.id}-${path[0].id}-${path.at(-1).id}`,osmWayId:String(way.id),from:String(oriented[0].id),to:String(oriented.at(-1).id),name:tags.name||'Unnamed road',length:Math.max(2,Math.round(length)),lanes:forward.lanes,speed:forward.speed,direction:direction==='both'?'both':'forward',directional:direction==='both'?{forward,backward}:{forward},osmTags:osmTags(tags),volume:350,turns:['left','straight','right'],closed:false,geometry:oriented.map(p=>[p.lat,p.lon])});
 }}
 return {points,segments};
}