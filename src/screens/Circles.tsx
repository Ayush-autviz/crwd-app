import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGreen, SecondaryGreen, PrimaryGrey } from '../Constants/Colors'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { Plus, Search, Users } from 'lucide-react-native'
import { useQuery } from '@tanstack/react-query'
import { getCollectives, getJoinCollective } from '../services/api/crwd'
import { useAuthStore } from '../store/store'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar'

type TabKey = 'my-crwds' | 'discover'

type DiscoverCircle = {
  id: number
  name: string
  description: string
  image: any
  type: string
  members: number
}

const Circles = () => {
  const navigation = useNavigation<any>()
  const [activeTab, setActiveTab] = useState<TabKey>('my-crwds')
  const { user: currentUser } = useAuthStore();

  // Avatar colors for consistent coloring
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

  const getConsistentColor = (id: number | string, colors: string[]) => {
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Fetch collectives data using React Query
  const { data: collectiveData, isLoading: isLoadingCollectives } = useQuery({
    queryKey: ['circles'],
    queryFn: () => getCollectives(),
    enabled: true,
  });

  // Fetch joined collectives for current user
  const { data: joinCollectiveData, isLoading: isLoadingJoinCollective } = useQuery({
    queryKey: ['join-collective', currentUser?.id],
    queryFn: () => getJoinCollective(currentUser?.id || ''),
    enabled: !!currentUser?.id,
  });

  // Auto-switch to discover tab if no joined collectives
  useEffect(() => {
    if (!joinCollectiveData?.data || joinCollectiveData.data.length === 0) {
      setActiveTab('discover');
    }
  }, [joinCollectiveData]);

  const renderJoinedCollectiveItem = ({ item }: { item: any }) => {
    const circle = item.collective || item;
    // Priority: 1. Use color (with white text), 2. Use logo (image), 3. Fallback to generated color with letter
    const hasColor = circle.color;
    const hasLogo = circle.logo &&
      (circle.logo.startsWith('http') || circle.logo.startsWith('/') || circle.logo.startsWith('data:'));
    // Generate consistent color based on collective name if no color/logo
    const colors = [
      '#f97316', // orange
      '#ec4899', // pink
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ef4444', // red
    ];
    const colorIndex = (circle.name?.charCodeAt(0) || 0) % colors.length;
    const circleBgColor = hasColor || (!hasLogo ? colors[colorIndex] : undefined);
    const showImage = hasLogo && !hasColor;
    const iconLetter = circle.name?.charAt(0)?.toUpperCase() || 'C';
    const founderName = circle.created_by
      ? `${circle.created_by.first_name || ''} ${circle.created_by.last_name || ''}`.trim() || circle.created_by.username
      : 'Unknown';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('GroupCRWD', { collectiveId: circle.id?.toString() })}
        activeOpacity={0.9}
        style={styles.card}
      >
        {/* Collective Icon */}
        <View
          style={[styles.collectiveIcon, circleBgColor ? { backgroundColor: circleBgColor } : {}]}
        >
          {showImage ? (
            <Image
              source={{ uri: circle.logo }}
              style={styles.collectiveIconImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.collectiveIconText}>
              {iconLetter}
            </Text>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {circle.name}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {circle.description}
        </Text>

        {/* Founder Info */}
        {circle.created_by && (
          <View style={styles.founderInfo}>
            <Avatar size={20}>
              <AvatarImage src={circle.created_by.profile_picture} />
              <AvatarFallback
                style={{ backgroundColor: circle.created_by.color || getConsistentColor(circle.created_by.id || founderName, avatarColors) }}
                textStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}
              >
                {founderName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Text style={styles.founderText}>
              Founded by {founderName}
            </Text>
          </View>
        )}

        {/* Supporting nonprofits count */}
        <Text style={styles.nonprofitCount}>
          Supporting {circle.causes_count} nonprofit{circle.causes_count > 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDiscoverItem = ({ item }: { item: any }) => {
    // Priority: 1. Use color (with white text), 2. Use logo (image), 3. Fallback to generated color with letter
    const hasColor = item.color;
    const hasLogo = item.logo &&
      (item.logo.startsWith('http') || item.logo.startsWith('/') || item.logo.startsWith('data:'));
    // Generate consistent color based on collective name if no color/logo
    const colors = [
      '#f97316', // orange
      '#ec4899', // pink
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ef4444', // red
    ];
    const colorIndex = (item.name?.charCodeAt(0) || 0) % colors.length;
    const circleBgColor = hasColor || (!hasLogo ? colors[colorIndex] : undefined);
    const showImage = hasLogo && !hasColor;
    const iconLetter = item.name?.charAt(0)?.toUpperCase() || 'C';
    const founderName = item.created_by
      ? `${item.created_by.first_name || ''} ${item.created_by.last_name || ''}`.trim() || item.created_by.username
      : 'Unknown';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('GroupCRWD', { collectiveId: item.id?.toString() })}
        activeOpacity={0.9}
        style={styles.card}
      >
        {/* Collective Icon */}
        <View
          style={[styles.collectiveIcon, circleBgColor ? { backgroundColor: circleBgColor } : {}]}
        >
          {showImage ? (
            <Image
              source={{ uri: item.logo }}
              style={styles.collectiveIconImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.collectiveIconText}>
              {iconLetter}
            </Text>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Founder Info */}
        {item.created_by && (
          <View style={styles.founderInfo}>
            <Avatar size={20}>
              <AvatarImage src={item.created_by.profile_picture} />
              <AvatarFallback
                style={{ backgroundColor: item.created_by.color || getConsistentColor(item.created_by.id || founderName, avatarColors) }}
                textStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}
              >
                {founderName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Text style={styles.founderText}>
              Founded by {founderName}
            </Text>
          </View>
        )}

        {/* Supporting nonprofits count */}
        <Text style={styles.nonprofitCount}>
          Supporting {item.causes_count} nonprofit{item.causes_count > 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <MainHeaderNav title={'Collectives'} menu={false} postButton={false} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Collectives</Text>
        <Text style={styles.headerSubtitle}>
          Join Communities of people supporting cause together or start your own.
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('DrawerNav', { screen: 'CreateCRWD' })}
          activeOpacity={0.8}
        >
          <Plus color='#ffffff' size={18} />
          <Text style={styles.createButtonText}>Start a Collective</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'my-crwds' && styles.tabButtonActive]}
          onPress={() => setActiveTab('my-crwds')}
          activeOpacity={0.7}
        >
          <Users size={16} color={activeTab === 'my-crwds' ? '#000' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'my-crwds' && styles.tabTextActive]}>
            My Collectives ({joinCollectiveData?.data?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'discover' && styles.tabButtonActive]}
          onPress={() => setActiveTab('discover')}
          activeOpacity={0.7}
        >
          <Search color={activeTab === 'discover' ? '#000' : '#6B7280'} size={16} />
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>Discover</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'my-crwds' ? (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {/* Loading State */}
            {isLoadingJoinCollective ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PrimaryGreen} />
                <Text style={styles.loadingText}>Loading collectives...</Text>
              </View>
            ) : (
              <>
                {joinCollectiveData?.data?.length > 0 ? (
                  <View style={styles.listContainer}>
                    {joinCollectiveData.data.map((item: any, index: number) => (
                      <View key={String(item.id)}>
                        {renderJoinedCollectiveItem({ item })}
                        {index < joinCollectiveData.data.length - 1 && <View style={styles.separator} />}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyStateIcon}>
                      <Users size={48} color={PrimaryGrey} />
                    </View>
                    <Text style={styles.emptyStateTitle}>you haven't joined any collectives yet</Text>
                    <Text style={styles.emptyStateText}>Check out the discover tab to join a collective</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        /* Discover Tab Content */
        <View style={styles.contentContainer}>
          {isLoadingCollectives ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PrimaryGreen} />
              <Text style={styles.loadingText}>Loading collectives...</Text>
            </View>
          ) : (
            <FlatList
              data={collectiveData?.results || []}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderDiscoverItem}
              contentContainerStyle={styles.listContent}
              // ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Outfit-Regular',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#00c854',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    padding: 6,
    gap: 2,
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
  tabTextActive: {
    color: '#111827',
  },
  listContent: {
    // paddingHorizontal: 16,
    // paddingTop: 4,
    paddingBottom: 32,
    gap: 10,
  },
  separator: {
    height: 10,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  collectiveIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  collectiveIconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  collectiveIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'Outfit-Bold',
  },
  cardDescription: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 6,
    lineHeight: 20,
    fontFamily: 'Outfit-Regular',
  },
  founderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  founderText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  nonprofitCount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  placeholderWrapper: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
  },
  placeholderDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: PrimaryGrey,
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateIcon: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 999,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Outfit-SemiBold',
  },
  emptyStateText: {
    color: PrimaryGrey,
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 48,
  },
  listContainer: {
    // No specific height limit, let it grow naturally
  },
})

export default Circles