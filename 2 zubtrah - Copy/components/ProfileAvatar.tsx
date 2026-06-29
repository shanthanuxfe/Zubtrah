import { useState } from 'react';
import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { User } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useSettings';

type ProfileAvatarProps = {
  photoUri: string | null;
  name: string;
  size?: number;
  onPress?: () => void;
};

export function ProfileAvatar({ photoUri, name, size = 48, onPress }: ProfileAvatarProps) {
  const colors = useThemeColors();
  const [imgError, setImgError] = useState(false);

  const showPhoto = !!photoUri && !imgError;

  const content = showPhoto ? (
    <Image
      source={{ uri: photoUri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="cover"
      onError={() => setImgError(true)}
    />
  ) : (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.tealDark,
        },
      ]}>
      <User size={size * 0.5} color="#FFFFFF" strokeWidth={1.8} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && { opacity: 0.75 }]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
