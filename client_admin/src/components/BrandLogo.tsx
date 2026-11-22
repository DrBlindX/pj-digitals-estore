import { mobileLogoSize } from '../../../shared/mobile';
import { Image, useWindowDimensions } from 'react-native';
import { logo } from '../../../shared/brand';

export default function BrandLogo({ size = 40 }: { size?: number }) {
  const { width } = useWindowDimensions();
  size = mobileLogoSize(size, width);
  return <Image source={logo} resizeMode="contain" accessibilityLabel="NearBy logo" style={{ width: size, height: size, flexShrink: 0 }} />;
}
