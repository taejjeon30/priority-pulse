import {roadElements,searchPlaces} from './roadLookup.ts';
import importTurnRestrictions,{restrictionRelations} from './turnRestrictions.ts';
import roadSegments from './roadSegments.ts';
import {selectCorridor,corridorNodes,distance} from './corridorGraph.ts';
export default async function(req) {
 try {
  const input=await req.json().catch(()=>({})),{action='load',query,preset}=input;
  let {lat,lng,name,radius=600}=input;
  if(action==='search')return await searchPlaces(query,lat,lng);
  if(action!=='load')return Response.json({error:'Unknown map operation.'},{status:400});
  if(preset&&preset!=='lake-forest')return Response.json({error:'Choose a supported corridor preset.'},{status:400});
  if(preset==='lake-forest'){lat=42.2547555;lng=-87.8664063;name='Lake Forest Hospital emergency corridor';}
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>85||Math.abs(lng)>180)return Response.json({error:'Choose a valid map center.'},{status:400});
  if(!Number.isFinite(radius)||radius<300||radius>2000)return Response.json({error:'Choose a road-import radius between 300 and 2000 metres.'},{status:400});
  const result=await roadElements(lat,lng,radius),{elements}=result;
  if(elements.length>100000)return Response.json({error:'Too many map features. Choose a smaller import radius.'},{status:422});
  const relations=restrictionRelations(elements),restrictionNodes=new Set(relations.flatMap(r=>(r.members||[]).filter(m=>m.role==='via'&&m.type==='node').map(m=>m.ref))),center={lat,lon:lng},{points,segments}=roadSegments(elements,center,radius,restrictionNodes);
  if(segments.length>5000)return Response.json({error:'Too many road segments. Choose a smaller import radius.'},{status:422});
  const subset=selectCorridor(segments,points,center,50),{roads,ids,root}=subset;
  if(ids.length<2||!roads.length)return Response.json({error:'No connected drivable roads found. Move the map center or choose a larger radius.'},{status:422});
  if(roads.length>180)return Response.json({error:'This road subset is too dense for the browser model. Choose a smaller import radius.'},{status:422});
  const nodes=corridorNodes(ids,roads,points),{rules,stats}=importTurnRestrictions(relations,roads,segments),retrievedAt=new Date().toISOString();
  const importMetadata={provider:result.provider,retrievedAt,dataTimestamp:result.dataTimestamp,radius,truncated:subset.truncated,availableNodes:subset.availableNodes,lanesTagged:roads.filter(r=>Object.entries(r.osmTags).some(([key,value])=>key.startsWith('lanes')&&/^\d+$/.test(value)&&Number(value)>0)).length,speedsTagged:roads.filter(r=>Object.values(r.directional).some(p=>p.speedSource.startsWith('OSM'))).length};
  const network={name:String(name||'Selected map area').slice(0,100),source:'OpenStreetMap geometry and turn rules · tagged or assumed lane/speed values · simulated traffic and signals',nodes,roads,turnRestrictions:rules,restrictionImport:stats,center:[lat,lng],importMetadata};
  if(preset==='lake-forest'){
   const endpoint=nodes.find(n=>n.id===root);endpoint.name='Lake Forest Hospital · modeled road access';
   network.preset='lake-forest';network.hospital={name:'Northwestern Medicine Lake Forest Hospital',address:'1000 North Westmoreland Road, Lake Forest, Illinois',endpointId:root,referenceCenter:[lat,lng],endpointDistanceM:Math.round(distance(points.get(Number(root)),center)),osmUrl:'https://www.openstreetmap.org/way/550895078',informationUrl:'https://www.nm.org/locations/lake-forest-hospital-emergency-department'};
  }
  console.info('Corridor import:',JSON.stringify({nodes:nodes.length,roads:roads.length,...importMetadata,restrictionImport:stats}));
  const warnings=[stats.unsupported?`${stats.unsupported} unsupported or conditional restrictions not applied.`:'',stats.outsideSubset?`${stats.outsideSubset} restrictions outside the subset not applied.`:''].filter(Boolean).join(' ');
  return Response.json({network,note:`Loaded ${nodes.length} connected modeled junctions and ${roads.length} road segments from ${result.provider}. ${stats.imported} OSM turn restrictions enforced. ${warnings} Lane/speed assumptions are shown in road inspection; demand and signals remain simulated.${network.hospital?' Hospital destination is a road-access proxy, not a surveyed ED entrance.':''}`});
 } catch(error){return Response.json({error:error.message||'Unable to load roads. Retry or use the preloaded Lake Forest corridor.'},{status:500});}
}