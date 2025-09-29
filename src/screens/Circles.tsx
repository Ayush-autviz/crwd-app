import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryBlue, PrimaryGreen, SecondaryBlue, SecondaryGreen } from '../Constants/Colors'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { Plus, Search, Users } from 'lucide-react-native'

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
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState<TabKey>('my-crwds')

  const discoverCircles: DiscoverCircle[] = useMemo(
    () => [
      {
        id: 1,
        name: 'The Red Cross',
        description: 'An health organization that helps people in need',
        image: require('../assets/images/redcross.png'),
        type: 'Collective',
        members: 1250,
      },
      {
        id: 2,
        name: 'St. Judes',
        description: "The leading children's health organization",
        image: require('../assets/images/grocery.jpg'),
        type: 'Collective',
        members: 890,
      },
      {
        id: 4,
        name: "Women's Healthcare of At...",
        description: "We are Atlanta's #1 healthcare organization",
        image: require('../assets/images/redcross.png'),
        type: 'Collective',
        members: 456,
      },
      {
        id: 5,
        name: 'St. Judes',
        description: "The leading children's health organization",
        image: require('../assets/images/grocery.jpg'),
        type: 'Collective',
        members: 890,
      },
      {
        id: 3,
        name: "Women's Healthcare of At...",
        description: "We are Atlanta's #1 healthcare organization",
        image: require('../assets/images/redcross.png'),
        type: 'Collective',
        members: 456,
      },
    ],
    []
  )

  const renderDiscoverItem = ({ item }: { item: DiscoverCircle }) => {
    const isCircle = item.type === 'Collective'
    return (
      <TouchableOpacity
        onPress={() => (isCircle ? navigation.navigate('GroupCRWD' as never) : navigation.navigate('CauseScreen' as never))}
        activeOpacity={0.9}
        style={styles.card}
      >
        <View style={styles.cardLeft}>
          <Image source={item.image} style={styles.avatar} />
          <View style={styles.cardTextWrapper}>
            <View style={styles.badgeWrapper}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isCircle ? SecondaryGreen : SecondaryBlue },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isCircle ? PrimaryGreen : PrimaryBlue },
                  ]}
                >
                  {item.type}
                </Text>
              </View>
            </View>
            <Text style={styles.cardTitle} >
              {item.name}
            </Text>
            <Text style={styles.cardDescription} >
              {item.description}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          {!isCircle && (
            <>
              <TouchableOpacity
                onPress={() => navigation.navigate('Donation' as never)}
                style={[styles.actionButton, { backgroundColor: PrimaryBlue }]}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Donate Now</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('CauseScreen' as never)}>
                <Text style={{ color: PrimaryBlue }}>Visit Profile</Text>
              </TouchableOpacity>
            </>
          )}
          {isCircle && (
            <TouchableOpacity
              onPress={() => navigation.navigate('GroupCRWD' as never)}
              style={[styles.actionButton, { backgroundColor: PrimaryGreen }]}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Learn More</Text>
            </TouchableOpacity>
          )}
        </View>
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
          onPress={() => navigation.navigate('DrawerNav' as never, { screen: 'CreateCRWD'})}
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
          <Text style={[styles.tabText, activeTab === 'my-crwds' && styles.tabTextActive]}>My Collectives (0)</Text>
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
        <View style={styles.placeholderWrapper}>
          <Text style={styles.placeholderTitle}>You're not in a Collective yet.</Text>
          <Text style={styles.placeholderDescription}>
            Collectives are communities built around causes. Joinn one to instantly add its nonprofits to your Donation Box or start your own.
          </Text>
        </View>
      ) : (
        <FlatList
          data={discoverCircles}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderDiscoverItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
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
    paddingHorizontal: 16,
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
})

export default Circles