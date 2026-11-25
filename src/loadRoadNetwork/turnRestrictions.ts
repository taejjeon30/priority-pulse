export function restrictionRelations(elements){return elements.filter(e=>e.type==='relation'&&e.tags?.type==='restriction');}
function directedRoads(roads){return roads.flatMap(r=>{const a={id:`${r.id}a`,from:r.from,to:r.to,way:r.osmWayId},b={id:`${r.id}b`,from:r.to,to:r.from,way:r.osmWayId};return r.direction==='forward'?[a]:r.direction==='reverse'?[b]:[a,b];});}
function relationPaths(relation,restriction,arcs){
 const members=relation.members||[],from=new Set(members.filter(m=>m.role==='from'&&m.type==='way').map(m=>String(m.ref))),to=new Set(members.filter(m=>m.role==='to'&&m.type==='way').map(m=>String(m.ref))),via=members.filter(m=>m.role==='via'),paths=[],byFrom=new Map();
 if(!from.size||!to.size)return null;
 for(const a of arcs){if(!byFrom.has(a.from))byFrom.set(a.from,[]);byFrom.get(a.from).push(a);}
 if(via.length===1&&via[0].type==='node'){
  const node=String(via[0].ref);
  for(const incoming of arcs.filter(a=>from.has(a.way)&&a.to===node)){
   const exits=(byFrom.get(node)||[]).filter(a=>to.has(a.way)).filter(outgoing=>incoming.way!==outgoing.way||(restriction.endsWith('u_turn')?outgoing.to===incoming.from:outgoing.to!==incoming.from));
   for(const outgoing of exits)paths.push({approach:[incoming.id],exit:outgoing.id});
   if(!exits.length&&restriction.startsWith('only_'))paths.push({approach:[incoming.id],exit:null});
  }
  return paths;
 }
 if(!via.length||via.some(m=>m.type!=='way'))return null;
 const viaWays=new Set(via.map(m=>String(m.ref)));if(viaWays.size>8)return null;
 let steps=0,overflow=false;
 function walk(current,path,usedArcs,usedWays){
  if(++steps>5000||paths.length>256){overflow=true;return;}
  for(const next of byFrom.get(current.to)||[]){
   if(next.to===current.from||usedArcs.has(next.id))continue;
   if(usedWays.size===viaWays.size&&to.has(next.way))paths.push({approach:[...path],exit:next.id});
   if(!viaWays.has(next.way)||(usedWays.has(next.way)&&next.way!==current.way))continue;
   walk(next,[...path,next.id],new Set([...usedArcs,next.id]),new Set([...usedWays,next.way]));if(overflow)return;
  }
 }
 for(const incoming of arcs.filter(a=>from.has(a.way))){walk(incoming,[incoming.id],new Set([incoming.id]),new Set());if(overflow)return null;}
 return paths;
}
export default function importTurnRestrictions(relations,roads,segments=roads){
 const arcs=directedRoads(segments),loaded=new Set(directedRoads(roads).map(a=>a.id)),rules=[],stats={found:relations.length,imported:0,outsideSubset:0,unsupported:0};
 for(const relation of relations){
  const tags=relation.tags||{},restriction=tags['restriction:motorcar']||tags['restriction:motor_vehicle']||tags.restriction;
  if(Object.keys(tags).some(k=>k.startsWith('restriction')&&k.endsWith(':conditional'))||! /^(no_(left_turn|right_turn|straight_on|u_turn|entry|exit)|only_(left_turn|right_turn|straight_on|u_turn))$/.test(restriction||'')){stats.unsupported++;continue;}
  const complete=relationPaths(relation,restriction,arcs);
  if(complete===null){stats.unsupported++;continue;}
  const paths=complete.filter(p=>restriction.startsWith('only_')?loaded.has(p.approach[0]):p.approach.every(id=>loaded.has(id))&&loaded.has(p.exit));
  if(!paths.length){stats.outsideSubset++;continue;}
  rules.push({id:String(relation.id),restriction,type:restriction.startsWith('only_')?'only':'no',except:(tags.except||'').split(';').map(s=>s.trim().toLowerCase()).filter(Boolean),paths});stats.imported++;
 }
 return{rules,stats};
}