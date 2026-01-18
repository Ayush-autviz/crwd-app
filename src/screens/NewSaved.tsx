import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Loader2 } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { getFavoriteCauses, getFavoriteCollectives } from '../services/api/social';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { PrimaryBlue } from '../Constants/Colors';

type TabType = 'Nonprofits' | 'Collectives';

// Get consistent color for avatar
const avatarColors = [
  '#10B981', // Green
  '#3B82F6', // Blue
  '#F97316', // Orange
  '#EC4899', // Pink/Red
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#A855F7', // Violet
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getInitials = (name: string) => {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function NewSavedScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('Nonprofits');

  // Fetch favorite causes - always enabled so it refetches when invalidated
  const { data: favoriteCausesData, isLoading: isLoadingCauses } = useQuery({
    queryKey: ['favoriteCauses'],
    queryFn: getFavoriteCauses,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch favorite collectives - always enabled so it refetches when invalidated
  const { data: favoriteCollectivesData, isLoading: isLoadingCollectives } = useQuery({
    queryKey: ['favoriteCollectives'],
    queryFn: getFavoriteCollectives,
    refetchOnMount: true,
    staleTime: 0,
  });

  const favoriteCauses = favoriteCausesData?.results || [];
  const favoriteCollectives = favoriteCollectivesData?.results || [];

  const isLoading = activeTab === 'Nonprofits' ? isLoadingCauses : isLoadingCollectives;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('Nonprofits')}
            style={[styles.tab, activeTab === 'Nonprofits' && styles.activeTab]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Nonprofits' && styles.tabTextActive,
              ]}
            >
              Nonprofits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('Collectives')}
            style={[styles.tab, activeTab === 'Collectives' && styles.activeTab]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Collectives' && styles.tabTextActive,
              ]}
            >
              Collectives
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9CA3AF" />
          </View>
        ) : activeTab === 'Nonprofits' ? (
          favoriteCauses.length > 0 ? (
            <View style={styles.listContainer}>
              {favoriteCauses.map((item: any) => {
                const cause = item.cause || item;
                const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                const initials = getInitials(cause.name || 'N');

                return (
                  <TouchableOpacity
                    key={cause.id}
                    onPress={() => (navigation as any).navigate('CauseScreen', { causeId: cause.id })}
                    style={styles.card}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardContent}>
                      <Avatar size={48} style={[styles.avatar, { borderRadius: 8 }]}>
                        <AvatarImage src={cause.image} alt={cause.name} />
                        <AvatarFallback
                          style={{ backgroundColor: avatarBgColor }}
                          textStyle={styles.avatarText}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {cause.name}
                        </Text>
                        <Text style={styles.cardDescription} numberOfLines={2}>
                          {cause.mission || cause.description || 'No description available'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No favorite nonprofits yet</Text>
            </View>
          )
        ) : favoriteCollectives.length > 0 ? (
          <View style={styles.listContainer}>
            {favoriteCollectives.map((item: any, index: number) => {
              const collective = item.collective || item;

              // Generate color for icon if not provided
              const getIconColor = (index: number): string => {
                const colors = [
                  "#1600ff", // Blue
                  "#10B981", // Green
                  "#EC4899", // Pink
                  "#F59E0B", // Amber
                  "#8B5CF6", // Purple
                  "#EF4444", // Red
                ];
                return colors[index % colors.length];
              };

              // Get first letter of name for icon
              const getIconLetter = (name: string): string => {
                return name.charAt(0).toUpperCase();
              };

              // Priority: 1. If color is available, show color with letter, 2. If no color, show image, 3. Fallback to generated color with letter
              const hasColor = collective.color;
              const hasLogo = collective.logo && (collective.logo.startsWith("http") || collective.logo.startsWith("/") || collective.logo.startsWith("data:"));
              const iconColor = hasColor ? collective.color : (!hasLogo ? getIconColor(index) : undefined);
              const iconLetter = getIconLetter(collective.name || 'C');
              const showImage = !hasColor && hasLogo;

              const founder = collective.created_by;
              const memberCount = collective.member_count || 0;

              return (
                <TouchableOpacity
                  key={collective.id}
                  onPress={() => (navigation as any).navigate('GroupCRWD', { crwdId: collective.id })}
                  style={styles.card}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <Avatar size={40} style={styles.collectiveAvatar}>
                      {showImage ? (
                        <AvatarImage src={collective.logo} alt={collective.name} />
                      ) : null}
                      <AvatarFallback
                        style={iconColor ? { backgroundColor: iconColor } : {}}
                        textStyle={styles.collectiveAvatarText}
                      >
                        {iconLetter}
                      </AvatarFallback>
                    </Avatar>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {collective.name}
                      </Text>
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {collective.description || 'No description available'}
                      </Text>
                      {founder && (
                        <View style={styles.founderContainer}>
                          <Avatar size={24} style={styles.founderAvatar}>
                            <AvatarImage src={founder.profile_picture} alt={founder.username} />
                            <AvatarFallback
                              style={{
                                backgroundColor: getConsistentColor(founder.id, avatarColors),
                              }}
                              textStyle={styles.founderAvatarText}
                            >
                              {founder.first_name?.charAt(0) || founder.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <Text style={styles.founderText}>
                            Founded by {founder.first_name} {founder.last_name}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.memberCount}>
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No favorite collectives yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 36,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f3f4f6',
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
    gap: 6,
  },
  avatar: {
    borderRadius: 8,
  },
  collectiveAvatar: {
    borderRadius: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  collectiveAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  founderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  founderAvatar: {
    borderRadius: 12,
  },
  founderAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  founderText: {
    fontSize: 13,
    color: '#6B7280',
  },
  memberCount: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

