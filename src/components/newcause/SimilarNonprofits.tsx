import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface SimilarNonprofitsProps {
  similarCauses: any[];
  isLoading?: boolean;
}

export default function SimilarNonprofits({ similarCauses, isLoading }: SimilarNonprofitsProps) {
  const navigation = useNavigation();

  // Get consistent color for avatar
  const avatarColors = [
    '#3B82F6',
    '#EC4899',
    '#8B5CF6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#06B6D4',
    '#F97316',
    '#84CC16',
    '#A855F7',
    '#14B8A6',
    '#F43F5E',
    '#6366F1',
    '#22C55E',
    '#EAB308',
  ];
  const getConsistentColor = (id: number | string, colors: string[]) => {
    const hash =
      typeof id === 'number'
        ? id
        : id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Similar Nonprofits</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9CA3AF" />
        </View>
      </View>
    );
  }

  if (!similarCauses || similarCauses.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Similar Nonprofits</Text>
      <View style={styles.causesList}>
        {similarCauses.map((cause) => {
          const avatarBgColor = getConsistentColor(cause.id || cause.name, avatarColors);
          const firstLetter = cause.name?.charAt(0).toUpperCase() || 'C';

          return (
            <TouchableOpacity
              key={cause.id}
              onPress={() =>
                navigation.navigate('CauseScreen' as never, { id: cause.id } as never)
              }
              style={styles.causeCard}
              activeOpacity={0.7}
            >
              <Avatar size={56} style={styles.avatar}>
                <AvatarImage src={cause.image} />
                <AvatarFallback
                  style={{ backgroundColor: avatarBgColor }}
                  textStyle={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}
                >
                  {firstLetter}
                </AvatarFallback>
              </Avatar>
              <View style={styles.causeInfo}>
                <Text style={styles.causeName}>{cause.name}</Text>
                <Text style={styles.causeDescription} numberOfLines={2}>
                  {cause.mission || cause.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  causesList: {
    gap: 12,
  },
  causeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  avatar: {
    borderRadius: 12,
    flexShrink: 0,
  },
  causeInfo: {
    flex: 1,
    minWidth: 0,
  },
  causeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  causeDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});

