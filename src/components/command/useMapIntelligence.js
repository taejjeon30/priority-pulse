import {useState} from 'react';
import useBrowserCollection from '@/components/command/useBrowserCollection';
import {networkKey,facilitiesOf} from '@/components/command/incidentModel';
export const mapLayerNames={roads:'Roads',signals:'Signals',routes:'Emergency routes',traffic:'Vehicles',incidents:'Incidents',facilities:'Training facilities',closures:'Road closures'};
export default function useMapIntelligence(draft){
 const [layers,setLayers]=useState({roads:true,signals:true,routes:true,traffic:true,incidents:true,facilities:false,closures:true}),[focus,setFocus]=useState(null),[removed,setRemoved]=useState(null);
 const [saved,setSaved,bookmarksWarning]=useBrowserCollection('prioritypulse-bookmarks-v1','bookmarks');
 const key=networkKey(draft.network),bookmarks=saved.filter(b=>b.networkKey===key),facilities=facilitiesOf(draft);

 function focusMap(center){setFocus({center,token:crypto.randomUUID()});}
 function addBookmark(name,center){if(!name.trim())return;setSaved(rows=>[...rows,{id:crypto.randomUUID(),name:name.trim().slice(0,80),center,networkKey:key}]);}
 function removeBookmark(id){setRemoved(saved.find(b=>b.id===id));setSaved(rows=>rows.filter(b=>b.id!==id));}
 function undoBookmark(){if(!removed)return;setSaved(rows=>[...rows,removed]);setRemoved(null);}
 return {bookmarksWarning,canUndoBookmark:removed?.networkKey===key,undoBookmark,layers,setLayers,focus,focusMap,bookmarks,addBookmark,removeBookmark,facilities};
}