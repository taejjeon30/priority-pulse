import {Layers} from 'lucide-react';
import MapSearch from '@/components/command/MapSearch';
import MapBookmarks from '@/components/command/MapBookmarks';
import {mapLayerNames} from '@/components/command/useMapIntelligence';
export default function MapTools({sim}){
 return <section className="cc-card cc-map-tools"><MapSearch sim={sim}/><details className="cc-map-details"><summary><Layers size={14}/> Map layers</summary><div className="cc-layer-list">{Object.entries(mapLayerNames).map(([key,name])=><label key={key}><input type="checkbox" checked={sim.layers[key]} onChange={e=>sim.setLayers({...sim.layers,[key]:e.target.checked})}/>{name}</label>)}<label><input type="checkbox" checked={sim.heat} onChange={e=>sim.setHeat(e.target.checked)}/>Congestion colors</label></div></details><MapBookmarks sim={sim}/></section>;
}