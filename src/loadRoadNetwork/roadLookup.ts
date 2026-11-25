import {lookupAddressPlaces} from './addressSearch.ts';
import {highwayPattern} from './roadAttributes.ts';
const headers={'User-Agent':'PriorityPulse/1.0 (educational traffic simulator)','Accept':'application/json'};
export async function roadElements(lat,lng,radius=600){
 const dy=radius/111320,dx=dy/Math.cos(lat*Math.PI/180),west=lng-dx,east=lng+dx,south=lat-dy,north=lat+dy;
 const query=`[out:json][timeout:8];way["highway"~"${highwayPattern}"](${south},${west},${north},${east})->.roads;rel(bw.roads)["type"="restriction"]->.restrictions;(.roads;.restrictions;);out body;.roads >;out body;`;
 try{
  const response=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(10000)});
  if(response.status===429)throw new Error('Road-data rate limit reached. Wait a minute before loading live roads again, or use the preloaded Lake Forest corridor.');
  if(response.ok){const data=await response.json();if(Array.isArray(data.elements)&&!data.remark)return {elements:data.elements,provider:'Overpass API',dataTimestamp:data.osm3s?.timestamp_osm_base||null};}
 }catch(error){if(error.message.includes('rate limit'))throw error;console.warn('Overpass unavailable; using OSM map API:',error.message);}
 const bbox=[west,south,east,north].join(','),response=await fetch(`https://api.openstreetmap.org/api/0.6/map.json?bbox=${bbox}`,{headers,signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(response.status===429?'Road-data rate limit reached. Wait a minute, or use the preloaded Lake Forest corridor.':'Live road services are unavailable. Try again shortly or use the preloaded Lake Forest corridor.');
 const data=await response.json();if(!Array.isArray(data.elements))throw new Error('The road service returned an incomplete response. Try a smaller area.');
 return {elements:data.elements,provider:'OpenStreetMap map API (Overpass fallback)',dataTimestamp:null};
}
export async function searchPlaces(query,lat,lng){
 if(typeof query!=='string'||query.trim().length<3||query.trim().length>160)return Response.json({error:'Enter 3–160 characters, including the city for a street search.'},{status:400});
 return await lookupAddressPlaces(query.trim().replace(/\s+/g,' '),lat,lng,headers);
}