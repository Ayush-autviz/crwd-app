import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface Nonprofit {
  id: number;
  name: string;
  mission?: string;
  image?: string;
  cause?: {
    id: number;
    name: string;
    mission?: string;
    image?: string;
  };
}

interface PreviouslySupportedProps {
  nonprofits: Nonprofit[];
  isLoading?: boolean;
}

export default function PreviouslySupported({
  nonprofits,
  isLoading = false,
}: PreviouslySupportedProps) {
  const navigation = useNavigation();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Previously Supported</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9CA3AF" />
        </View>
      </View>
    );
  }

  if (!nonprofits || nonprofits.length === 0) {
    return null;
  }

  // Generate vibrant avatar colors based on nonprofit ID for consistent colors
  const avatarColors = [
    '#EF4444', // Red
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#84CC16', // Lime Green
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#A855F7', // Violet
    '#14B8A6', // Teal
    '#F43F5E', // Rose
    '#6366F1', // Indigo
    '#22C55E', // Emerald
    '#EAB308', // Yellow
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Previously Supported</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {nonprofits.map((nonprofit, index) => {
          const cause = nonprofit.cause || nonprofit;
          const name = cause.name || nonprofit.name || 'Unknown Nonprofit';
          const image = cause.image || nonprofit.image || '';

          const nonprofitId = cause.id || nonprofit.id || name;
          const avatarColorIndex = nonprofitId
            ? Number(nonprofitId) % avatarColors.length
            : (name?.charCodeAt(0) || 0) % avatarColors.length;
          const avatarBgColor = avatarColors[avatarColorIndex];

          const causeId = cause.id || nonprofit.id;

          return (
            <TouchableOpacity
              key={nonprofit.id}
              onPress={() => causeId && navigation.navigate('CauseScreen' as never, { id: causeId } as never)}
              style={[styles.card, styles.inactiveCard]}
              activeOpacity={0.7}
            >
              {image ? (
                <Avatar size={48} style={styles.avatar}>
                  <AvatarImage src={image} />
                  <AvatarFallback
                    style={{ backgroundColor: avatarBgColor }}
                    textStyle={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <View
                  style={[styles.avatarFallback, { backgroundColor: avatarBgColor }]}
                >
                  <Text style={styles.avatarLetter}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.name} numberOfLines={2}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingRight: 12,
  },
  card: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  inactiveCard: {
    opacity: 0.75,
  },
  avatar: {
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
});

