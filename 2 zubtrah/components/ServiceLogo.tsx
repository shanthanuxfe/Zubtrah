import { useState } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { getLogoInfo, clearbitLogoUrl } from '@/lib/logos';

type ServiceLogoProps = {
  name: string;
  size?: number;
};

export function ServiceLogo({ name, size = 54 }: ServiceLogoProps) {
  const info = getLogoInfo(name);
  const borderRadius = size * 0.2;
  const [imgError, setImgError] = useState(false);

  // Render Clearbit image if available and not failed; otherwise fallback
  if (info.type === 'clearbit' && !imgError) {
    const uri = clearbitLogoUrl(info.domain, Math.round(size * 2));
    return (
      <View style={[styles.logoWrap, { width: size, height: size, borderRadius }]}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius }}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      </View>
    );
  }

  // Initials fallback (deterministic per name, never blank)
  const fallback = (() => {
    if (info.type === 'initials') return info;
    const words = name.trim().split(/\s+/);
    const letter =
      words.length === 1
        ? words[0].slice(0, 2).toUpperCase()
        : (words[0][0] + words[1][0]).toUpperCase();
    const palette = [
      { bg: '#1A1A1A', fg: '#FFFFFF' },
      { bg: '#1A6B5A', fg: '#FFFFFF' },
      { bg: '#1D4ED8', fg: '#FFFFFF' },
      { bg: '#DC2626', fg: '#FFFFFF' },
      { bg: '#9333EA', fg: '#FFFFFF' },
      { bg: '#D97706', fg: '#FFFFFF' },
      { bg: '#0891B2', fg: '#FFFFFF' },
    ];
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = ((h << 5) - h + name.charCodeAt(i)) & 0xffffffff;
    }
    const p = palette[Math.abs(h) % palette.length];
    return { letter, bg: p.bg, fg: p.fg };
  })();

  return (
    <View
      style={[
        styles.initialsWrap,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: fallback.bg,
        },
      ]}>
      <Text
        style={[styles.initialsText, { color: fallback.fg, fontSize: size * 0.36 }]}>
        {fallback.letter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  initialsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: 'Inter-Bold',
  },
});
