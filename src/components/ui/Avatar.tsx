import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface AvatarProps {
  size?: number;
  style?: ViewStyle;
  className?: string;
  children: React.ReactNode;
}

interface AvatarImageProps {
  src?: string;
  alt?: string;
  style?: ViewStyle;
  onError?: () => void;
}

interface AvatarFallbackProps {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Avatar({ size = 40, style, children, ...props }: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export function AvatarImage({ src, alt, style, onError, ...props }: AvatarImageProps) {
  const [imageError, setImageError] = useState(false);

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  if (!src || imageError) {
    return null;
  }

  return (
    <Image
      source={{ uri: src }}
      style={[styles.avatarImage, style]}
      onError={handleError}
      {...props}
    />
  );
}

export function AvatarFallback({ children, style, textStyle, ...props }: AvatarFallbackProps) {
  return (
    <View style={[styles.avatarFallback, style]} {...props}>
      <Text style={[styles.avatarFallbackText, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    position: 'relative',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
  },
  avatarFallback: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6', // bg-muted equivalent
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280', // text-muted-foreground equivalent
    textAlign: 'center',
  },
});
