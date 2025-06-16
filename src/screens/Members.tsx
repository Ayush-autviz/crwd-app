import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors';

// Type declarations
interface Member {
  name: string;
  username: string;
  connected: boolean;
  avatarUrl: string;
}

interface DonationSummary {
  totalAmount: number;
  donorsCount: number;
  averageDonation: number;
  topDonors: Array<{
    name: string;
    amount: number;
    avatarUrl: string;
  }>;
}

interface RecentDonation {
  name: string;
  username: string;
  amount: number;
  date: string;
  avatarUrl: string;
}

// Sample members data
const initialMembers: Member[] = [
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

// Sample donation summary data
const donationSummary: DonationSummary = {
  totalAmount: 15750,
  donorsCount: 58,
  averageDonation: 271.55,
  topDonors: [
    { name: "Chad F.", amount: 1200, avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Mia Cares", amount: 850, avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Conrad M.", amount: 750, avatarUrl: "https://randomuser.me/api/portraits/men/65.jpg" },
  ]
};

// Sample recent donations data
const recentDonations: RecentDonation[] = [
  { name: "Chad F.", username: "chad", amount: 50, date: "2h ago", avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Mia Cares", username: "miacares1", amount: 100, date: "5h ago", avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Conrad M.", username: "conradm1", amount: 75, date: "1d ago", avatarUrl: "https://randomuser.me/api/portraits/men/65.jpg" },
  { name: "Morgan W.", username: "moremorgan", amount: 25, date: "2d ago", avatarUrl: "https://randomuser.me/api/portraits/women/28.jpg" },
];

type TabType = 'Members' | 'Donations' | 'Recent';

export default function Members() {
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [activeTab, setActiveTab] = useState<TabType>('Members');

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = (username: string) => {
    setMembers(members.map(member => 
      member.username === username 
        ? { ...member, connected: !member.connected }
        : member
    ));
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
                {member.connected ? 'Connected' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </>
  );

  const renderDonationsTab = () => (
    <ScrollView style={styles.donationsContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Collective Donations Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${donationSummary.totalAmount}</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{donationSummary.donorsCount}</Text>
            <Text style={styles.statLabel}>Total Donors</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${donationSummary.averageDonation}</Text>
            <Text style={styles.statLabel}>Average Donation</Text>
          </View>
        </View>
        <Text style={styles.topDonorsTitle}>Top Donors</Text>
        {donationSummary.topDonors.map((donor, index) => (
          <View key={index} style={styles.donorItem}>
            <View style={styles.memberInfo}>
              <Image source={{ uri: donor.avatarUrl }} style={styles.avatar} />
              <Text style={styles.memberName}>{donor.name}</Text>
            </View>
            <Text style={styles.donationAmount}>${donor.amount}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderRecentTab = () => (
    <ScrollView style={styles.recentContainer}>
      {recentDonations.map((donation, index) => (
        <View key={index} style={styles.donationItem}>
          <View style={styles.memberInfo}>
            <Image source={{ uri: donation.avatarUrl }} style={styles.avatar} />
            <View>
              <Text style={styles.memberName}>{donation.name}</Text>
              <Text style={styles.memberUsername}>@{donation.username}</Text>
            </View>
          </View>
          <View style={styles.donationDetails}>
            <Text style={styles.donationAmount}>${donation.amount}</Text>
            <Text style={styles.donationDate}>{donation.date}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} />
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['Members', 'Donations', 'Recent'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'Members' && renderMembersTab()}
      {activeTab === 'Donations' && renderDonationsTab()}
      {activeTab === 'Recent' && renderRecentTab()}
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
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: PrimaryBlue,
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
  donationsContainer: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: PrimaryBlue,
  },
  statLabel: {
    fontSize: 12,
    color: PrimaryGrey,
    marginTop: 4,
  },
  topDonorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  donorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LightGrey,
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: PrimaryBlue,
  },
  recentContainer: {
    flex: 1,
  },
  donationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: LightGrey,
  },
  donationDetails: {
    alignItems: 'flex-end',
  },
  donationDate: {
    fontSize: 12,
    color: PrimaryGrey,
    marginTop: 4,
  },
}); 