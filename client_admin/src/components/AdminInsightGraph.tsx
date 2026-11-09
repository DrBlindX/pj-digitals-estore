import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../auth/clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import { readSalesInsights, type SalesPoint } from '../services/salesInsights';
type Metric = 'gross' | 'collected' | 'orders';
const labels: Record<Metric,string> = { gross: 'Order value', collected: 'Collected', orders: 'Orders' };
const format = (value: number, metric: Metric) => metric === 'orders' ? value.toLocaleString('en-IN') : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export default function AdminInsightGraph() {
 const { userId,getToken }=useAuth();const {palette:p}=useAdminTheme();
 const [days,setDays]=useState<7|30>(7),[metric,setMetric]=useState<Metric>('gross'),[selected,setSelected]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
 const key=`${userId}:${days}:${attempt}`;
 const [state,setState]=useState<{key:string;points:SalesPoint[];error:string}|null>(null);
 useEffect(()=>{
  if(!userId)return;const controller=new AbortController();
  void(async()=>{try{const token=await getToken();if(controller.signal.aborted)return;if(!token)throw new Error('Please sign in again.');const points=await readSalesInsights(days,token,controller.signal);if(!controller.signal.aborted)setState({key,points,error:''});}catch(cause){if(!controller.signal.aborted)setState({key,points:[],error:cause instanceof Error?cause.message:'Unable to load insights.'});}})();
  return()=>controller.abort();
 },[userId,getToken,days,key]);
 const current=state?.key===key?state:null, points=current?.points??[];
 const maximum=Math.max(1,...points.map(point=>point[metric]));
 const focus=points.find(point=>point.date===selected)??points[points.length-1];
 const total=points.reduce((sum,point)=>sum+point[metric],0);
 const chip=(label:string,onPress:()=>void,active=false)=><Pressable accessibilityRole="button" accessibilityState={{selected:active}} onPress={onPress} style={{paddingHorizontal:12,paddingVertical:10,borderRadius:10,backgroundColor:active?p.primary:p.soft}}><Text style={{color:active?p.onPrimary:p.primaryText,fontWeight:'700'}}>{label}</Text></Pressable>;
 return <View style={{padding:18,backgroundColor:p.surface,borderRadius:16,borderWidth:1,borderColor:p.border,gap:14}}>
  <Text style={{color:p.text,fontSize:20,fontWeight:'800'}}>Sales insights</Text>
  <View style={{flexDirection:'row',gap:8}}>{([7,30] as const).map(value=><View key={value}>{chip(`${value} days`,()=>{setDays(value);setSelected(null);},days===value)}</View>)}</View>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{(['gross','collected','orders'] as const).map(value=><View key={value}>{chip(labels[value],()=>setMetric(value),metric===value)}</View>)}</View>
  {!current?<Text accessibilityLiveRegion="polite" style={{color:p.muted}}>Loading sales insights…</Text>:current.error?<Text accessibilityRole="alert" style={{color:p.terracotta}}>{current.error}</Text>:!points.length?<Text style={{color:p.muted}}>No sales records returned for this period.</Text>:<>
   <Text style={{color:p.muted}}>{labels[metric]} · Last {days} days</Text><Text style={{color:p.text,fontSize:28,fontWeight:'800'}}>{format(total,metric)}</Text>
   <Text style={{color:p.muted,fontSize:11}}>Daily scale: 0 – {format(maximum===1&&points.every(point=>point[metric]===0)?0:maximum,metric)}</Text>
   <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{gap:12,paddingVertical:8}}>
    {points.map(point=><Pressable key={point.date} accessibilityRole="button" accessibilityLabel={`${point.date}, ${labels[metric]} ${format(point[metric],metric)}, ${point.orders} orders`} accessibilityState={{selected:focus?.date===point.date}} onPress={()=>setSelected(point.date)} style={{width:42,alignItems:'center',gap:8}}>
     <View style={{height:160,width:26,justifyContent:'flex-end',borderBottomWidth:1,borderColor:p.border}}><View style={{height:point[metric]/maximum*150,width:26,borderTopLeftRadius:6,borderTopRightRadius:6,backgroundColor:focus?.date===point.date?p.primary:p.gold}}/></View>
     <Text style={{color:p.muted,fontSize:10}}>{point.date.slice(8)}/{point.date.slice(5,7)}</Text>
    </Pressable>)}
   </ScrollView>
   {focus?<View accessibilityLiveRegion="polite" style={{backgroundColor:p.soft,padding:12,borderRadius:10,gap:4}}><Text style={{color:p.text,fontWeight:'700'}}>{focus.date} · {format(focus[metric],metric)}</Text><Text style={{color:p.muted}}>{focus.orders} orders · Collected ₹{focus.collected.toLocaleString('en-IN')}</Text></View>:null}
  </>}
  <Text style={{color:p.muted,fontSize:11,lineHeight:17}}>Daily figures use India time. Only dates returned by the server are shown. Cancelled orders are excluded; order value is separate from collected payments.</Text>
  <Pressable accessibilityRole="button" disabled={!current} onPress={()=>setAttempt(value=>value+1)} style={{padding:12,borderRadius:10,backgroundColor:p.soft,opacity:current?1:0.5}}><Text style={{color:p.primaryText,fontWeight:'700'}}>{current?.error?'Retry insights':'Refresh insights'}</Text></Pressable>
 </View>;
}
