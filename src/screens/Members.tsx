import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Search } from 'lucide-react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { getCollectiveMembers } from '../services/api/crwd';
import { useAuthStore } from '../store/store';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';

// Type declarations
interface Member {
  name: string;
  username: string;
  connected: boolean;
  avatarUrl: string;
}

interface Cause {
  name: string;
  description: string;
  image: any;
  type: 'Collective' | 'Nonprofit';
}




type TabType = 'Causes' | 'Members' | 'Collective Donations';

export default function Members() {
  const route = useRoute();
  const routeParams = route.params as { tab?: TabType; collectiveData?: any } | undefined;
  const defaultTab = routeParams?.tab || 'Causes';
  const collectiveData = routeParams?.collectiveData;
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [showRecentDonations, setShowRecentDonations] = useState(false);
  const navigation = useNavigation()
  const { user: currentUser } = useAuthStore();

  // Get members from API if collectiveData is available (like in Vite)
  const { data: membersData, isLoading: isMembersLoading, error: membersError } = useQuery({
    queryKey: ['members', collectiveData?.id],
    queryFn: () => getCollectiveMembers(collectiveData?.id),
    enabled: !!collectiveData?.id,
  });

  console.log(collectiveData, 'collectiveData from API');
  

  // Use API data if available, otherwise fall back to static data (like in Vite)
  const membersToUse = membersData?.results || [];
  
  const filteredMembers = membersToUse.filter((m: any) => {
    // Handle API data structure where user info is nested under 'user' property
    const user = m.user || m;
    return user.first_name?.toLowerCase().includes(search.toLowerCase()) || 
           user.username?.toLowerCase().includes(search.toLowerCase()) ||
           user.last_name?.toLowerCase().includes(search.toLowerCase());
  });

  const handleConnect = (username: string) => {
    // Handle connect logic
  };

  const renderCausesTab = () => {
    // Use collectiveData causes if available, otherwise fall back to suggestedCauses (like in Vite)
    const causesToUse = collectiveData?.causes || [];
    
    return (
      <View style={styles.causesContainer}>
        {/* Search Bar */}
        {/* <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={PrimaryGrey} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search causes..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={PrimaryGrey}
            />
          </View>
        </View> */}

        {/* Causes List */}
        <ScrollView style={styles.causesList}>
          {causesToUse.length > 0 ? causesToUse.map((cause: any, index: number) => {
            // Handle both API data structure and static data structure (like in Vite)
            const causeData = cause.cause || cause;
            const causeName = causeData.name;
            const causeDescription = causeData.description;
            const causeImage = causeData.image;
            const causeType = causeData.type || 'Nonprofit';
            
            return (
              <View key={index} style={styles.causeItem}>
                <View style={styles.causeInfo}>
                  {/* <Image 
                    source={typeof causeImage === 'string' ? { uri: causeImage } : causeImage} 
                    style={styles.causeImage} 
                  /> */}
                  <Avatar size={40}>
                    <AvatarImage src={causeImage} />
                    <AvatarFallback>
                      {causeName.split(' ')[0][0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <View style={styles.causeDetails}>
                    <View style={[
                      styles.typeBadge,
                      causeType === 'Collective' ? styles.crwdBadge : styles.nonprofitBadge
                    ]}>
                      <Text style={[
                        styles.typeText,
                        causeType === 'Collective' ? styles.crwdText : styles.nonprofitText
                      ]}>
                        {causeType}
                      </Text>
                    </View>
                    <Text style={styles.causeName}>{causeName}</Text>
                    <Text style={styles.causeDescription}>{causeDescription}</Text>
                  </View>
                </View>
                {causeType === 'Nonprofit' && (
                  <View style={styles.causeActions}>
                    <TouchableOpacity onPress={() => navigation.navigate('CauseScreen' as never, { causeId: causeData.id } as never)} style={styles.donateButton}>
                      <Text style={styles.donateButtonText}>Donate Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('CauseScreen' as never, { causeId: causeData.id } as never)}>
                      <Text style={styles.visitProfileText}>Visit Profile</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {causeType === 'Collective' && (
                  <View style={styles.causeActions}>
                    <TouchableOpacity onPress={() => navigation.navigate('GroupCRWD' as never, { collectiveId: causeData.id } as never)} style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>Learn More</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No causes available</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderMembersTab = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={PrimaryGrey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={PrimaryGrey}
          />
        </View>
      </View>

      {/* Loading State */}
      {isMembersLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      ) : (
        /* Members List */
        <ScrollView style={styles.membersList}>
          {filteredMembers.length > 0 ? filteredMembers.map((member: any) => {
            // Handle API data structure where user info is nested under 'user' property
            const user = member.user || member;
            const fullName = user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.first_name || user.name || 'Unknown User';
            const username = user.username || 'unknown';
            const avatarUrl = user.profile_picture || user.avatarUrl || user.avatar;
            
            // Check if this is the current user
            const isCurrentUser = currentUser?.id === user.id;
            
            return (
              <View key={user.username || user.id || member.id} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <Avatar size={40}>
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>
                      {fullName.split(' ').map((word: string) => word[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.memberName}>{fullName}</Text>
                    <Text style={styles.memberUsername}>@{username}</Text>
                  </View>
                </View>
                {!isCurrentUser && (
                  <TouchableOpacity
                    onPress={() => handleConnect(username)}
                    style={[
                      styles.connectButton,
                      user.is_following && styles.connectedButton
                    ]}
                  >
                    <Text style={[
                      styles.connectButtonText,
                      user.is_following && styles.connectedButtonText
                    ]}>
                      {user.is_following ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No members found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </>
  );

  const renderCollectiveDonationsTab = () => (
    <>
      {/* Search Bar */}
      {/* <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={PrimaryGrey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={PrimaryGrey}
          />
        </View>
      </View> */}

      {/* Impact Metrics */}
      <View style={styles.impactMetrics}>
        <Text style={styles.impactTitle}>Impact Metrics</Text>
        
        <View style={styles.metricItem}>
          <View style={styles.metricRow}>
            <View style={styles.metricLabel}>
              <Text style={styles.metricText}>Collective Donations</Text>
            </View>
            <Text style={styles.metricValue}>${collectiveData?.total_donated_amount || 0}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowRecentDonations(true)}>
            <Text style={styles.seeRecentText}>See recent donations</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricItem}>
          <View style={styles.metricRow}>
            <Text style={styles.metricText}>Causes</Text>
            <Text style={styles.metricValue}>{collectiveData?.causes?.length ?? 0}</Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <View style={styles.metricRow}>
            <Text style={styles.metricText}>Members</Text>
            <Text style={styles.metricValue}>{collectiveData?.member_count ?? 0}</Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} title={'Members'}/>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['Causes', 'Members', 'Collective Donations'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
          >
            <View style={styles.tabContent}>
              {tab !== 'Collective Donations' && (
                <View style={[
                  styles.tabCount,
                  activeTab === tab && styles.activeTabCount
                ]}>
                  <Text style={[
                    styles.tabCountText,
                    activeTab === tab && styles.activeTabCountText
                  ]}>
                    {tab === 'Causes' ? (collectiveData?.causes?.length ?? 0) : tab === 'Members' ? (collectiveData?.member_count ?? 0) : undefined}
                  </Text>
                </View>
              )}
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}>
                {tab === 'Causes' ? tab : tab === 'Members' ? 'Members' : 'Contributions' }
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'Causes' && renderCausesTab()}
      {activeTab === 'Members' && renderMembersTab()}
      {activeTab === 'Collective Donations' && renderCollectiveDonationsTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: LightGrey,
    marginTop: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: PrimaryBlue,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  tabCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabCount: {
    backgroundColor: PrimaryBlue + '20',
  },
  tabCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  activeTabCountText: {
    color: PrimaryBlue,
  },
  tabText: {
    fontSize: 14,
    color: PrimaryGrey,
    fontWeight: '500',
  },
  activeTabText: {
    color: PrimaryBlue,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#000',
  },
  causesContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  causesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    marginBottom: 12,
    borderRadius: 8,
  },
  causeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 16,
  },
  causeImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  causeDetails: {
    flex: 1,
    minWidth: 0,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  crwdBadge: {
    backgroundColor: '#dcfce7',
  },
  nonprofitBadge: {
    backgroundColor: '#dbeafe',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  crwdText: {
    color: '#16a34a',
  },
  nonprofitText: {
    color: '#2563eb',
  },
  causeName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  causeDescription: {
    fontSize: 12,
    color: PrimaryGrey,
    lineHeight: 16,
  },
  causeActions: {
    alignItems: 'center',
    gap: 8,
  },
  donateButton: {
    backgroundColor: PrimaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  donateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  visitProfileText: {
    color: PrimaryBlue,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  membersList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: LightGrey,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
  },
  memberUsername: {
    fontSize: 12,
    color: PrimaryGrey,
  },
  connectButton: {
    backgroundColor: '#F0F2FB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  connectedButton: {
    backgroundColor: PrimaryBlue,
  },
  connectButtonText: {
    color: PrimaryBlue,
    fontSize: 12,
    fontWeight: '500',
  },
  connectedButtonText: {
    color: '#fff',
  },
  impactMetrics: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    paddingHorizontal: 32,
  },
  metricItem: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 2,
  },
  metricText: {
    fontSize: 14,
    color: '#374151',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 2,
    textAlign: 'right',
  },
  seeRecentText: {
    fontSize: 12,
    color: PrimaryBlue,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: PrimaryGrey,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: PrimaryGrey,
    textAlign: 'center',
  },
  currentUserBadge: {
    backgroundColor: PrimaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentUserText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
}); 