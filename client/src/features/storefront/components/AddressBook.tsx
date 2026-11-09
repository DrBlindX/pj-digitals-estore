import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Text from './AppText';
import { useStoreTheme } from '../ThemeContext';
import type { DeliveryLocation } from '../data/types';
import type { Palette } from '../data/catalog';

export type DeliveryAddress = { id: string; name: string; phone: string; address: string; pincode: string; location: DeliveryLocation };

export default function AddressBook({ addresses, selectedId, location, onSave, onSelect, onRemove, onBack, busy = false, loading = false, loadError = '', onReload, onSignIn }: { addresses: DeliveryAddress[]; selectedId: string | null; location: DeliveryLocation; onSave: (address: Omit<DeliveryAddress, 'id'>) => Promise<void>; onSelect: (id: string) => void; onRemove: (id: string) => Promise<void>; onBack: () => void; busy?: boolean; loading?: boolean; loadError?: string; onReload: () => void; onSignIn?: () => void }) {
  const { palette } = useStoreTheme();
  const styles = createStyles(palette);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');

  async function save() {
    if (busy || loading || loadError) return;
    if (!name.trim() || !/^\d{10}$/.test(phone.replace(/\s/g, '')) || address.trim().length < 5 || !/^\d{6}$/.test(pincode)) {
      setError('Enter your name, a 10-digit phone number, full address and 6-digit PIN code.'); return;
    }
    try { await onSave({ name: name.trim(), phone: phone.replace(/\s/g, ''), address: address.trim(), pincode, location }); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save address.'); return; }
    setName(''); setPhone(''); setAddress(''); setPincode(''); setError('');
  }

  return <View>
    <Pressable onPress={onBack} style={styles.back} accessibilityRole="button"><Text style={styles.link}>← Back</Text></Pressable>
    <Text style={styles.title}>Saved addresses</Text><Text style={styles.copy}>Save an address for {location}.</Text>
    {loading ? <Text accessibilityLiveRegion="polite" style={styles.copy}>Loading saved addresses…</Text> : loadError ? <Text accessibilityRole="alert" style={styles.remove}>{loadError}</Text> : !addresses.some(item=>item.location===location) ? <Text style={styles.copy}>No saved addresses for this area yet.</Text> : null}
    {onSignIn ? <Pressable onPress={onSignIn} accessibilityRole="button" style={styles.back}><Text style={styles.link}>Sign in to save addresses</Text></Pressable> : null}
    <Pressable disabled={busy || loading} onPress={onReload} accessibilityRole="button" style={styles.back}><Text style={styles.link}>Reload saved addresses</Text></Pressable>
    {addresses.filter((item) => item.location === location).map((item) => <View key={item.id} style={[styles.card, selectedId === item.id && { borderColor: palette.gold }]}>
      <Text style={styles.name}>{item.name}{selectedId === item.id ? ' · Selected' : ''}</Text><Text style={styles.copy}>{item.address}</Text><Text style={styles.copy}>{item.location} · {item.pincode}</Text><Text style={styles.copy}>{item.phone}</Text>
      <View style={styles.actions}><Pressable disabled={busy || loading || !!loadError} onPress={() => onSelect(item.id)} accessibilityRole="button"><Text style={styles.link}>Use this address</Text></Pressable><Pressable disabled={busy || loading || !!loadError} onPress={() => { void onRemove(item.id).catch(cause=>setError(cause instanceof Error ? cause.message : 'Unable to remove address.')); }} accessibilityRole="button" accessibilityLabel={`Remove address for ${item.name}`}><Text style={styles.remove}>Remove</Text></Pressable></View>
    </View>)}
    <View style={styles.card}>
      <Text style={styles.name}>Add a new address</Text>
      <Text style={styles.label}>FULL NAME</Text><TextInput editable={!busy && !loading} value={name} onChangeText={setName} accessibilityLabel="Full name" placeholder="Recipient name" placeholderTextColor={palette.muted} maxLength={80} autoComplete="name" style={styles.input} />
      <Text style={styles.label}>PHONE NUMBER</Text><TextInput editable={!busy && !loading} value={phone} onChangeText={setPhone} accessibilityLabel="Phone number" placeholder="10-digit mobile number" placeholderTextColor={palette.muted} maxLength={15} keyboardType="phone-pad" autoComplete="tel" style={styles.input} />
      <Text style={styles.label}>HOUSE / BUILDING, STREET & LANDMARK</Text><TextInput editable={!busy && !loading} value={address} onChangeText={setAddress} accessibilityLabel="Full delivery address" placeholder="House name, road and nearby landmark" placeholderTextColor={palette.muted} maxLength={300} multiline style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} />
      <Text style={styles.label}>AREA</Text><Text style={styles.copy}>{location}</Text>
      <Text style={styles.label}>PIN CODE</Text><TextInput editable={!busy && !loading} value={pincode} onChangeText={setPincode} accessibilityLabel="PIN code" placeholder="6-digit PIN code" placeholderTextColor={palette.muted} maxLength={6} keyboardType="number-pad" style={styles.input} />
      {error ? <Text style={styles.remove} accessibilityRole="alert">{error}</Text> : null}
      <Pressable disabled={busy || loading || !!loadError} onPress={() => void save()} style={[styles.button, (busy || loading || !!loadError) && { opacity: 0.5 }]} accessibilityRole="button"><Text style={styles.buttonText}>{busy ? 'Saving…' : 'Save & use this address'}</Text></Pressable>
      <Text style={styles.note}>Addresses are saved to your account for future orders.</Text>
    </View>
  </View>;
}

const createStyles = (p: Palette) => StyleSheet.create({
  back: { paddingVertical: 12, alignSelf: 'flex-start' }, title: { color: p.text, fontSize: 26, fontWeight: '800' }, copy: { color: p.muted, fontSize: 12, lineHeight: 19, marginTop: 5 }, card: { backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 16, padding: 18, marginTop: 15 }, name: { color: p.text, fontSize: 15, fontWeight: '800' }, actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 }, link: { color: p.primaryText, fontSize: 12, fontWeight: '800' }, remove: { color: p.terracotta, fontSize: 12, lineHeight: 18, marginTop: 5 }, label: { color: p.gold, fontSize: 9, fontWeight: '800', marginTop: 15, marginBottom: 7 }, input: { borderWidth: 1, borderColor: p.border, color: p.text, fontSize: 12, borderRadius: 10, padding: 12, minHeight: 45 }, button: { backgroundColor: p.primary, minHeight: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 18 }, buttonText: { color: p.onPrimary, fontSize: 12, fontWeight: '800' }, note: { color: p.muted, fontSize: 10, marginTop: 10 },
});
