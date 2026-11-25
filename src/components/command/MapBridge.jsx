import {useEffect} from 'react';
import {useMap,useMapEvents} from 'react-leaflet';
export default function MapBridge({sim,network}){
 const map=useMap();
 useEffect(()=>{if(network.nodes.length)map.fitBounds(network.nodes.map(n=>[n.lat,n.lng]),{padding:[35,35],maxZoom:16});},[network,map]);
 useEffect(()=>{if(sim.focus)map.setView(sim.focus.center,Math.max(map.getZoom(),16));},[sim.focus,map]);
 useMapEvents({click:e=>sim.mapClick(e.latlng.lat,e.latlng.lng),moveend:()=>{const c=map.getCenter();sim.setMapCenter([c.lat,c.lng]);}});
 return null;
}