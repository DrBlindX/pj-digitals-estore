import { Image } from 'react-native';
import { logo } from '../../../shared/brand';

export default function BrandLogo({ size = 40 }: { size?: number }) {
  return <Image source={logo} resizeMode="contain" accessibilityLabel="NearBy logo" style={{ width: size, height: size, flexShrink: 0 }} />;
}
