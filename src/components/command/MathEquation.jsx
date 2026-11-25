const indices={Kmin:['K','min'],Kmax:['K','max'],xqueue:['x','queue'],'ρjam':['ρ','jam'],'ρarrival':['ρ','arrival'],vfree:['v','free'],qin:['q','in'],qout:['q','out']};
export default function MathEquation({children}){
 const text=String(children).replace(/\*/g,'·').replace(/<=/g,'≤').replace(/>=/g,'≥').replace(/\blambda\b/g,'λ');
 const parts=text.split(/(\^\([^)]*\)|\^[−-]?\d+|\^∞|Kmin|Kmax|xqueue|ρjam|ρarrival|vfree|qin|qout)/g);
 return <pre className="cc-math-equation font-math whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs leading-relaxed">{parts.map((part,i)=>part.startsWith('^')?<sup key={i}>{part.slice(1).replace(/^\(|\)$/g,'')}</sup>:indices[part]?<span key={i}>{indices[part][0]}<sub>{indices[part][1]}</sub></span>:part)}</pre>;
}