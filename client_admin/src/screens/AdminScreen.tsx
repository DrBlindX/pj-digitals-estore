import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminDeliveryScreen from '../components/AdminDeliveryScreen';
import AdminUsers from '../components/AdminUsers';
import AdminShops from '../components/AdminShops';
import AdminOrders from '../components/AdminOrders';
import AdminProducts from '../components/AdminProducts';
import AdminReport from '../components/AdminReport';
import AdminMenu from '../components/AdminMenu';
import BrandLogo from '../components/BrandLogo';
import { useAdminTheme } from '../context/AdminTheme';
const sections=['Overview','Orders','Shops','Products','Delivery','Customers','Payouts','Support','Reports','Settings'] as const;
type Section=typeof sections[number];
export default function AdminScreen(){
 const {palette:p,mode,toggle}=useAdminTheme();const [menuOpen,setMenuOpen]=useState(false);const [section,setSection]=useState<Section>('Overview');
 return <SafeAreaView edges={['top','bottom','left','right']} style={{flex:1,backgroundColor:p.background}}>
  <View style={{paddingHorizontal:20,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderColor:p.border}}><BrandLogo size={42}/><View style={{flex:1,minWidth:0}}><Text style={{color:p.gold,fontSize:9,letterSpacing:1.4,fontWeight:'800'}}>NEARBY · PLATFORM</Text><Text numberOfLines={1} style={{color:p.text,fontSize:23,fontWeight:'800'}}>NearBy Admin</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={()=>setMenuOpen(true)} style={{width:44,height:44,alignItems:'center',justifyContent:'center',backgroundColor:p.soft,borderRadius:10}}><Text style={{color:p.primaryText,fontSize:24}}>☰</Text></Pressable></View>
  <ScrollView contentContainerStyle={{padding:18,paddingBottom:30,width:'100%',maxWidth:1200,alignSelf:'center',flexGrow:1}} keyboardShouldPersistTaps="handled">
   <View key={section}>
    {section==='Overview'||section==='Payouts'||section==='Support'||section==='Reports'?<AdminReport kind={section}/>:section==='Orders'?<AdminOrders/>:section==='Shops'?<AdminShops/>:section==='Products'?<AdminProducts/>:section==='Delivery'?<AdminDeliveryScreen/>:section==='Customers'?<AdminUsers/>:<View style={{gap:16}}>
     <Text style={{color:p.text,fontSize:24,fontWeight:'800'}}>Settings</Text><Pressable accessibilityRole="switch" accessibilityLabel="Dark mode" accessibilityState={{checked:mode==='dark'}} onPress={toggle} style={{padding:16,borderRadius:12,backgroundColor:p.soft}}><Text style={{color:p.primaryText}}>{mode==='dark'?'Switch to light mode':'Switch to dark mode'}</Text></Pressable><Text style={{color:p.muted,lineHeight:22}}>Platform settings are unavailable. No settings endpoint is provided by the server.</Text>
    </View>}
   </View>
  </ScrollView>
  <AdminMenu open={menuOpen} onClose={()=>setMenuOpen(false)} items={[...sections]} active={section} onSelect={item=>setSection(item as Section)}/>
 </SafeAreaView>;
}
