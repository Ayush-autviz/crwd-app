import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type TabType = 'Nonprofits' | 'Members' | 'Donations';

interface CollectiveStatsProps {
  nonprofitCount?: number;
  memberCount?: number;
  donationCount?: number;
  onStatClick?: (tab: TabType) => void;
}

export default function CollectiveStats({
  nonprofitCount = 0,
  memberCount = 0,
  donationCount = 0,
  onStatClick,
}: CollectiveStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <TouchableOpacity
          onPress={() => onStatClick?.('Nonprofits')}
          style={[styles.statItem, onStatClick && styles.clickable]}
          activeOpacity={onStatClick ? 0.7 : 1}
        >
          <Text style={styles.statValue}>{nonprofitCount}</Text>
          <Text style={styles.statLabel}>Nonprofits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onStatClick?.('Members')}
          style={[styles.statItem, onStatClick && styles.clickable]}
          activeOpacity={onStatClick ? 0.7 : 1}
        >
          <Text style={styles.statValue}>{memberCount}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onStatClick?.('Donations')}
          style={[styles.statItem, onStatClick && styles.clickable]}
          activeOpacity={onStatClick ? 0.7 : 1}
        >
          <Text style={[styles.statValue, styles.donationValue]}>{donationCount}</Text>
          <Text style={styles.statLabel}>Donations</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  clickable: {
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  donationValue: {
    color: '#1600ff',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    color: '#6B7280',
  },
});

