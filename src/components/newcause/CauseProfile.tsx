import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { categories } from '../../Constants/categories';

interface CauseProfileProps {
  causeData: any;
}

export default function CauseProfile({ causeData }: CauseProfileProps) {
  const category = categories.find((cat) => cat.id === causeData?.category);

  // Get first letter for avatar fallback
  const firstLetter = causeData?.name?.charAt(0).toUpperCase() || 'C';

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
  const avatarBgColor = getConsistentColor(causeData?.id || 'default', avatarColors);

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Avatar size={64} style={styles.avatar}>
          <AvatarImage src={causeData?.image} />
          <AvatarFallback
            style={{ backgroundColor: avatarBgColor }}
            textStyle={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}
          >
            {firstLetter}
          </AvatarFallback>
        </Avatar>

        <View style={styles.info}>
          <Text style={styles.name}>{causeData?.name}</Text>
          <Text style={styles.stats}>
            in {causeData?.collective_count || 0} Collectives •{' '}
            {causeData?.donation_count || 0} donations
          </Text>
        </View>
      </View>

      {/* Mission Statement */}
      <View style={styles.missionSection}>
        <Text style={styles.mission}>
          {causeData?.mission || causeData?.description}
        </Text>

        {/* Category Tag */}
        {category && (
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: category.background },
            ]}
          >
            <Text style={styles.categoryText}>{category.name}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    borderRadius: 12,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stats: {
    fontSize: 12,
    color: '#6B7280',
  },
  missionSection: {
    gap: 8,
  },
  mission: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

