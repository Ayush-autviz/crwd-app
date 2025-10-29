import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryBlue, PrimaryGreen, SecondaryBlue, SecondaryGreen, PrimaryGrey } from '../Constants/Colors'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { Plus, Search, Users, Heart } from 'lucide-react-native'
import { useQuery } from '@tanstack/react-query'
import { getCollectives, getJoinCollective } from '../services/api/crwd'
import { getFavoriteCollectives } from '../services/api/social'
import { useAuthStore } from '../store/store'

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
  // Fetch collectives data using React Query
  const { data: collectiveData, isLoading: isLoadingCollectives } = useQuery({
    queryKey: ['circles'],
    queryFn: () => getCollectives(),
    enabled: true,
  });

  // Fetch joined collectives
  const { data: joinCollectiveData, isLoading: isLoadingJoinCollective } = useQuery({
    queryKey: ['join-collective'],
    queryFn: () => getJoinCollective(currentUser?.id),
    enabled: true,
  });

  // Fetch favorite collectives
  const { data: favoriteCollectives, isLoading: isLoadingFavoriteCollectives } = useQuery({
    queryKey: ['favorite-collectives'],
    queryFn: () => getFavoriteCollectives(),
    enabled: true,
  });



  console.log(joinCollectiveData, 'joinCollectiveData');
  console.log(favoriteCollectives, 'favoriteCollectives');

  // Calculate total collectives count
  const totalCollectivesCount = (joinCollectiveData?.data?.length || 0) + (favoriteCollectives?.data?.length || 0);

  const renderJoinedCollectiveItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('GroupCRWD', { crwdId: item.collective?.id })}
      activeOpacity={0.9}
      style={styles.card}
    >
      <View style={styles.cardLeft}>
        <Image 
          source={item?.collective?.created_by?.profile_picture ? 
            { uri: item.collective.created_by.profile_picture } : 
            require('../assets/images/redcross.png')
          } 
          style={styles.avatar} 
        />
        <View style={styles.cardTextWrapper}>
          <View style={styles.badgeWrapper}>
            <View style={[styles.badge, { backgroundColor: SecondaryGreen }]}>
              <Text style={[styles.badgeText, { color: PrimaryGreen }]}>
                Collective
              </Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>
            {item?.collective?.name}
          </Text>
          <Text style={styles.cardDescription}>
            {item?.collective?.description}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('GroupCRWD', { crwdId: item.collective?.id })}
        style={[styles.actionButton, { backgroundColor: PrimaryGreen }]}
        activeOpacity={0.8}
      >
        <Text style={styles.actionButtonText}>Learn More</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFavoriteCollectiveItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('GroupCRWD', { crwdId: item.collective?.id })}
      activeOpacity={0.9}
      style={styles.card}
    >
      <View style={styles.cardLeft}>
        <Image 
          source={item?.collective?.created_by?.profile_picture ? 
            { uri: item.collective.created_by.profile_picture } : 
            require('../assets/images/redcross.png')
          } 
          style={styles.avatar} 
        />
        <View style={styles.cardTextWrapper}>
          <View style={styles.badgeWrapper}>
            <View style={[styles.badge, { backgroundColor: SecondaryGreen }]}>
              <Text style={[styles.badgeText, { color: PrimaryGreen }]}>
                Collective
              </Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>
            {item?.collective?.name}
          </Text>
          <Text style={styles.cardDescription}>
            {item?.collective?.description}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('GroupCRWD', { crwdId: item.collective?.id })}
        style={[styles.actionButton, { backgroundColor: PrimaryGreen }]}
        activeOpacity={0.8}
      >
        <Text style={styles.actionButtonText}>Learn More</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderDiscoverItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('GroupCRWD', { crwdId: item.id })}
        activeOpacity={0.9}
        style={styles.card}
      >
        <View style={styles.cardLeft}>
          <Image 
            source={item.created_by?.profile_picture ? 
              { uri: item.created_by.profile_picture } : 
              require('../assets/images/redcross.png')
            } 
            style={styles.avatar} 
          />
          <View style={styles.cardTextWrapper}>
            <View style={styles.badgeWrapper}>
              <View style={[styles.badge, { backgroundColor: SecondaryGreen }]}>
                <Text style={[styles.badgeText, { color: PrimaryGreen }]}>
                  Collective
                </Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>
              {item.name}
            </Text>
            <Text style={styles.cardDescription}>
              {item.description}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('GroupCRWD', { crwdId: item.id })}
          style={[styles.actionButton, { backgroundColor: PrimaryGreen }]}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Learn More</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
        <MainHeaderNav title={'CRWD Collectives'} show={true} menu={false} postButton={false} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Collectives</Text>
        <Text style={styles.headerSubtitle}>
          Join Communities of people supporting cause together or start your own.
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('DrawerNav', { screen: 'CreateCRWD'})}
          activeOpacity={0.8}
        >
            <Plus color='#ffffff' size={18}  />
          <Text style={styles.createButtonText}>Start a Collective</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'my-crwds' && styles.tabButtonActive]}
          onPress={() => setActiveTab('my-crwds')}
          activeOpacity={0.7}
        >
            <Users size={18} color={activeTab === 'my-crwds' ? '#000' : '#6B7280'}/>
          <Text style={[styles.tabText, activeTab === 'my-crwds' && styles.tabTextActive]}>
            My Collectives ({totalCollectivesCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'discover' && styles.tabButtonActive]}
          onPress={() => setActiveTab('discover')}
          activeOpacity={0.7}
        >
            <Search color={activeTab === 'discover' ? '#000' : '#6B7280'} size={18} />
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>Discover</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'my-crwds' ? (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {/* Loading State */}
            {(isLoadingJoinCollective || isLoadingFavoriteCollectives) ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PrimaryGreen} />
                <Text style={styles.loadingText}>Loading collectives...</Text>
              </View>
            ) : (
              <>
                {/* Joined Collectives Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Users size={20} color={PrimaryGreen} />
                    <Text style={styles.sectionTitle}>
                      Joined ({joinCollectiveData?.data?.length || 0})
                    </Text>
                  </View>
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
                      <Users size={48} color={PrimaryGrey} />
                      <Text style={styles.emptyStateText}>No joined collectives yet</Text>
                    </View>
                  )}
                </View>

                {/* Favorite Collectives Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Heart size={20} color={PrimaryGreen} />
                    <Text style={styles.sectionTitle}>
                      Favorites ({favoriteCollectives?.data?.length || 0})
                    </Text>
                  </View>
                  {favoriteCollectives?.data?.length > 0 ? (
                    <View style={styles.listContainer}>
                      {favoriteCollectives.data.map((item: any, index: number) => (
                        <View key={String(item.id)}>
                          {renderFavoriteCollectiveItem({ item })}
                          {index < favoriteCollectives.data.length - 1 && <View style={styles.separator} />}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Heart size={48} color={PrimaryGrey} />
                      <Text style={styles.emptyStateText}>No favorite collectives yet</Text>
                    </View>
                  )}
                </View>
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
              ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PrimaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#E5E7EB',
  },
  tabText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#111827',
  },
  listContent: {
    // paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 10,
  },
  separator: {
    height: 10,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  cardTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  badgeWrapper: {
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    maxWidth: '90%',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    maxWidth: '90%',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    textAlign: 'center'
  },
  placeholderDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
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
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 12,
    color: PrimaryGrey,
    fontSize: 16,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  listContainer: {
    // No specific height limit, let it grow naturally
  },
})

export default Circles