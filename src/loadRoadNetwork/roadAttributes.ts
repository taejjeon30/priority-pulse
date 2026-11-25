export const highwayPattern='^(primary|secondary|tertiary|residential|unclassified|living_street|primary_link|secondary_link|tertiary_link|service)$';
export function drivableWay(way){
 const t=way.tags||{},access=t.motorcar||t.motor_vehicle||t.vehicle||t.access;
 return way.nodes?.length>1&&new RegExp(highwayPattern).test(t.highway||'')&&t.area!=='yes'&&t.service!=='parking_aisle'&&!['no','private','agricultural','forestry'].includes(access);
}
export function oneWay(tags){return tags.oneway==='-1'?'reverse':['yes','true','1'].includes(tags.oneway)||(tags.junction==='roundabout'&&!['no','false','0'].includes(tags.oneway))?'forward':'both';}
function positiveInteger(value){return /^\d+$/.test(String(value||''))&&Number(value)>0?Number(value):null;}
export function directionAttributes(tags,side,direction){
 const suffix=side==='forward'?'forward':'backward',laneKey=`lanes:${suffix}`,oppositeKey=`lanes:${side==='forward'?'backward':'forward'}`,total=positiveInteger(tags.lanes),explicit=positiveInteger(tags[laneKey]),opposite=positiveInteger(tags[oppositeKey]);
 let lanes=explicit,lanesSource=explicit?`OSM ${laneKey}`:'';
 if(!lanes&&total&&direction!=='both'){lanes=total;lanesSource='OSM lanes';}
 if(!lanes&&total&&opposite&&total>opposite){lanes=total-opposite;lanesSource='Inferred from OSM total minus opposite lanes';}
 if(!lanes&&total){lanes=Math.max(1,Math.floor((total-(positiveInteger(tags['lanes:both_ways'])||0))/2));lanesSource='Assumed equal split of OSM total lanes';}
 if(!lanes){lanes=1;lanesSource='Assumed one lane per direction';}
 if(lanes>4){lanes=4;lanesSource+='; bounded to four model lanes';}
 const speedKey=tags[`maxspeed:${suffix}`]?`maxspeed:${suffix}`:'maxspeed',raw=String(tags[speedKey]||''),numeric=/^\d+(?:\.\d+)?\s*(?:mph|km\/h|kph|kmh)?$/i.test(raw.trim())?parseFloat(raw):null;
 let speed=numeric>0?numeric*(/mph/i.test(raw)?1.609344:1):tags.highway==='service'?15:tags.highway==='living_street'?10:40,speedSource=numeric>0?`OSM ${speedKey}`:'Assumed model speed; no usable OSM limit';
 if(speed>120||speed<5){speed=Math.max(5,Math.min(120,speed));speedSource+='; bounded to 5–120 km/h';}
 return {lanes,speed:Math.round(speed*100)/100,lanesSource,speedSource};
}
export function osmTags(tags){return Object.fromEntries(['highway','service','oneway','junction','access','motor_vehicle','motorcar','lanes','lanes:forward','lanes:backward','lanes:both_ways','maxspeed','maxspeed:forward','maxspeed:backward'].filter(k=>tags[k]!==undefined).map(k=>[k,tags[k]]));}