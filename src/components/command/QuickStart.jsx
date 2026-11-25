import {useState} from 'react';
import {X} from 'lucide-react';
export default function QuickStart(){
 const [visible,setVisible]=useState(true);
 if(!visible)return null;
 return <section className="cc-card mb-5 flex items-start justify-between gap-4 bg-accent/50 p-4" aria-label="Quick start"><div><b className="text-sm">Your first mission</b><ol className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs"><li>1. Choose an origin and destination</li><li>2. Select a controller mode</li><li>3. Dispatch ambulance, then open the comparison lab</li></ol><p className="cc-muted mt-2">A ready-to-run network is loaded. Choose Use preloaded corridor for the Lake Forest Hospital demo. No account needed; sign in only to save scenarios to your account.</p></div><button className="cc-icon-button" aria-label="Dismiss quick start" onClick={()=>setVisible(false)}><X size={16}/></button></section>;
}