import AdminInsightGraph from './AdminInsightGraph';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../auth/clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import { readAdminReport, type Report, type ReportKind } from '../services/reports';
export default function AdminReport({ kind }: { kind: ReportKind }) {
 const { userId,getToken }=useAuth();const {palette:p}=useAdminTheme();
 const [page,setPage]=useState(1),[attempt,setAttempt]=useState(0);
 const key=`${userId}:${kind}:${page}:${attempt}`;
 const [state,setState]=useState<{key:string;data:Report|null;error:string}|null>(null);
 useEffect(()=>{if(!userId)return;const controller=new AbortController();void(async()=>{try{const token=await getToken();if(controller.signal.aborted)return;if(!token)throw new Error('Please sign in again.');const data=await readAdminReport(kind,page,token,controller.signal);if(!controller.signal.aborted)setState({key,data,error:''});}catch(cause){if(!controller.signal.aborted)setState({key,data:null,error:cause instanceof Error?cause.message:'Unable to load server data.'});}})();return()=>controller.abort();},[userId,getToken,kind,page,key]);
 const current=state?.key===key?state:null;
 const button=(label:string,action:()=>void,disabled=false)=><Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={{padding:12,borderRadius:10,backgroundColor:p.soft,opacity:disabled?0.5:1}}><Text style={{color:p.primaryText,fontWeight:'700'}}>{label}</Text></Pressable>;
 return <View style={{gap:14}}><Text style={{color:p.text,fontSize:24,fontWeight:'800'}}>{kind}</Text>
 {!current?<Text accessibilityLiveRegion="polite" style={{color:p.muted}}>Loading server data…</Text>:current.error?<Text accessibilityRole="alert" style={{color:p.terracotta}}>{current.error}</Text>:current.data?<>
  <Text style={{color:p.muted,lineHeight:20}}>{current.data.note}</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{current.data.metrics.map(metric=><View key={metric.label} style={{flexGrow:1,flexBasis:150,padding:16,backgroundColor:p.surface,borderColor:p.border,borderWidth:1,borderRadius:14}}><Text style={{color:p.muted}}>{metric.label}</Text><Text style={{color:p.text,fontSize:24,fontWeight:'800',marginTop:8}}>{metric.value}</Text></View>)}</View>
  {kind === 'Overview' ? <AdminInsightGraph /> : null}
  {current.data.rows.length?current.data.rows.map(row=><View key={row.id} style={{padding:16,borderWidth:1,borderColor:p.border,borderRadius:14,backgroundColor:p.surface,gap:6}}><Text style={{color:p.text,fontWeight:'800'}}>{row.title}</Text>{row.lines.map((line,index)=><Text key={index} style={{color:p.muted}}>{line}</Text>)}</View>):<Text style={{color:p.muted}}>No records returned.</Text>}
  {current.data.pages>1?<View style={{flexDirection:'row',alignItems:'center',gap:12}}>{button('Previous',()=>setPage(value=>value-1),page<=1)}<Text style={{color:p.muted}}>Page {page} of {current.data.pages}</Text>{button('Next',()=>setPage(value=>value+1),page>=current.data.pages)}</View>:null}
 </>:null}
 {button(current?.error?'Retry':'Refresh',()=>setAttempt(value=>value+1),!current)}
 </View>;
}
