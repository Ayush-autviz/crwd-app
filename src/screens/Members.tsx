import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

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

// Sample members data
const members: Member[] = [
  { name: "Chad F.", username: "chad", connected: true, avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Mia Cares", username: "miacares1", connected: false, avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Conrad M.", username: "conradm1", connected: false, avatarUrl: "https://randomuser.me/api/portraits/men/65.jpg" },
  { name: "Morgan Wallace", username: "moremorgan", connected: false, avatarUrl: "https://randomuser.me/api/portraits/women/28.jpg" },
  { name: "Ashton Thomas", username: "ash_t2001", connected: false, avatarUrl: "https://randomuser.me/api/portraits/men/45.jpg" },
  { name: "Marc Paul", username: "makinmymarc", connected: false, avatarUrl: "https://randomuser.me/api/portraits/men/52.jpg" },
  { name: "Cara Cara", username: "carebear", connected: false, avatarUrl: "https://randomuser.me/api/portraits/women/33.jpg" },
  { name: "Raquel Wells", username: "rawells", connected: false, avatarUrl: "https://randomuser.me/api/portraits/women/62.jpg" },
  { name: "Bethany Burke", username: "bburke", connected: false, avatarUrl: "https://randomuser.me/api/portraits/women/17.jpg" },
  { name: "Max Fields", username: "maxf", connected: false, avatarUrl: "https://randomuser.me/api/portraits/men/91.jpg" },
];

// Sample causes data
const suggestedCauses: Cause[] = [
  {
    name: "The Red Cross",
    description: "An health organization that...",
    image: require('../assets/images/redcross.png'),
    type: "Nonprofit",
  },
  {
    name: "St. Judes",
    description: "The leading children's hea...",
    image: require('../assets/images/redcross.png'),
    type: "Nonprofit",
  },
  {
    name: "Women's Healthcare of At...",
    description: "We are Atlanta's #1 healthca...",
    image: require('../assets/images/redcross.png'),
    type: "Nonprofit",
  },
];

type TabType = 'Causes' | 'Members' | 'Collective Donations';

export default function Members() {
  const route = useRoute();
  const routeParams = route.params as { tab?: TabType } | undefined;
  const defaultTab = routeParams?.tab || 'Causes';
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [showRecentDonations, setShowRecentDonations] = useState(false);
  const navigation = useNavigation()

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = (username: string) => {
    // Handle connect logic
  };

  const renderCausesTab = () => (
    <View style={styles.causesContainer}>
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

      {/* Causes List */}
      <ScrollView style={styles.causesList}>
        {suggestedCauses.map((cause, index) => (
          <View key={index} style={styles.causeItem}>
            <View style={styles.causeInfo}>
              <Image source={cause.image} style={styles.causeImage} />
              <View style={styles.causeDetails}>
                <View style={[
                  styles.typeBadge,
                  cause.type === 'Collective' ? styles.crwdBadge : styles.nonprofitBadge
                ]}>
                  <Text style={[
                    styles.typeText,
                    cause.type === 'Collective' ? styles.crwdText : styles.nonprofitText
                  ]}>
                    {cause.type}
                  </Text>
                </View>
                <Text style={styles.causeName}>{cause.name}</Text>
                <Text style={styles.causeDescription}>{cause.description}</Text>
              </View>
            </View>
            {cause.type === 'Nonprofit' && (
              <View style={styles.causeActions}>
                <TouchableOpacity onPress={() => navigation.navigate('CauseScreen' as never)} style={styles.donateButton}>
                  <Text style={styles.donateButtonText}>Donate Now</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('CauseScreen' as never)}>
                  <Text style={styles.visitProfileText}>Visit Profile</Text>
                </TouchableOpacity>
              </View>
            )}
            {cause.type === 'Collective' && (
              <View style={styles.causeActions}>
                <TouchableOpacity onPress={() => navigation.navigate('GroupCRWD' as never)} style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Learn More</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

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

      {/* Members List */}
      <ScrollView style={styles.membersList}>
        {filteredMembers.map((member) => (
          <View key={member.username} style={styles.memberItem}>
            <View style={styles.memberInfo}>
              <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberUsername}>@{member.username}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleConnect(member.username)}
              style={[
                styles.connectButton,
                member.connected && styles.connectedButton
              ]}
            >
              <Text style={[
                styles.connectButtonText,
                member.connected && styles.connectedButtonText
              ]}>
                {member.connected ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </>
  );

  const renderCollectiveDonationsTab = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={PrimaryGrey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={PrimaryGrey}
          />
        </View>
      </View>

      {/* Impact Metrics */}
      <View style={styles.impactMetrics}>
        <Text style={styles.impactTitle}>Impact Metrics</Text>
        
        <View style={styles.metricItem}>
          <View style={styles.metricRow}>
            <View style={styles.metricLabel}>
              <Text style={styles.metricText}>Collective Donations</Text>
            </View>
            <Text style={styles.metricValue}>$34</Text>
          </View>
          <TouchableOpacity onPress={() => setShowRecentDonations(true)}>
            <Text style={styles.seeRecentText}>See recent donations</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricItem}>
          <View style={styles.metricRow}>
            <Text style={styles.metricText}>Causes</Text>
            <Text style={styles.metricValue}>3</Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <View style={styles.metricRow}>
            <Text style={styles.metricText}>Members</Text>
            <Text style={styles.metricValue}>59</Text>
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
              <View style={[
                styles.tabCount,
                activeTab === tab && styles.activeTabCount
              ]}>
                <Text style={[
                  styles.tabCountText,
                  activeTab === tab && styles.activeTabCountText
                ]}>
                  {tab === 'Causes' ? 1 : tab === 'Members' ? members.length : 34}
                </Text>
              </View>
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
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
}); 