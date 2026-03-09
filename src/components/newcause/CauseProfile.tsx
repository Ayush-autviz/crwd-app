import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import CategoryBadges from './CategoryBadges';
import { categories } from '../../Constants/categories';
import { truncateAtFirstPeriod } from '../../utils/truncateFirstPeriod';


interface CauseProfileProps {
  causeData: any;
}

// Get category info - handles combined category IDs like "MK"
const getCategoryInfo = (categoryId: string) => {
  // If categoryId is a combination like "MK", split it and return multiple categories
  if (categoryId && categoryId.length > 1) {
    const categoryIds = categoryId.split('');
    const foundCategories = categoryIds
      .map((id) => categories.find((cat) => cat.id === id))
      .filter((cat): cat is typeof categories[0] => cat !== undefined);

    // If we found multiple categories, return them as an array
    if (foundCategories.length > 0) {
      return foundCategories;
    }
  }

  // Single category or default - return as array for consistency
  const category = categories.find((cat) => cat.id === categoryId) || categories[0];
  return [category];
};

export default function CauseProfile({ causeData }: CauseProfileProps) {
  const navigation = useNavigation();
  const categoryInfo = getCategoryInfo(causeData?.category || '');

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
            textStyle={{ color: '#FFFFFF', fontSize: 24, fontFamily: 'Outfit-Bold' }}
          >
            {firstLetter}
          </AvatarFallback>
        </Avatar>

        <View style={styles.info}>
          <Text style={styles.name}>{causeData?.name}</Text>
          {(causeData?.collective_count > 0 || causeData?.donation_count > 0) && (
            <Text style={styles.stats}> in{' '}
              {causeData?.collective_count > 0 && (
                <>{causeData.collective_count} Collective{causeData.collective_count !== 1 ? 's' : ''}</>
              )}
              {causeData?.collective_count > 0 &&
                causeData?.donation_count > 0 && (
                  <> • </>
                )}
              {causeData?.donation_count > 0 && (
                <>{causeData.donation_count} donation{causeData.donation_count !== 1 ? 's' : ''}</>
              )}
            </Text>
          )}
        </View>
      </View>

      {/* Mission Statement */}
      <View style={styles.missionSection}>
        <Text style={styles.mission}>
          {truncateAtFirstPeriod(causeData?.mission || causeData?.description)}
        </Text>

        {/* Category Tags */}
        <CategoryBadges
          categories={causeData.categories}
          onCategoryClick={(cat) => {
            (navigation as any).navigate('SearchResults', {
              categoryId: cat.id,
              categoryName: cat.name,
              searchQuery: cat.name,
              tab: 'Causes'
            });
          }}
          containerStyle={styles.categoriesContainer}
        />
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
    alignItems: 'center',
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
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stats: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  missionSection: {
    gap: 8,
  },
  mission: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
    fontFamily: 'Outfit-Regular',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#FFFFFF',
  },
});

