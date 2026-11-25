export async function resolve(specifier,context,nextResolve){
 if(specifier.startsWith('@/'))return {url:new URL('../../../'+specifier.slice(2)+(specifier.match(/\.[a-z]+$/i)?'':'.js'),import.meta.url).href,shortCircuit:true};
 return nextResolve(specifier,context);
}