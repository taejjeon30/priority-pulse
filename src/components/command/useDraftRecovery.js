import {useEffect,useRef,useState} from 'react';
const key='prioritypulse-draft-v2';
export default function useDraftRecovery(createDefault){
 const [loaded]=useState(()=>{
  try{
   const raw=localStorage.getItem(key),draft=raw?JSON.parse(raw):createDefault();
   if(!Array.isArray(draft.network?.nodes)||!Array.isArray(draft.network?.roads)||!draft.settings)throw new Error('Unreadable draft');
   return{draft,notice:''};
  }catch{return{draft:createDefault(),notice:'Your browser draft could not be opened. The demo is loaded; open a saved scenario or start with this network.'};}
 });
 const [draft,setValue]=useState(loaded.draft),[previous,setPrevious]=useState(null),[restoreNotice,setRestoreNotice]=useState(loaded.notice),[storageError,setStorageError]=useState('');
 const current=useRef(draft),preserveRaw=useRef(!!loaded.notice);
 useEffect(()=>{
  if(preserveRaw.current)return;
  try{localStorage.setItem(key,JSON.stringify(draft));setStorageError('');}
  catch{setStorageError('This browser could not save your draft. Keep this tab open and save a named scenario to your account.');}
 },[draft]);
 function setDraft(change){
  const next=typeof change==='function'?change(current.current):change;
  preserveRaw.current=false;setPrevious(current.current);current.current=next;setValue(next);setRestoreNotice('');
 }
 function undo(){
  if(!previous)return null;
  current.current=previous;setValue(previous);setPrevious(null);return previous;
 }
 return{draft,setDraft,undo,canUndo:!!previous,draftWarning:storageError||restoreNotice};
}