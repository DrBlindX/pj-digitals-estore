import { useCallback, useEffect, useRef, useState } from 'react';
import { useCustomerAuth } from '../../auth/CustomerAuthContext';
import { listAddresses, saveAddress, removeAddress, type AddressDraft } from '../../../services/addresses';
import type { DeliveryAddress } from '../components/AddressBook';
export function useSavedAddresses() {
 const {customer,ready,getToken}=useCustomerAuth();const owner=customer?.id;
 const [attempt,setAttempt]=useState(0);
 const [state,setState]=useState<{owner:string;addresses:DeliveryAddress[];error:string}|null>(null);
 const [busy,setBusy]=useState(false);const lock=useRef(false),activeOwner=useRef<string|undefined>(undefined);
 useEffect(()=>{activeOwner.current=owner;if(!ready||!owner)return;const controller=new AbortController();void(async()=>{try{const token=await getToken();if(controller.signal.aborted)return;if(!token)throw new Error('Please sign in again.');const addresses=await listAddresses(token,controller.signal);if(!controller.signal.aborted)setState({owner,addresses,error:''});}catch(cause){if(!controller.signal.aborted)setState({owner,addresses:[],error:cause instanceof Error?cause.message:'Unable to load saved addresses.'});}})();return()=>{controller.abort();activeOwner.current=undefined;};},[owner,ready,getToken,attempt]);
 const current=state?.owner===owner?state:null;
 const reload=useCallback(()=>{if(!lock.current){setState(null);setAttempt(value=>value+1);}},[]);
 async function mutate<T>(action:(token:string)=>Promise<T>,apply:(addresses:DeliveryAddress[],value:T)=>DeliveryAddress[]) {
  if(!owner||!current||current.error)throw new Error('Sign in and reload your saved addresses before making changes.');
  if(lock.current)throw new Error('Wait for the current address change to finish.');
  lock.current=true;setBusy(true);
  try{const token=await getToken();if(activeOwner.current!==owner)throw new Error('Your account changed.');if(!token)throw new Error('Please sign in again.');const value=await action(token);if(activeOwner.current!==owner)throw new Error('Your account changed.');setState(previous=>previous?.owner===owner?{...previous,addresses:apply(previous.addresses,value)}:previous);return value;}
  catch(cause){if(activeOwner.current===owner)setState(previous=>previous?.owner===owner?{...previous,error:`${cause instanceof Error?cause.message:'Unable to save address.'} Reload saved addresses to check the latest saved state before retrying.`}:previous);throw cause;}
  finally{lock.current=false;setBusy(false);}
 }
 return {addresses:current?.addresses??[],loading:!!owner&&(!ready||!current),error:current?.error??'',busy,reload,
  save:(input:AddressDraft)=>mutate(token=>saveAddress(input,token),(addresses,saved)=>[saved,...addresses.filter(address=>address.id!==saved.id)]),
  remove:(id:string)=>mutate(token=>removeAddress(id,token),addresses=>addresses.filter(address=>address.id!==id)),
 };
}
