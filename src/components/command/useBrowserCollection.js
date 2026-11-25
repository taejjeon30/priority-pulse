import {useEffect,useRef,useState} from 'react';
export default function useBrowserCollection(key,label){
 const [loaded]=useState(()=>{
  try{const value=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(value))throw new Error('Unreadable saved data');return{value,notice:''};}
  catch{return{value:[],notice:`Saved ${label} could not be opened in this browser. Keep this tab open and check your browser storage settings before adding more.`};}
 });
 const [value,setValue]=useState(loaded.value),[warning,setWarning]=useState(loaded.notice),preserveRaw=useRef(!!loaded.notice);
 useEffect(()=>{
  if(preserveRaw.current)return;
  try{localStorage.setItem(key,JSON.stringify(value));setWarning('');}
  catch{setWarning(`Changes to ${label} are still in this tab but could not be saved in this browser. Keep the tab open and allow browser storage before trying again.`);}
 },[key,label,value]);
 function update(change){setValue(previous=>{const next=typeof change==='function'?change(previous):change;if(next!==previous)preserveRaw.current=false;return next;});}
 return[value,update,warning];
}