import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { getSuggestedCrwds } from '../../services/api/crwd';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Loader2 } from 'lucide-react-native';

interface DiscoverMoreCollectivesProps {
  collectiveId?: string;
}

export default function DiscoverMoreCollectives({ collectiveId }: DiscoverMoreCollectivesProps) {
  const navigation = useNavigation();

  // Fetch suggested collectives
  const { data: suggestedData, isLoading, error } = useQuery({
    queryKey: ['suggestedCrwds', collectiveId],
    queryFn: () => getSuggestedCrwds(collectiveId || ''),
    enabled: !!collectiveId,
  });

  // Transform API data
  const suggestedCollectives = Array.isArray(suggestedData)
    ? suggestedData.slice(0, 3) // Show only first 3
    : (suggestedData?.results || suggestedData?.data || []).slice(0, 3);

  // Generate color for icon if not provided
  const getIconColor = (index: number, collective: any): string => {
    // Priority: 1. Use API color, 2. Use generated color
    if (collective.color && collective.color.trim() !== '') {
      return collective.color;
    }
    const colors = [
      "#10B981", // Green (teal)
      "#EC4899", // Pink
      "#8B5CF6", // Purple
      "#3B82F6", // Blue
      "#F59E0B", // Amber
      "#EF4444", // Red
    ];
    return colors[index % colors.length];
  };

  // Get first letter of name for icon
  const getIconLetter = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Discover More Giving Groups</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6b7280" />
          <Text style={styles.loadingText}>Loading Giving Groups...</Text>
        </View>
      </View>
    );
  }

  if (error || !suggestedCollectives || suggestedCollectives.length === 0) {
    return null; // Don't show the section if there's an error or no data
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover More Giving Groups</Text>

      <View style={styles.collectivesList}>
        {suggestedCollectives.map((collective: any, index: number) => {
          const hasLogo = collective.logo && (
            collective.logo.startsWith('http') ||
            collective.logo.startsWith('/') ||
            collective.logo.startsWith('data:')
          );
          const iconColor = getIconColor(index, collective);
          const iconLetter = getIconLetter(collective.name || 'C');
          const founder = collective.created_by || collective.founder || {};
          const founderName = founder.first_name && founder.last_name
            ? `${founder.first_name} ${founder.last_name}`
            : founder.username || founder.name || 'Unknown';
          const nonprofitCount = collective.nonprofit_count || collective.causes_count || 0;

          return (
            <TouchableOpacity
              key={collective.id || index}
              onPress={() => {
                (navigation as any).navigate('GroupCRWD', { id: collective.id.toString(), collectiveId: collective.id.toString() });
              }}
              style={styles.collectiveCard}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: hasLogo ? undefined : iconColor }
                ]}
              >
                {hasLogo ? (
                  <Avatar size={48} style={{ borderRadius: 12 }}>
                    <AvatarImage src={collective.logo} />
                    <AvatarFallback
                      style={{ backgroundColor: iconColor }}
                      textStyle={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}
                    >
                      {iconLetter}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Text style={styles.iconLetter}>{iconLetter}</Text>
                )}
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                {/* Name */}
                <Text style={styles.name}>
                  {collective.name || 'Unknown Collective'}
                </Text>

                {/* Description */}
                {collective.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {collective.description}
                  </Text>
                )}

                {/* Founder */}
                <View style={styles.founderRow}>
                  <Avatar size={24}>
                    <AvatarImage src={founder.profile_picture || founder.avatar} />
                    <AvatarFallback
                      style={{
                        backgroundColor: founder.color || '#6B7280',
                      }}
                      textStyle={{ color: 'white', fontSize: 10, fontWeight: '600' }}
                    >
                      {founderName
                        .split(' ')
                        .map((n: string) => n.charAt(0))
                        .join('')
                        .toUpperCase()
                        .slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <Text style={styles.founderText}>
                    Founded by <Text style={styles.founderName}>{founderName}</Text>
                  </Text>
                </View>

                {/* Nonprofits count */}
                <Text style={styles.nonprofitCount}>
                  Supporting {nonprofitCount} nonprofit{nonprofitCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Browse All Collectives Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => {
            (navigation as any).navigate('Circles');
          }}
          style={styles.browseButton}
          activeOpacity={0.7}
        >
          <Text style={styles.browseButtonText}>Browse All Giving Groups</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    marginTop: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  collectivesList: {
    gap: 16,
  },
  collectiveCard: {
    flexDirection: 'column',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconLetter: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    fontSize: 15,
    color: '#000000',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 22,
    fontFamily: 'Outfit-Regular',
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  founderText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  founderName: {
    fontFamily: 'Outfit-SemiBold',
  },
  nonprofitCount: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  browseButton: {
    borderWidth: 2,
    borderColor: '#1600ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#1600ff',
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
  },
});

