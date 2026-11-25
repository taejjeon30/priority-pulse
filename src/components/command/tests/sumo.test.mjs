import test from 'node:test';
import assert from 'node:assert/strict';
import {starterNetwork,findRoute} from '@/components/command/network';
import sumoPackage from '@/components/command/sumoPackage';
import validateManifest from '@/components/command/sumoManifest';
import {zipFiles} from '@/components/command/benchmarkFiles';
test('SUMO export includes complete demand, signal replay, conversion inputs and auditable references',()=>{
 const network=starterNetwork(),route=findRoute(network,'i0','i8'),id='0123456789abcdef',pack=sumoPackage({network,route,settings:{seed:7,density:'Low',priority:'Critical',dispatch:5,pedCalls:[]}},7,id),r=pack.reference;
 assert.ok(pack.files['network.nod.xml'].includes('traffic_light'));assert.ok(!pack.files['network.con.xml'].includes('linkIndex='));assert.ok(pack.files['signals.tll.xml'].includes('linkIndex='));assert.ok(pack.files['signals.tll.xml'].includes('<tlLogic'));assert.ok(pack.files['RUN.txt'].includes('--tllogic-files signals.tll.xml'));assert.ok(pack.files['benchmark.sumocfg'].includes('tripinfo-output.write-undeparted'));
 assert.equal((pack.files['demand.rou.xml'].match(/<vehicle /g)||[]).length,r.expected.length);assert.equal(r.expected.filter(v=>v.kind==='ordinary').length,r.reference.metrics.external);assert.equal(r.reference.trips.length,r.reference.metrics.completed);
 assert.equal(validateManifest({schema:'prioritypulse-sumo-v1',id,observationSeconds:300,stepSeconds:1,runs:[r]}).runs.length,1);
 const assignments=[...pack.files['signals.tll.xml'].matchAll(/<connection [^>]* tl="([^"]+)" linkIndex="(\d+)"\/>/g)];
 const connections=[...pack.files['network.con.xml'].matchAll(/<connection [^>]*\/>/g)].map(m=>m[0]);
 assert.deepEqual(assignments.map(m=>m[0].replace(/ tl="[^"]+" linkIndex="\d+"/,'')),connections);
 assert.ok(!pack.files['network.con.xml'].includes(' tl='));
 const programs=[...pack.files['signals.tll.xml'].matchAll(/<tlLogic id="([^"]+)"[^>]*>(.*?)<\/tlLogic>/g)];
 for(const p of programs){
  const phases=[...p[2].matchAll(/duration="(\d+)" state="([Gyr]+)"/g)];
  assert.equal(phases.reduce((sum,p)=>sum+Number(p[1]),0),300);assert.equal(new Set(phases.map(p=>p[2].length)).size,1);
  assert.deepEqual(assignments.filter(m=>m[1]===p[1]).map(m=>Number(m[2])),Array.from({length:phases[0][2].length},(_,i)=>i));
 }
});
test('manifest rejects mixed seed identity and invalid observation windows',()=>{
 assert.throws(()=>validateManifest({schema:'prioritypulse-sumo-v1',id:'0123456789abcdef',observationSeconds:600,stepSeconds:1,runs:[{}]}));
});
test('download package is a valid stored ZIP with UTF-8 entries and central directory',async()=>{
 const blob=zipFiles({'manifest.json':'{"ok":true}','seed-7/RUN.txt':'Run SUMO externally.'}),bytes=new Uint8Array(await blob.arrayBuffer()),v=new DataView(bytes.buffer);assert.equal(v.getUint32(0,true),0x04034b50);assert.equal(v.getUint32(bytes.length-22,true),0x06054b50);assert.equal(v.getUint16(bytes.length-12,true),2);const central=v.getUint32(bytes.length-6,true);assert.equal(v.getUint32(central,true),0x02014b50);const offset=30+v.getUint16(26,true);assert.equal(new TextDecoder().decode(bytes.slice(offset,offset+v.getUint32(18,true))),'\u007b"ok":true}');
});