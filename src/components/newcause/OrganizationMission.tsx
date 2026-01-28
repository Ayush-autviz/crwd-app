import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OrganizationMissionProps {
  causeData: any;
}

export default function OrganizationMission({ causeData }: OrganizationMissionProps) {
  const mission = causeData?.mission || causeData?.description;

  if (!mission) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Organization Mission</Text>
      <Text style={styles.mission}>{mission}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  mission: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
    fontFamily: 'Outfit-Regular',
  },
});

