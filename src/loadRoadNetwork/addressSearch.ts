const normalized=value=>String(value||'').toLocaleLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export async function lookupAddressPlaces(query,lat,lng,headers){
 const parts=query.split(',').map(s=>s.trim()).filter(Boolean),address=parts[0].match(/^(\d+[\p{L}]?(?:[-/]\d+[\p{L}]?)?)\s+(.+)$/u),number=address?.[1]||'',street=address?.[2]||'';
 const params=new URLSearchParams({q:query,limit:'12'});
 // Explicit locality text must not be pulled back toward the currently displayed city.
 if(parts.length===1&&Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=85&&Math.abs(lng)<=180){params.set('lat',String(lat));params.set('lon',String(lng));}
 const urls=[`https://photon.komoot.io/api/?${params}`];
 if(address&&parts.length>1){const structured=new URLSearchParams({housenumber:number,street,city:parts[1],limit:'8'});if(parts[2])structured.set('state',parts[2].replace(/\b\d{5}(?:-\d{4})?\b/g,'').trim());const postcode=query.match(/\b\d{5}(?:-\d{4})?\b(?=\s*(?:,|$))/);if(postcode)structured.set('postcode',postcode[0]);urls.push(`https://photon.komoot.io/structured?${structured}`);}
 const responses=await Promise.allSettled(urls.map(async url=>{const res=await fetch(url,{headers,signal:AbortSignal.timeout(15000)});if(!res.ok)throw new Error(res.status===429?'Place search is rate limited. Wait a minute and retry.':'The public place-search service is unavailable. Please try again.');const data=await res.json();if(!Array.isArray(data.features))throw new Error('The search service returned incomplete results. Try again.');return data.features;}));
 if(!responses.some(r=>r.status==='fulfilled'))return Response.json({error:responses[0].reason.message},{status:502});
 const unique=new Map(),words=normalized(query).split(' '),streetWords=normalized(street).split(' ').filter(Boolean);
 for(const response of responses){if(response.status!=='fulfilled')continue;for(const f of response.value){
  const c=f.geometry?.coordinates;if(f.geometry?.type!=='Point'||!Array.isArray(c)||c.length!==2||!c.every(Number.isFinite)||Math.abs(c[1])>85||Math.abs(c[0])>180)continue;
  const p=f.properties||{},house=String(p.housenumber||''),road=String(p.street||(p.osm_key==='highway'?p.name:'')||''),streetAddress=[house,road].filter(Boolean).join(' '),locality=p.city||p.town||p.village||p.county;
  const name=[...new Set([p.name,streetAddress,locality,p.state,p.postcode,p.country].filter(Boolean))].join(', ')||'Selected location',sameHouse=!!number&&normalized(house)===normalized(number),text=normalized(name);
  const score=(sameHouse?100:0)+streetWords.filter(w=>normalized(road).includes(w)).length*5+words.filter(w=>text.includes(w)).length;
  const match=number?(sameHouse?'House number matches':house?'Different house number':road?'Street result · house number not confirmed':'Area result · address not confirmed'):house?'Address result':road?'Street result':'Place or area result';
  const key=`${p.osm_type||'place'}-${p.osm_id||`${c[0]},${c[1]}`}`,result={id:key,name,center:[c[1],c[0]],match,score};
  if(!unique.has(key)||unique.get(key).score<score)unique.set(key,result);
 }}
 return Response.json({results:[...unique.values()].sort((a,b)=>b.score-a.score).slice(0,8).map(({score,...place})=>place),attribution:'Photon / OpenStreetMap. Address results are not verified intersection coordinates.'});
}