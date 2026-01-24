import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { getCollectives } from '../../services/api/crwd';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

const { width: screenWidth } = Dimensions.get('window');

interface Collective {
  id: string | number;
  name: string;
  color?: string;
  logo?: string;
  iconColor?: string;
  founder: {
    name: string;
    profile_picture?: string;
    color?: string;
  };
  nonprofit_count: number;
  description: string;
}

export default function PopularCollectives() {
  const navigation = useNavigation();

  // Fetch collectives data using React Query
  const { data: collectivesData, isLoading } = useQuery({
    queryKey: ['popular-collectives'],
    queryFn: getCollectives,
    enabled: true,
  });

  // Generate color for icon if not provided
  const getIconColor = (name: string): string => {
    const colors = [
      '#1600ff', // Blue
      '#10B981', // Green
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#EF4444', // Red
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Transform API data to match component's expected format
  const transformedCollectives: Collective[] =
    collectivesData?.results?.slice(0, 4).map((collective: any, index: number) => {
      const founderName = collective.created_by
        ? `${collective.created_by.first_name || ''} ${collective.created_by.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown';

      return {
        id: collective.id,
        name: collective.name || 'Unknown Collective',
        color: collective.color, // Use color from API if available
        logo: collective.logo, // Use logo from API if available
        iconColor: collective.color || getIconColor(collective.name || 'C'), // Fallback to generated color
        founder: {
          name: founderName,
          profile_picture: collective.created_by?.profile_picture || '',
        },
        nonprofit_count:
          collective.causes_count ||
          collective.supported_causes_count ||
          collective.cause_count ||
          0,
        description: collective.description || 'No description available',
      };
    }) || [];

  const displayCollectives = transformedCollectives;

  // Get first letter of name for icon
  const getIconLetter = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Popular Collectives</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1600ff" />
          </View>
        </View>
      </View>
    );
  }

  if (!displayCollectives || displayCollectives.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Give With Others - Join or Start a Collective</Text>
        <Text style={styles.subtitle}>Groups giving together to shared causes. Join free or start your own.</Text>

        {/* Grid Layout */}
        <View style={styles.grid}>
          {displayCollectives.slice(0, 4).map((collective) => {
            // Priority: 1. If color is available, show color with letter, 2. If no color, show image, 3. Fallback to generated color with letter
            const hasColor = collective.color;
            const hasLogo = collective.logo && (
              collective.logo.startsWith('http') ||
              collective.logo.startsWith('/') ||
              collective.logo.startsWith('data:')
            );
            const iconColor = hasColor ? collective.color : (!hasLogo ? collective.iconColor : undefined);
            const iconLetter = getIconLetter(collective.name);
            const showImage = !hasColor && hasLogo;

            return (
              <View key={collective.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    {/* Icon */}
                    <View
                      style={[
                        styles.icon,
                        iconColor ? { backgroundColor: iconColor } : {},
                      ]}
                    >
                      {showImage ? (
                        <Image
                          source={{ uri: collective.logo }}
                          style={styles.iconImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.iconLetter}>{iconLetter}</Text>
                      )}
                    </View>

                    {/* Title */}
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {collective.name}
                    </Text>
                  </View>

                  {/* Founder */}
                  <View style={styles.founderRow}>
                    <Avatar size={24}>
                      <AvatarImage src={collective.founder.profile_picture} />
                      <AvatarFallback
                        textStyle={{ fontSize: 10, color: 'white' }}
                        style={{ backgroundColor: collective.founder.color || '#6b7280' }}
                      >
                        {collective.founder.name
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Text style={styles.founderText}>
                      Founded by {collective.founder.name}
                    </Text>
                  </View>

                  {/* Nonprofits count */}
                  <Text style={styles.nonprofitCount}>
                    Supporting {collective.nonprofit_count} nonprofit{collective.nonprofit_count !== 1 ? 's' : ''}
                  </Text>

                  {/* Description */}
                  <Text style={styles.description} numberOfLines={3}>
                    {collective.description}
                  </Text>

                  {/* View Collective Button */}
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => (navigation as any).navigate('GroupCRWD', { id: collective.id })}
                  >
                    <Text style={styles.viewButtonText}>View Collective</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.startOwnButton}
            onPress={() => (navigation as any).navigate('CreateCRWD' as never)}
          >
            <Text style={styles.startOwnButtonText}>Start Your Own Collective</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.seeAllButton}
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
                              routes: [{ name: 'Collectives' as never }],
                              index: 0,
                            },
                          },
                        ],
                        index: 0,
                      },
                    },
                  ],
                })
              );
            }}
          >
            <Text style={styles.seeAllButtonText}>See All Collectives</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb', // gray-50 equivalent
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: screenWidth > 768 ? (screenWidth - 64) / 3 : screenWidth - 32,
    maxWidth: 400,
  },
  cardContent: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  iconLetter: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  cardTitle: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111827',
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  founderText: {
    fontSize: 12,
    color: '#6b7280',
  },
  nonprofitCount: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  viewButton: {
    borderWidth: 1,
    borderColor: '#a854f7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#a854f7',
    fontWeight: '500',
    fontSize: 14,
  },
  buttonsContainer: {
    alignItems: 'center',
    gap: 12,
  },
  startOwnButton: {
    backgroundColor: '#1600ff',
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  startOwnButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  seeAllButton: {
    borderWidth: 1,
    borderColor: '#a854f7',
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  seeAllButtonText: {
    color: '#a854f7',
    fontWeight: '500',
    fontSize: 16,
  },
});

