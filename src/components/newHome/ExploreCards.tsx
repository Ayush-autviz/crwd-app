import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Heart, Users } from 'lucide-react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';

export default function ExploreCards() {
  const navigation = useNavigation();

  const cards = [
    {
      id: 'explore',
      icon: Search,
      iconColor: '#3B82F6',
      bgColor: '#DBEAFE',
      title: 'Explore by Category',
      subtitle: 'Browse nonprofits making a difference',
      onPress: () => navigation.navigate('Search' as never),
    },
    {
      id: 'favorites',
      icon: Heart,
      iconColor: '#F59E0B',
      bgColor: '#FEF3C7',
      title: 'Your Favorites',
      subtitle: 'View your saved causes and collectives',
      onPress: () => navigation.navigate('Saved' as never),
    },
    {
      id: 'browse',
      icon: Users,
      iconColor: '#8B5CF6',
      bgColor: '#F3E8FF',
      title: 'Browse CRWDs',
      subtitle: 'Discover communities you can join',
      onPress: () => {
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
                        routes: [
                          { name: 'Home' as never },
                          { name: 'Search' as never },
                          { name: 'Donate' as never },
                          { name: 'Collectives' as never },
                          { name: 'Profile' as never },
                        ],
                        index: 3, // Collectives tab index
                      },
                    },
                  ],
                  index: 0,
                },
              },
            ],
          })
        );
      },
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {cards.map((card) => {
          const IconComponent = card.icon;
          return (
            <TouchableOpacity
              key={card.id}
              onPress={card.onPress}
              style={styles.card}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, { backgroundColor: card.bgColor }]}>
                <IconComponent size={32} color={card.iconColor} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{card.title}</Text>
                <Text style={styles.subtitle}>{card.subtitle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  grid: {
    gap: 12,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
});

