export function distance(a,b){const r=Math.PI/180,x=(b.lon-a.lon)*r*Math.cos((a.lat+b.lat)*r/2),y=(b.lat-a.lat)*r;return Math.hypot(x,y)*6371000;}
export function clipWays(ways,points,center,radius){
 return ways.flatMap(way=>{const runs=[];let nodes=[];const flush=()=>{if(nodes.length>1)runs.push({...way,nodes});nodes=[];};for(const id of way.nodes){const p=points.get(id);if(p&&distance(p,center)<=radius)nodes.push(id);else flush();}flush();return runs;});
}
export function selectCorridor(segments,points,center,limit){
 const adjacency=new Map();for(const r of segments)for(const [a,b] of [[r.from,r.to],[r.to,r.from]]){if(!adjacency.has(a))adjacency.set(a,[]);adjacency.get(a).push(b);}
 const seen=new Set();let best=[];
 for(const root of adjacency.keys()){
  if(seen.has(root))continue;const component=[],todo=[root];
  for(let i=0;i<todo.length;i++){const id=todo[i];if(seen.has(id))continue;seen.add(id);component.push(id);todo.push(...(adjacency.get(id)||[]).filter(n=>!seen.has(n)));}
  if(component.length>best.length)best=component;
 }
 if(best.length<2)return {ids:[],roads:[],root:null};
 const root=best.reduce((a,b)=>distance(points.get(Number(a)),center)<distance(points.get(Number(b)),center)?a:b),ids=[],todo=[root],selected=new Set();
 for(let i=0;i<todo.length&&ids.length<limit;i++){const id=todo[i];if(selected.has(id))continue;selected.add(id);ids.push(id);todo.push(...(adjacency.get(id)||[]).filter(n=>!selected.has(n)));}
 const roads=segments.filter(r=>selected.has(r.from)&&selected.has(r.to));
 return {ids,roads,root,truncated:best.length>ids.length,availableNodes:best.length};
}
export function corridorNodes(ids,roads,points){
 return ids.map((id,i)=>{const p=points.get(Number(id)),streetNames=[...new Set(roads.filter(r=>r.from===id||r.to===id).map(r=>r.name).filter(n=>n!=='Unnamed road'))],code=`I-${String(i+1).padStart(2,'0')}`;return {id,code,name:streetNames.slice(0,2).join(' & ')||code,streetNames,lat:p.lat,lng:p.lon,greens:[22,22,22,22],yellow:3,allRed:2,lanes:[1,1,1,1],pedestrian:19,signalSource:p.tags?.highway==='traffic_signals'?'OSM signal location; assumed timing':'Assumed simulated signal'};});
}