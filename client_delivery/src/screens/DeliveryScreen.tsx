import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import BrandLogo from '../components/BrandLogo';
import ClerkAccountSettings from '../auth/ClerkAccountSettings';
import { useDeliveryAuth } from '../context/DeliveryAuthContext';
import { applyForDelivery, getDeliveryHistory, getDeliveryProfile, getJob, getJobs, setAvailability, updateDeliveryProfile, updateJobStatus, updateLocation, type DeliveryProfile, type DeliveryRecord } from '../services/deliveryApi';
import { darkColors, lightColors } from '../theme';

type Palette = typeof lightColors;

type Tab = 'Home' | 'Jobs' | 'Insights' | 'History' | 'Profile' | 'Account settings';
type JobStatus = 'Assigned' | 'Accepted' | 'Rejected' | 'Picked up' | 'On the way' | 'Delivered' | 'Failed' | 'Cancelled';
type JobFilter = 'All' | 'Active' | 'On route' | 'Completed';
type Job = { id: string; orderNumber: string; customer: string; phone: string; shop: string; address: string; itemDetails: string[]; items: number; amount: number; paymentMethod: string; status: JobStatus; eta: string };
const tabs: { name: Tab; icon: string }[] = [{ name: 'Home', icon: '⌂' }, { name: 'Jobs', icon: '▤' }, { name: 'Insights', icon: '▥' }, { name: 'History', icon: '◷' }, { name: 'Profile', icon: '○' }, { name: 'Account settings', icon: '⚙' }];
const text = (value: unknown, fallback = '') => typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
const object = (value: unknown): DeliveryRecord => value && typeof value === 'object' ? value as DeliveryRecord : {};
function mapJob(value: DeliveryRecord): Job {
  const root = object(value.job ?? value);
  const job = object(root.order ?? root);
  const customer = object(job.customer ?? job.user ?? root.customer ?? job.shippingAddress);
  const shop = object(job.shop ?? job.store ?? root.shop);
  const address = object(job.shippingAddress ?? job.deliveryAddress ?? job.address ?? root.shippingAddress ?? root.deliveryAddress);
  const rawStatus = text(root.deliveryStatus ?? root.status ?? job.deliveryStatus ?? job.status ?? job.orderStatus, 'Assigned').toLowerCase().replace(/[_-]/g, ' ');
  const status: JobStatus = rawStatus.includes('reject') ? 'Rejected' : rawStatus.includes('cancel') ? 'Cancelled' : rawStatus.includes('fail') ? 'Failed' : rawStatus.includes('accept') ? 'Accepted' : rawStatus.includes('deliver') || rawStatus === 'complete' ? 'Delivered' : rawStatus.includes('way') || rawStatus.includes('transit') || rawStatus.includes('out for') ? 'On the way' : rawStatus.includes('pick') ? 'Picked up' : 'Assigned';
  const items = Array.isArray(job.items) ? job.items : Array.isArray(root.items) ? root.items : [];
  const itemDetails = items.map(value => {
    const line = object(value);
    const product = object(line.product ?? line);
    const name = text(line.name ?? product.name ?? line.title, 'Item');
    const quantity = Number(line.quantity ?? 1);
    const price = Number(line.price ?? product.price ?? 0);
    const size = text(line.size);
    return `${name}${size ? ` · ${size}` : ''} × ${quantity}${price ? ` · ₹${(price * quantity).toLocaleString('en-IN')}` : ''}`;
  });
  return {
    id: text(root._id ?? root.id ?? job._id ?? job.id ?? job.orderNumber, '—'),
    orderNumber: text(root.orderNumber ?? job.orderNumber),
    customer: text(root.customerName ?? job.customerName ?? (typeof job.customer === 'string' ? job.customer : customer.fullName ?? customer.name ?? customer.recipientName), 'Customer'),
    phone: text(root.customerPhone ?? job.customerPhone ?? customer.phone, ''),
    shop: text(root.shopName ?? job.shopName ?? (typeof job.shop === 'string' ? job.shop : shop.name), 'Shop'),
    address: [address.street, address.city, address.state, address.zipCode].map(part => text(part)).filter(Boolean).join(', ') || text(root.address ?? root.shippingAddress ?? root.deliveryAddress ?? job.address ?? job.shippingAddress ?? job.deliveryAddress, 'Address not available'),
    itemDetails,
    items: items.length ? items.reduce((sum, item) => sum + Number(object(item).quantity ?? 1), 0) : Number(job.itemCount ?? job.itemsCount ?? 0),
    amount: Number(job.totalAmount ?? job.grandTotal ?? job.total ?? job.amount ?? root.totalAmount ?? root.amount ?? 0),
    paymentMethod: text(root.paymentMethod ?? job.paymentMethod),
    status,
    eta: text(root.estimatedDeliveryTime ?? root.eta ?? job.estimatedDeliveryTime ?? job.eta, ''),
  };
}

function profileFrom(value: DeliveryProfile): DeliveryProfile {
  return object(value.delivery ?? value.profile ?? value) as DeliveryProfile;
}

export default function DeliveryScreen() {
  const { partner, getToken, logout } = useDeliveryAuth();
  const applicationKey = `delivery-application:${partner?.id ?? 'unknown'}`;
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [themeReady, setThemeReady] = useState(false);
  const C = mode === 'dark' ? darkColors : lightColors;
  const s = useMemo(() => createStyles(C), [C]);
  const [tab, setTab] = useState<Tab>('Home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [applicationStatus, setApplicationStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [gpsSharing, setGpsSharing] = useState(false);
  const gpsSubscription = useRef<Location.LocationSubscription | null>(null);
  const gpsStarting = useRef(false);
  const gpsUpdateInFlight = useRef(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<Job[]>([]);
  const [jobFilter, setJobFilter] = useState<JobFilter>('Active');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ fullName: partner?.name ?? '', phone: '', vehicleType: 'bike', vehicleNumber: '', serviceLocations: 'Thodupuzha, Muttom' });
  const [profileDraft, setProfileDraft] = useState({ fullName: '', phone: '', vehicleType: '', vehicleNumber: '', serviceLocations: '' });

  useEffect(() => { void AsyncStorage.getItem('delivery-theme').then(value => { if (value === 'dark' || value === 'light') setMode(value); }).catch(() => {}).finally(() => setThemeReady(true)); }, []);
  useEffect(() => { if (themeReady) void AsyncStorage.setItem('delivery-theme', mode); }, [mode, themeReady]);
  useEffect(() => () => { gpsSubscription.current?.remove(); }, []);

  const token = useCallback(async () => {
    const value = await getToken();
    if (!value) throw new Error('Sign in again to continue.');
    return value;
  }, [getToken]);

  const loadProfile = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const current = profileFrom(await getDeliveryProfile(await token()));
      if (!Object.keys(current).length) throw new Error('The delivery profile response was empty.');
      setProfile(current);
      const status = text(current.status).toLowerCase();
      if (status && !['approved', 'active'].includes(status)) { setApplicationStatus(text(current.status, 'Awaiting approval')); return; }
      void AsyncStorage.removeItem(applicationKey).catch(() => {});
      setApplicationStatus('');
      setProfileDraft({ fullName: text(current.fullName ?? current.name, partner?.name ?? ''), phone: text(current.phone), vehicleType: text(current.vehicleType), vehicleNumber: text(current.vehicleNumber), serviceLocations: Array.isArray(current.serviceLocations) ? current.serviceLocations.join(', ') : '' });
      const accessToken = await token();
      const [jobsResult, historyResult] = await Promise.allSettled([getJobs(accessToken), getDeliveryHistory(accessToken)]);
      if (jobsResult.status === 'rejected') throw jobsResult.reason;
      setJobs(jobsResult.value.map(mapJob));
      if (historyResult.status === 'fulfilled') setHistory(historyResult.value.map(mapJob));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load your delivery account.';
      if (/\(404\)/.test(message)) { setProfile(null); setApplicationStatus(await AsyncStorage.getItem(applicationKey).catch(() => null) || ''); }
      else if (/\(403\)/.test(message)) { setProfile(null); setApplicationStatus(await AsyncStorage.getItem(applicationKey).catch(() => null) || ''); }
      else setError(message);
    } finally { setLoading(false); }
  }, [applicationKey, partner?.name, token]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  async function refreshJobs() {
    setBusy(true); setError('');
    try { setJobs((await getJobs(await token(), true)).map(mapJob)); setNotice('Deliveries updated.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load deliveries.'); }
    finally { setBusy(false); }
  }

  async function openJob(id: string) {
    setBusy(true); setError('');
    try { setSelectedJob(mapJob(await getJob(await token(), id))); setTab('Jobs'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load delivery details.'); }
    finally { setBusy(false); }
  }

  async function changeStatus(job: Job, next: JobStatus) {
    setBusy(true); setError('');
    try {
      const updated = await updateJobStatus(await token(), job.id, next.toLowerCase().replace(/ /g, '_'));
      const mapped = mapJob(updated);
      const result = mapped.id === '—' ? { ...job, status: next } : mapped;
      setJobs(current => current.map(item => item.id === job.id ? result : item));
      setHistory(current => next === 'Delivered' || next === 'Rejected' ? [result, ...current.filter(item => item.id !== job.id)] : current.filter(item => item.id !== job.id));
      if (selectedJob?.id === job.id) setSelectedJob(result);
      setNotice(`Delivery status updated: ${next}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update delivery status.'); }
    finally { setBusy(false); }
  }

  async function toggleAvailability() {
    const next = !available;
    setBusy(true); setError('');
    try { const result = await setAvailability(await token(), next); setProfile(current => ({ ...current, ...object(result), isAvailable: next })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update availability.'); }
    finally { setBusy(false); }
  }

  async function saveProfile() {
    setBusy(true); setError('');
    try {
      await updateDeliveryProfile(await token(), { ...profileDraft, serviceLocations: profileDraft.serviceLocations.split(',').map(value => value.trim()).filter(Boolean) });
      setProfile(profileFrom(await getDeliveryProfile(await token()))); setNotice('Profile saved.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save profile.'); }
    finally { setBusy(false); }
  }

  async function sendLocation() {
    setBusy(true); setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Allow location access to update your delivery location.');
      const position = await Location.getCurrentPositionAsync({});
      await updateLocation(await token(), position.coords.latitude, position.coords.longitude);
      setNotice('Current location sent.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update location.'); }
    finally { setBusy(false); }
  }

  async function toggleGpsSharing() {
    if (gpsSubscription.current) {
      gpsSubscription.current.remove(); gpsSubscription.current = null; setGpsSharing(false); setNotice('Live GPS sharing stopped.'); return;
    }
    if (gpsStarting.current) return;
    gpsStarting.current = true; setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Allow location access to share live GPS.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await updateLocation(await token(), position.coords.latitude, position.coords.longitude);
      gpsSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 25 },
        next => {
          if (gpsUpdateInFlight.current) return;
          gpsUpdateInFlight.current = true;
          void (async () => {
            try { await updateLocation(await token(), next.coords.latitude, next.coords.longitude); }
            catch (cause) { setError(cause instanceof Error ? cause.message : 'Live GPS update failed.'); }
            finally { gpsUpdateInFlight.current = false; }
          })();
        },
      );
      setGpsSharing(true); setNotice('Live GPS sharing is on while the app is open.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not start live GPS.'); }
    finally { gpsStarting.current = false; }
  }

  async function loadHistory() {
    setBusy(true); setError('');
    try { setHistory((await getDeliveryHistory(await token())).map(mapJob)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load delivery history.'); }
    finally { setBusy(false); }
  }

  async function submitApplication() {
    if (!form.fullName.trim() || !form.phone.trim() || !form.vehicleNumber.trim() || !form.serviceLocations.trim()) { setError('Complete each field before applying.'); return; }
    setBusy(true); setError('');
    try {
      const result = await applyForDelivery(await token(), { ...form, vehicleType: form.vehicleType.toLowerCase(), serviceLocations: form.serviceLocations.split(',').map(value => value.trim()).filter(Boolean) });
      const status = text(result.status, 'Submitted — awaiting admin approval');
      setApplicationStatus(status);
      await AsyncStorage.setItem(applicationKey, status).catch(() => {});
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not submit your application.'); }
    finally { setBusy(false); }
  }

  function openDrawer() {
    setDrawerOpen(true);
    Animated.timing(progress, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }
  function closeDrawer() {
    Animated.timing(progress, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => { if (finished) setDrawerOpen(false); });
  }
  function selectTab(next: Tab) {
    setTab(next); setSelectedJob(null); closeDrawer();
    if (next === 'Jobs' || next === 'Insights') void refreshJobs();
    if (next === 'History' || next === 'Insights') void loadHistory();
  }

  const availability = profile?.isAvailable ?? profile?.availability;
  const available = availability === true || ['online', 'available'].includes(text(availability).toLowerCase());
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [330, 0] });
  const shownJobsSource = jobs;
  const isTerminal = (job: Job) => ['Delivered', 'Rejected', 'Failed', 'Cancelled'].includes(job.status);
  const activeJobs = useMemo(() => shownJobsSource.filter(job => !isTerminal(job)), [shownJobsSource]);
  const filteredJobs = jobs.filter(job => jobFilter === 'All' || (jobFilter === 'Active' ? !isTerminal(job) : jobFilter === 'On route' ? job.status === 'Picked up' || job.status === 'On the way' : job.status === 'Delivered'));
  const pickupCount = shownJobsSource.filter(job => job.status === 'Assigned' || job.status === 'Accepted').length;
  const onRoadCount = shownJobsSource.filter(job => job.status === 'On the way').length;
  const shownHistory = history;
  const shownJobs = tab === 'History' ? shownHistory : tab === 'Jobs' ? filteredJobs : activeJobs;

  return <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    <View style={s.header}>
      <BrandLogo size={40} /><View style={{ flex: 1 }}><Text style={s.kicker}>NEARBY</Text><Text style={s.brand}>Delivery partner</Text></View>
      {profile ? <TouchableOpacity accessibilityRole="switch" accessibilityLabel="Delivery availability" accessibilityState={{ checked: available }} onPress={() => void toggleAvailability()} style={[s.availability, available && s.available]}><Text style={[s.availabilityText, available && s.availableText]}>{available ? 'Online' : 'Offline'}</Text></TouchableOpacity> : null}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open options menu" onPress={openDrawer} style={s.menuButton}><Text style={s.menuIcon}>☰</Text></TouchableOpacity>
    </View>

    <ScrollView contentContainerStyle={s.page}>
      {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
      {notice ? <TouchableOpacity onPress={() => setNotice('')} style={s.notice}><Text style={s.noticeText}>{notice}  ×</Text></TouchableOpacity> : null}
      {loading ? <View style={s.center}><ActivityIndicator color={C.primary} /><Text style={s.muted}>Loading delivery account…</Text></View> : applicationStatus ? <View style={s.card}><Text style={s.title}>Application status</Text><Text style={s.copy}>{applicationStatus}</Text><TouchableOpacity onPress={() => void loadProfile()} style={s.button}><Text style={s.buttonText}>Check approval</Text></TouchableOpacity></View> : !profile ? <View style={s.card}>
        <Text style={s.title}>Apply as a delivery partner</Text><Text style={s.copy}>Submit your details. You can access delivery jobs after admin approval.</Text>
        <Field styles={s} placeholderColor={C.muted} label="Full name" value={form.fullName} onChange={fullName => setForm(value => ({ ...value, fullName }))} />
        <Field styles={s} placeholderColor={C.muted} label="Phone" value={form.phone} onChange={phone => setForm(value => ({ ...value, phone }))} keyboardType="phone-pad" />
        <Field styles={s} placeholderColor={C.muted} label="Vehicle type" value={form.vehicleType} onChange={vehicleType => setForm(value => ({ ...value, vehicleType }))} />
        <Field styles={s} placeholderColor={C.muted} label="Vehicle number" value={form.vehicleNumber} onChange={vehicleNumber => setForm(value => ({ ...value, vehicleNumber }))} />
        <Field styles={s} placeholderColor={C.muted} label="Service locations (comma separated)" value={form.serviceLocations} onChange={serviceLocations => setForm(value => ({ ...value, serviceLocations }))} />
        <TouchableOpacity disabled={busy} onPress={() => void submitApplication()} style={[s.button, busy && s.disabled]}><Text style={s.buttonText}>{busy ? 'Submitting…' : 'Submit application'}</Text></TouchableOpacity>
      </View> : <>
        {tab === 'Home' ? <>
          <Text style={s.kicker}>YOUR DAILY OVERVIEW</Text><Text style={s.title}>Hello, {partner?.name.split(' ')[0] || 'there'}.</Text>
          <View style={s.hero}><Text style={s.heroTitle}>{activeJobs.length} active deliveries</Text><Text style={s.heroCopy}>Your assigned jobs and delivery updates.</Text><TouchableOpacity onPress={() => selectTab('Jobs')} style={s.heroButton}><Text style={s.heroButtonText}>View deliveries →</Text></TouchableOpacity></View>
          <View style={s.statsRow}>
            <View style={s.statCard}><Text style={s.statValue}>{pickupCount}</Text><Text style={s.statLabel}>Pickups</Text></View>
            <View style={s.statCard}><Text style={s.statValue}>{onRoadCount}</Text><Text style={s.statLabel}>On road</Text></View>
            <View style={s.statCard}><Text style={s.statValue}>{history.filter(job => job.status === 'Delivered').length}</Text><Text style={s.statLabel}>Delivered</Text></View>
          </View>
          <View style={s.row}><Text style={s.sectionTitle}>Your route ahead</Text><TouchableOpacity onPress={() => selectTab('Jobs')}><Text style={s.link}>All jobs →</Text></TouchableOpacity></View>
          {activeJobs.length ? activeJobs.slice(0, 3).map(job => <JobCard key={job.id} job={job} onPress={() => void openJob(job.id)} onStatus={status => void changeStatus(job, status)} busy={busy} />) : <Empty copy="No active deliveries assigned." />}
        </> : null}
        {tab === 'Jobs' || tab === 'History' ? <>
          {selectedJob ? <>
            <TouchableOpacity onPress={() => setSelectedJob(null)}><Text style={s.link}>← All deliveries</Text></TouchableOpacity>
            <Text style={s.title}>Delivery details</Text>
            <View style={s.card}>
              <Text style={s.detailHeading}>Order {selectedJob.orderNumber || selectedJob.id}</Text>
              <Detail label="Status" value={selectedJob.status} />
              <Detail label="Shop" value={selectedJob.shop} />
              <Detail label="Customer" value={selectedJob.customer} />
              {selectedJob.phone ? <Detail label="Phone" value={selectedJob.phone} /> : null}
              <Detail label="Delivery address" value={selectedJob.address} />
              {selectedJob.eta ? <Detail label="Estimated delivery" value={selectedJob.eta} /> : null}
              {selectedJob.paymentMethod ? <Detail label="Payment" value={selectedJob.paymentMethod} /> : null}
              <View style={s.detailDivider} />
              <Text style={s.detailLabel}>ITEMS · {selectedJob.items}</Text>
              {selectedJob.itemDetails.length ? selectedJob.itemDetails.map((line, index) => <Text key={`${selectedJob.id}-${index}`} style={s.detailValue}>{line}</Text>) : <Text style={s.copy}>Item details were not included in the API response.</Text>}
              <View style={s.detailDivider} />
              <Detail label="Order total" value={`₹${selectedJob.amount.toLocaleString('en-IN')}`} />
              <JobActions job={selectedJob} busy={busy} onStatus={status => void changeStatus(selectedJob, status)} />
            </View>
          </> : <>
            <View style={s.row}><Text style={s.title}>{tab === 'History' ? 'Delivery history' : 'My deliveries'}</Text><TouchableOpacity onPress={() => tab === 'History' ? void loadHistory() : void refreshJobs()}><Text style={s.link}>Refresh</Text></TouchableOpacity></View>
            {tab === 'Jobs' ? <View style={s.filterRow}>{(['All', 'Active', 'On route', 'Completed'] as const).map(filter => <TouchableOpacity key={filter} onPress={() => setJobFilter(filter)} accessibilityRole="button" accessibilityState={{ selected: jobFilter === filter }} style={[s.filterChip, jobFilter === filter && s.filterChipActive]}><Text style={[s.filterText, jobFilter === filter && s.filterTextActive]}>{filter}</Text></TouchableOpacity>)}</View> : null}
            {shownJobs.length ? shownJobs.map(job => <JobCard key={job.id} job={job} onPress={() => void openJob(job.id)} onStatus={status => void changeStatus(job, status)} busy={busy} />) : <Empty copy={tab === 'History' ? 'No delivery history found.' : 'No deliveries found.'} />}
          </>}
        </> : null}
        {tab === 'Insights' ? <>
          <Text style={s.kicker}>DELIVERY PERFORMANCE</Text><Text style={s.title}>Insights</Text>
          <Text style={s.copy}>A summary from your assigned jobs and delivery history.</Text>
          <View style={s.statsRow}>
            <View style={s.statCard}><Text style={s.statValue}>{activeJobs.length}</Text><Text style={s.statLabel}>Active now</Text></View>
            <View style={s.statCard}><Text style={s.statValue}>{history.filter(job => job.status === 'Delivered').length}</Text><Text style={s.statLabel}>Completed</Text></View>
          </View>
          <View style={s.statsRow}>
            <View style={s.statCard}><Text style={s.statValue}>{pickupCount}</Text><Text style={s.statLabel}>Pickups</Text></View>
            <View style={s.statCard}><Text style={s.statValue}>{onRoadCount}</Text><Text style={s.statLabel}>On route</Text></View>
          </View>
          <TouchableOpacity onPress={() => selectTab('History')} style={s.secondaryButton}><Text style={s.secondaryText}>View delivery history</Text></TouchableOpacity>
        </> : null}
        {tab === 'Account settings' ? <>
          <Text style={s.kicker}>SECURE SIGN-IN</Text><Text style={s.title}>Account settings</Text>
          <ClerkAccountSettings />
        </> : null}
        {tab === 'Profile' ? <>
          <Text style={s.title}>Delivery profile</Text>
          <Field styles={s} placeholderColor={C.muted} label="Full name" value={profileDraft.fullName} onChange={fullName => setProfileDraft(value => ({ ...value, fullName }))} />
          <Field styles={s} placeholderColor={C.muted} label="Phone" value={profileDraft.phone} onChange={phone => setProfileDraft(value => ({ ...value, phone }))} keyboardType="phone-pad" />
          <Field styles={s} placeholderColor={C.muted} label="Vehicle type" value={profileDraft.vehicleType} onChange={vehicleType => setProfileDraft(value => ({ ...value, vehicleType }))} />
          <Field styles={s} placeholderColor={C.muted} label="Vehicle number" value={profileDraft.vehicleNumber} onChange={vehicleNumber => setProfileDraft(value => ({ ...value, vehicleNumber }))} />
          <Field styles={s} placeholderColor={C.muted} label="Service locations (comma separated)" value={profileDraft.serviceLocations} onChange={serviceLocations => setProfileDraft(value => ({ ...value, serviceLocations }))} />
          <TouchableOpacity disabled={busy} onPress={() => void saveProfile()} style={[s.button, busy && s.disabled]}><Text style={s.buttonText}>{busy ? 'Saving…' : 'Save profile'}</Text></TouchableOpacity>
          <TouchableOpacity disabled={busy} onPress={() => void sendLocation()} style={[s.secondaryButton, busy && s.disabled]}><Text style={s.secondaryText}>Send current location</Text></TouchableOpacity>
        </> : null}
      </>}
    </ScrollView>

    {drawerOpen ? <View style={s.drawerLayer}>
      <Animated.View pointerEvents="none" style={[s.backdrop, { opacity: progress }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} accessibilityRole="button" accessibilityLabel="Close options menu" />
      <Animated.View style={[s.drawer, { transform: [{ translateX }] }]}>
        <View style={s.drawerHeader}><View style={s.brandRow}><BrandLogo size={38} /><View><Text style={s.drawerBrand}>NearBy</Text><Text style={s.drawerSub}>DELIVERY PARTNER</Text></View></View><TouchableOpacity onPress={closeDrawer} style={s.closeButton} accessibilityRole="button" accessibilityLabel="Close options menu"><Text style={s.closeText}>×</Text></TouchableOpacity></View>
        <ScrollView contentContainerStyle={{ paddingBottom: 14 }}>
          <View style={s.accountBox}><Text style={s.accountKicker}>NEARBY ACCOUNT</Text><Text style={s.accountName}>{partner?.name || 'Delivery partner'}</Text></View>
          {tabs.map(item => <TouchableOpacity key={item.name} onPress={() => selectTab(item.name)} style={[s.drawerItem, tab === item.name && s.drawerItemActive]} accessibilityRole="button" accessibilityState={{ selected: tab === item.name }}><Text style={[s.drawerItemIcon, tab === item.name && s.drawerItemSelected]}>{item.icon}</Text><Text style={[s.drawerItemText, tab === item.name && s.drawerItemSelected]}>{item.name}</Text></TouchableOpacity>)}
          <View style={s.divider} />
          <TouchableOpacity onPress={() => void toggleAvailability()} style={s.drawerItem}><Text style={s.drawerItemIcon}>◉</Text><Text style={s.drawerItemText}>Availability · {available ? 'Online' : 'Offline'}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => { closeDrawer(); void sendLocation(); }} style={s.drawerItem}><Text style={s.drawerItemIcon}>⌖</Text><Text style={s.drawerItemText}>Update location</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: gpsSharing }} onPress={() => void toggleGpsSharing()} style={s.drawerItem}><Text style={s.drawerItemIcon}>◎</Text><Text style={s.drawerItemText}>Live GPS · {gpsSharing ? 'On' : 'Off'}</Text></TouchableOpacity>
          <Text style={s.themeLabel}>APPEARANCE</Text>
          <View style={s.themeChoices}>{(['light', 'dark'] as const).map(option => <TouchableOpacity key={option} onPress={() => setMode(option)} accessibilityRole="button" accessibilityState={{ selected: mode === option }} style={[s.themeChoice, mode === option && s.themeChoiceSelected]}><Text style={[s.themeChoiceText, mode === option && s.themeChoiceTextSelected]}>{option === 'light' ? '☀ Light' : '☾ Dark'}</Text></TouchableOpacity>)}</View>
        </ScrollView>
        <TouchableOpacity onPress={() => { closeDrawer(); void logout(); }} style={s.logout}><Text style={s.logoutText}>Log out</Text></TouchableOpacity>
      </Animated.View>
    </View> : null}
  </SafeAreaView>;

function nextStatus(status: JobStatus): JobStatus | null { return status === 'Accepted' ? 'Picked up' : status === 'Picked up' ? 'On the way' : status === 'On the way' ? 'Delivered' : null; }
function nextAction(status: JobStatus) { return status === 'Accepted' ? 'Confirm pickup' : status === 'Picked up' ? 'Start delivery' : 'Mark delivered'; }
  function Empty({ copy }: { copy: string }) { return <View style={s.empty}><Text style={s.copy}>{copy}</Text></View>; }
  function Detail({ label, value }: { label: string; value: string }) { return <View style={s.detailRow}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue}>{value}</Text></View>; }
  function JobActions({ job, onStatus, busy }: { job: Job; onStatus: (status: JobStatus) => void; busy: boolean }) {
    if (isTerminal(job)) return null;
    if (job.status === 'Assigned') return <TouchableOpacity disabled={busy} onPress={() => onStatus('Accepted')} style={[s.actionButton, s.acceptAction, busy && s.disabled]}><Text style={s.acceptActionText}>{busy ? 'Updating…' : 'Accept delivery'}</Text></TouchableOpacity>;
    const next = nextStatus(job.status);
    return next ? <TouchableOpacity disabled={busy} onPress={() => onStatus(next)}><Text style={s.link}>{busy ? 'Updating…' : nextAction(job.status)}</Text></TouchableOpacity> : null;
  }
  function JobCard({ job, onPress, onStatus, busy }: { job: Job; onPress: () => void; onStatus: (status: JobStatus) => void; busy: boolean }) {
    return <View style={s.card}>
      <View style={s.row}><Text style={s.jobId}>{job.id}</Text><Text style={s.status}>{job.status}</Text></View>
      <Text style={s.cardTitle}>{job.shop} → {job.customer}</Text><Text style={s.copy}>{job.address}</Text>
      <Text style={s.copy}>{job.items} items · ₹{job.amount.toLocaleString('en-IN')}{job.eta ? ` · ${job.eta}` : ''}</Text>
      <View style={s.row}><TouchableOpacity onPress={onPress}><Text style={s.link}>Details</Text></TouchableOpacity><JobActions job={job} onStatus={onStatus} busy={busy} /></View>
    </View>;
  }
}

function Field({ styles, placeholderColor, label, value, onChange, keyboardType = 'default' }: { styles: ReturnType<typeof createStyles>; placeholderColor: string; label: string; value: string; onChange: (value: string) => void; keyboardType?: 'default' | 'phone-pad' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType={keyboardType} placeholderTextColor={placeholderColor} style={styles.input} /></View>;
}

function createStyles(C: Palette) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.surface }, kicker: { color: C.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, brand: { color: C.text, fontSize: 15, fontWeight: '800', marginTop: 3 }, menuButton: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: C.soft }, menuIcon: { color: C.primaryText, fontSize: 21 }, availability: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: C.soft }, available: { backgroundColor: '#E3F1E8' }, availabilityText: { color: C.muted, fontSize: 11, fontWeight: '800' }, availableText: { color: '#287348' },
  page: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 18, paddingBottom: 36 }, center: { alignItems: 'center', padding: 30, gap: 12 }, title: { color: C.text, fontSize: 23, fontWeight: '900', marginVertical: 10 }, sectionTitle: { color: C.text, fontSize: 16, fontWeight: '800', marginVertical: 12 }, filterRow: { flexDirection: 'row', gap: 7, marginVertical: 8 }, filterChip: { flex: 1, minHeight: 37, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 6 }, filterChipActive: { backgroundColor: C.primary, borderColor: C.primary }, filterText: { color: C.muted, fontSize: 10, fontWeight: '700' }, filterTextActive: { color: C.onPrimary, fontWeight: '900' }, statsRow: { flexDirection: 'row', gap: 8, marginVertical: 10 }, statCard: { flex: 1, padding: 12, backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 11 }, statValue: { color: C.primaryText, fontSize: 20, fontWeight: '900' }, statLabel: { color: C.muted, fontSize: 10, fontWeight: '700', marginTop: 4 }, hero: { backgroundColor: C.primary, borderRadius: 14, padding: 18, marginVertical: 15 }, heroTitle: { color: C.onPrimary, fontSize: 21, fontWeight: '900' }, heroCopy: { color: C.tint, marginTop: 5 }, heroButton: { alignSelf: 'flex-start', padding: 10, backgroundColor: C.surface, borderRadius: 9, marginTop: 12 }, heroButtonText: { color: C.primaryText, fontWeight: '800' }, card: { padding: 15, backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 13, marginVertical: 7, gap: 8 }, detailHeading: { color: C.text, fontSize: 17, fontWeight: '900', marginBottom: 5 }, detailRow: { gap: 3, marginVertical: 3 }, detailLabel: { color: C.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }, detailValue: { color: C.text, fontSize: 13, lineHeight: 19 }, detailDivider: { height: 1, backgroundColor: C.border, marginVertical: 8 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, actionRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, actionButton: { minHeight: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8 }, acceptAction: { backgroundColor: C.primary }, acceptActionText: { color: C.onPrimary, fontSize: 11, fontWeight: '800' }, rejectAction: { borderWidth: 1, borderColor: C.border }, rejectActionText: { color: C.red, fontSize: 11, fontWeight: '800' }, cardTitle: { color: C.text, fontWeight: '800', fontSize: 14 }, copy: { color: C.muted, lineHeight: 20, fontSize: 12 }, link: { color: C.primaryText, fontWeight: '800', paddingVertical: 8 }, jobId: { color: C.primaryText, fontSize: 11, fontWeight: '800' }, status: { color: C.primaryText, backgroundColor: C.soft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5, fontSize: 10, fontWeight: '800' }, field: { gap: 6, marginTop: 10 }, fieldLabel: { color: C.text, fontSize: 12, fontWeight: '700' }, input: { minHeight: 44, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 11, color: C.text, backgroundColor: C.surface }, button: { minHeight: 45, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginTop: 14, paddingHorizontal: 12 }, buttonText: { color: C.onPrimary, fontWeight: '800' }, secondaryButton: { minHeight: 44, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, secondaryText: { color: C.primaryText, fontWeight: '800' }, disabled: { opacity: 0.55 }, empty: { padding: 20, alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border }, errorBox: { backgroundColor: '#FBE9ED', borderRadius: 9, padding: 12, marginBottom: 10 }, errorText: { color: C.red, fontSize: 12 }, notice: { backgroundColor: C.soft, borderRadius: 9, padding: 11, marginBottom: 10 }, noticeText: { color: C.primaryText, fontSize: 12 }, muted: { color: C.muted, fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(35,24,48,0.42)' }, modalCard: { width: '100%', maxWidth: 460, alignSelf: 'center', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, modalInput: { minHeight: 80, textAlignVertical: 'top', marginTop: 12 }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  drawerLayer: { ...StyleSheet.absoluteFill, zIndex: 20 }, backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(35,24,48,0.42)' }, drawer: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '80%', maxWidth: 320, paddingTop: 54, paddingHorizontal: 16, backgroundColor: C.surface, borderLeftWidth: 1, borderLeftColor: C.border, boxShadow: '-6px 0px 24px rgba(32,19,49,0.18)' }, drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18 }, brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, drawerBrand: { color: C.text, fontSize: 20, fontWeight: '800' }, drawerSub: { color: C.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 3 }, closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: C.soft }, closeText: { color: C.primaryText, fontSize: 24 }, accountBox: { padding: 12, marginBottom: 12, borderRadius: 13, backgroundColor: C.primary }, accountKicker: { color: C.onPrimary, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, accountName: { color: C.onPrimary, fontSize: 12, fontWeight: '900', marginTop: 5 }, drawerItem: { minHeight: 47, paddingHorizontal: 10, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 3 }, drawerItemActive: { backgroundColor: C.soft }, drawerItemIcon: { width: 19, color: C.muted, fontSize: 18, textAlign: 'center' }, drawerItemText: { color: C.text, fontSize: 12, fontWeight: '700' }, drawerItemSelected: { color: C.primaryText, fontWeight: '900' }, divider: { height: 1, backgroundColor: C.border, marginVertical: 15 }, themeLabel: { color: C.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 14, marginBottom: 8, marginLeft: 10 }, themeChoices: { flexDirection: 'row', gap: 8, paddingHorizontal: 8 }, themeChoice: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 10 }, themeChoiceSelected: { backgroundColor: C.soft, borderColor: C.primary }, themeChoiceText: { color: C.text, fontSize: 12, fontWeight: '700' }, themeChoiceTextSelected: { color: C.primaryText, fontWeight: '900' }, logout: { flexShrink: 0, marginVertical: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }, logoutText: { color: C.red, fontSize: 12, fontWeight: '800' },
}); }
