import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SearchTabsProps {
  activeTab: 'Nonprofits' | 'Giving Groups' | 'Users' | 'Posts';
  onTabChange: (tab: 'Nonprofits' | 'Giving Groups' | 'Users' | 'Posts') => void;
}

export default function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  const tabs: Array<'Nonprofits' | 'Giving Groups' | 'Users' | 'Posts'> = [
    'Nonprofits',
    'Giving Groups',
    'Users',
    'Posts',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => onTabChange(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  tab: {
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2c7fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    fontFamily: 'Outfit-Medium',
  },
  activeTabText: {
    color: '#2c7fff',
  },
});

