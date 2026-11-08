import { Image } from 'react-native';

export default function BrandLogo({ size = 40 }: { size?: number }) {
  return <Image source={require('../../assets/images/nearby-logo.png')} resizeMode="contain" accessibilityLabel="NearBy logo" style={{ width: size, height: size }} />;
}
