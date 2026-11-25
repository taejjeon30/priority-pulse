import sumoPackage from '@/components/command/sumoPackage';
import validateManifest,{benchmarkWarnings} from '@/components/command/sumoManifest';
import {controllerVersion} from '@/components/command/controllerLabels';
self.onmessage=async({data})=>{
 try{
  const {snapshot,startSeed,count}=data;if(!snapshot.route?.arcs.length||!Number.isInteger(count)||count<1||count>10||!Number.isInteger(startSeed)||startSeed<1||startSeed+count-1>999999)throw new Error('Choose a legal route and 1–10 seeds within 1–999999.');
  if(snapshot.network.nodes.length>50||snapshot.network.roads.length>180)throw new Error('Use a supported network with at most 50 nodes and 180 road segments.');
  const fingerprint=JSON.stringify({snapshot,startSeed,count,controllerVersion}),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint)),id=[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,16),files={},runs=[];
  for(let i=0;i<count;i++){const seed=startSeed+i,pack=sumoPackage(snapshot,seed,id);for(const [name,text] of Object.entries(pack.files))files[`seed-${seed}/${name}`]=text;runs.push(pack.reference);self.postMessage({type:'progress',completed:i+1,total:count});}
  const manifest=validateManifest({schema:'prioritypulse-sumo-v1',id,createdAt:new Date().toISOString(),networkName:snapshot.network.name,controllerVersion,observationSeconds:300,stepSeconds:1,configuration:snapshot,provenance:{source:snapshot.network.source,import:snapshot.network.importMetadata||null},warnings:benchmarkWarnings,runs});
  files['manifest.json']=JSON.stringify(manifest,null,2);files['README.txt']='PriorityPulse / Eclipse SUMO plant benchmark\n\n1. Keep manifest.json; it restores this benchmark in the app after a reload.\n2. Install Eclipse SUMO externally. For each seed, open its folder and follow RUN.txt.\n3. In the app Experiment lab > SUMO benchmark, restore manifest.json if needed and select the generated tripinfo XML files.\n4. Review input checks, model differences, per-seed results and paired confidence intervals.\n\nThis does not run SUMO in the browser or claim calibrated field accuracy. Never modify the demand, network, signal trace, seed, observation or output flags. Do not ignore network conversion errors.\n\n'+benchmarkWarnings.join('\n\n');
  self.postMessage({type:'complete',files,manifest});
 }catch(error){self.postMessage({type:'error',message:error.message});}
};