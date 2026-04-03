import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGreen, PrimaryGrey } from '../Constants/Colors'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, Users, ChevronRight, ArrowLeft } from 'lucide-react-native'
import { useQuery } from '@tanstack/react-query'
import { getCollectives, getJoinCollective } from '../services/api/crwd'
import { useAuthStore } from '../store/store'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar'

type TabKey = 'my-crwds' | 'discover'

const Circles = () => {
  const navigation = useNavigation<any>()
  const [activeTab, setActiveTab] = useState<TabKey>('my-crwds')
  const { user: currentUser } = useAuthStore()

  // Fetch collectives data
  const {
    data: collectiveData,
    isLoading: isLoadingCollectives,
    refetch: refetchCollectives,
    isRefetching: isRefetchingCollectives
  } = useQuery({
    queryKey: ['circles'],
    queryFn: () => getCollectives(),
  })

  // Fetch joined collectives
  const {
    data: joinCollectiveData,
    isLoading: isLoadingJoinCollective,
    refetch: refetchJoinCollectives,
    isRefetching: isRefetchingJoinCollective
  } = useQuery({
    queryKey: ['joined-collectives', currentUser?.id],
    queryFn: () => getJoinCollective(currentUser?.id || ''),
    enabled: !!currentUser?.id,
  })

  const onRefresh = React.useCallback(() => {
    refetchCollectives()
    if (currentUser?.id) {
      refetchJoinCollectives()
    }
  }, [refetchCollectives, refetchJoinCollectives, currentUser?.id])

  const refreshing = isRefetchingCollectives || isRefetchingJoinCollective

  const joinedCollectiveIds = useMemo(() => {
    return new Set(joinCollectiveData?.data?.map((item: any) => item.collective?.id || item.id) || [])
  }, [joinCollectiveData])

  const discoverGroups = useMemo(() => {
    return collectiveData?.results?.filter((item: any) => !joinedCollectiveIds.has(item.id)) || []
  }, [collectiveData, joinedCollectiveIds])

  const myGroups = joinCollectiveData?.data?.map((item: any) => item.collective || item) || []

  useEffect(() => {
    if (joinCollectiveData?.data && joinCollectiveData.data.length === 0) {
      setActiveTab('discover')
    }
  }, [joinCollectiveData])

  const CircleItem = ({ item, isStartAction = false }: { item?: any, isStartAction?: boolean }) => {
    if (isStartAction) {
      return (
        <TouchableOpacity
          onPress={() => navigation.navigate('DrawerNav', { screen: 'CreateCRWD' })}
          activeOpacity={0.7}
          style={styles.itemContainer}
        >
          <View style={styles.itemWrapper}>
            <View style={styles.itemMain}>
              <View style={[styles.avatarContainer, { backgroundColor: '#eff6ff' }]}>
                <Text style={[styles.avatarText, { color: '#2222EE' }]}>G</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.itemTitle}>Start a Giving Group</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  Bring people together around causes you care about
                </Text>
              </View>
            </View>
            <ChevronRight size={24} color="#6b7280" />
          </View>
        </TouchableOpacity>
      )
    }

    const name = item.name || 'Unnamed Group'
    const initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 1).toUpperCase()

    const nonprofitCount = item.causes_count || item.supported_causes_count || 0
    const memberCount = item.member_count || item.members_count || 0

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('GroupCRWD', { collectiveId: item.id?.toString() })}
        activeOpacity={0.7}
        style={styles.itemContainer}
      >
        <View style={styles.itemWrapper}>
          <View style={styles.itemMain}>
            <Avatar size={48} style={styles.avatar}>
              <AvatarImage src={item.logo} />
              <AvatarFallback
                style={[styles.avatarContainer, { backgroundColor: item.color || '#2222EE' }]}
                textStyle={{ color: '#fff', fontWeight: '700', fontSize: 18 }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle} numberOfLines={1}>{name}</Text>
              <Text style={styles.itemStats}>
                {nonprofitCount} nonprofits · {memberCount} members
              </Text>
            </View>
          </View>
          <ChevronRight size={24} color="#6b7280" />
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Groups</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('DrawerNav', { screen: 'CreateCRWD' })}
          style={styles.createIconButton}
        >
          <Plus size={20} color="#2222EE" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('my-crwds')}
          style={styles.tabButton}
        >
          <Text style={[styles.tabText, activeTab === 'my-crwds' && styles.activeTabText]}>
            My Groups {myGroups.length > 0 && <Text style={styles.tabCount}>{myGroups.length}</Text>}
          </Text>
          {activeTab === 'my-crwds' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('discover')}
          style={styles.tabButton}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
          {activeTab === 'discover' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'my-crwds' ? ['start-action', ...myGroups] : ['start-action', ...discoverGroups]}
        keyExtractor={(item, index) => (typeof item === 'string' ? item : String(item.id || index))}
        renderItem={({ item }) => (
          <CircleItem item={item === 'start-action' ? undefined : item} isStartAction={item === 'start-action'} />
        )}
        ListEmptyComponent={
          !isLoadingJoinCollective && !isLoadingCollectives ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#e5e7eb" />
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyText}>Join a group or start your own!</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          (isLoadingJoinCollective || isLoadingCollectives) && !refreshing ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#2222EE" />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2222EE" />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  createIconButton: {
    width: 32,
    height: 32,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#2222EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    fontFamily: 'Outfit-Medium',
  },
  tabCount: {
    fontSize: 18,
  },
  activeTabText: {
    color: '#2222EE',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#2222EE',
  },
  listContent: {
    paddingBottom: 40,
  },
  itemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    borderRadius: 8,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    fontFamily: 'Outfit-Regular',
  },
  itemStats: {
    fontSize: 14,
    color: '#4b5563',
    fontFamily: 'Outfit-Medium',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    fontFamily: 'Outfit-Bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Outfit-Regular',
  },
})

export default Circles