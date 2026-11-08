import { Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useShopUI } from './ShopUI';
import type { ProductImage } from '../services/shopProducts';

export default function ProductImages({ kept, added, onChange, disabled }: { kept: string[]; added: ProductImage[]; onChange: (kept: string[], added: ProductImage[]) => void; disabled: boolean }) {
  const { C, S } = useShopUI();
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  async function pick() {
    if (disabled || picking) return;
    setPicking(true); setError('');
    try {
      const remaining = 5 - kept.length - added.length;
      if (remaining <= 0) return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining, quality: 0.8, preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible });
      if (result.canceled) return;
      if (result.assets.some(asset => (asset.fileSize ?? 0) > 5 * 1024 * 1024)) throw new Error('Choose images smaller than 5 MB each.');
      const images = result.assets.slice(0, remaining).map((asset, index) => {
        const type = asset.mimeType ?? asset.file?.type ?? '';
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(type)) throw new Error('Choose JPEG, PNG, WEBP or AVIF images.');
        return { uri: asset.uri, name: asset.fileName ?? `product-${Date.now()}-${index}.${type.split('/')[1]}`, type, file: asset.file };
      });
      onChange(kept, [...added, ...images]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to select images.'); }
    finally { setPicking(false); }
  }
  return <View style={{ marginBottom: 16, gap: 10 }}>
    <Text style={S.label}>PRODUCT IMAGES · 1–5 PHOTOS</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {[...kept.map(uri => ({ uri })), ...added].map((image, index) => <View key={`${image.uri}:${index}`}><Image source={{ uri: image.uri }} style={{ width: 72, height: 72, borderRadius: 10 }} /><Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={`Remove image ${index + 1}`} onPress={() => index < kept.length ? onChange(kept.filter((_, i) => i !== index), added) : onChange(kept, added.filter((_, i) => i !== index - kept.length))} style={{ paddingVertical: 8 }}><Text style={{ color: C.red, fontSize: 11 }}>Remove</Text></Pressable></View>)}
    </View>
    {kept.length + added.length < 5 ? <Pressable disabled={disabled || picking} accessibilityRole="button" onPress={() => void pick()} style={S.secondary}><Text style={S.secondaryText}>{picking ? 'Opening photos…' : '＋ Select images'}</Text></Pressable> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: C.red, fontSize: 12 }}>{error}</Text> : null}
  </View>;
}
