import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { truncateAtFirstPeriod } from '../../utils/truncateFirstPeriod';

interface Collective {
  id: string | number;
  name: string;
  icon?: string; // Optional logo URL, if not provided will use first letter
  iconColor?: string; // Optional color for the icon background (from API color field)
  founder: {
    name: string;
    profile_picture?: string;
    color?: string;
  };
  nonprofit_count: number;
  description: string;
}

interface NewSuggestedCollectivesProps {
  collectives?: Collective[];
  seeAllLink?: string;
}

// Generate color for icon if not provided
const getIconColor = (index: number): string => {
  const colors = [
    '#1600ff', // Blue
    '#10B981', // Green
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EF4444', // Red
  ];
  return colors[index % colors.length];
};

// Get first letter of name for icon
const getIconLetter = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

export default function NewSuggestedCollectives({
  collectives = [],
  seeAllLink = '/search',
}: NewSuggestedCollectivesProps) {
  const navigation = useNavigation();

  if (!collectives || collectives.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Give Together</Text>
        <TouchableOpacity
          onPress={() => {
            // Navigate to bottom tabs "Collectives" tab
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: 'DrawerNav' as never,
                    state: {
                      routes: [
                        {
                          name: 'MainTabs' as never,
                          state: {
                            routes: [{ name: 'Collectives' as never }] as never[],
                            index: 0,
                          },
                        },
                      ] as never[],
                      index: 0,
                    },
                  },
                ] as never[],
              })
            );
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {collectives.map((collective, index) => {
          // Priority: 1. If color is available, show color with letter, 2. If no color, show image, 3. Fallback to generated color with letter
          const hasColor = collective.iconColor;
          const hasLogo =
            collective.icon &&
            (collective.icon.startsWith('http') ||
              collective.icon.startsWith('/') ||
              collective.icon.startsWith('data:'));
          const iconColor = hasColor ? collective.iconColor : (!hasLogo ? getIconColor(index) : undefined);
          const iconLetter = getIconLetter(collective.name);
          const showImage = hasLogo;

          // Generate vibrant color for founder avatar
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
          const founderId = collective.founder.name || collective.id;
          const founderColorIndex = founderId ? (String(founderId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length) : 0;
          const founderAvatarBgColor = collective.founder.color || avatarColors[founderColorIndex];

          return (
            <TouchableOpacity
              key={collective.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                (navigation as any).navigate('GroupCRWD', { id: collective.id })
              }
            >
              {/* Icon and Title Row */}
              <View style={styles.iconTitleRow}>
                <View
                  style={[
                    styles.iconContainer,
                    !showImage && iconColor ? { backgroundColor: iconColor } : {},
                  ]}
                >
                  {showImage ? (
                    <Image
                      source={{ uri: collective.icon }}
                      style={styles.iconImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.iconLetter}>{iconLetter}</Text>
                  )}
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {collective.name}
                </Text>
              </View>

              {/* Founder */}
              <View style={styles.founderRow}>
                <Avatar size={20}>
                  <AvatarImage src={collective.founder.profile_picture} />
                  <AvatarFallback
                    style={{ backgroundColor: founderAvatarBgColor }}
                    textStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}
                  >
                    {collective.founder.name
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Text style={styles.founderText}>
                  Founded by <Text style={styles.founderName}>{collective.founder.name}</Text>
                </Text>
              </View>

              {/* Nonprofits count */}
              <Text style={styles.nonprofitCount}>
                Supporting {collective.nonprofit_count} nonprofit
                {collective.nonprofit_count !== 1 ? 's' : ''}
              </Text>

              {/* Description */}
              <Text style={styles.description}>
                {truncateAtFirstPeriod(collective.description)}
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
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  seeAll: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1600ff',
    fontFamily: 'Outfit-Medium',
  },
  scrollContent: {
    paddingRight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    minWidth: 240,
    maxWidth: 280,
    // height: 200,
    marginRight: 12,
    flexDirection: 'column',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    objectFit: 'cover'
  },
  iconLetter: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    flexShrink: 0,
    flex: 1,
    fontFamily: 'Outfit-Bold',
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    flexShrink: 0,
  },
  founderText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
    flex: 1,
    flexShrink: 1,
  },
  founderName: {
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Outfit-SemiBold',
  },
  nonprofitCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    flexShrink: 0,
    fontFamily: 'Outfit-Regular',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
    flex: 1,
    fontFamily: 'Outfit-Regular',
  },
});

