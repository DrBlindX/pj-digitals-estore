import { Platform, ToastAndroid } from 'react-native';
export type ToastMessage = { text: string; type: 'success' | 'error' };
const listeners = new Set<(message: ToastMessage) => void>();
export function showToast(text: string, type: ToastMessage['type'] = 'success') {
 if (!text.trim()) return;
 if (Platform.OS === 'android') { ToastAndroid.show(text, type === 'error' ? ToastAndroid.LONG : ToastAndroid.SHORT); return; }
 listeners.forEach(listener => listener({ text, type }));
}
export function subscribeToast(listener: (message: ToastMessage) => void) {
 listeners.add(listener);
 return () => { listeners.delete(listener); };
}
