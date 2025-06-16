import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MainHeaderNav from '../components/MainHeaderNav';
import { PrimaryBlue, PrimaryGrey, LightGrey } from '../Constants/Colors';

export default function CRWDScreen() {
  const navigation = useNavigation();

  // Mock CRWDs data - matching the web version
  const mockCrwds = [
    {
      id: 1,
      name: "Feed the Hungry",
      description: "Solving world hunger a...",
      avatar: "F",
      backgroundColor: "#2563eb"
    },
    {
      id: 2,
      name: "Clean Water Initiative",
      description: "Providing clean water to...",
      avatar: "C",
      backgroundColor: "#059669"
    },
    {
      id: 3,
      name: "Education for All",
      description: "Supporting education in...",
      avatar: "E",
      backgroundColor: "#dc2626"
    }
  ];

  const handleCRWDPress = (crwd: any) => {
    // Navigate to individual CRWD detail screen (like GroupCRWD)
    navigation.navigate('GroupCRWD' as never);
  };

  const handleManage = (crwd: any) => {
    // Navigate to manage CRWD screen
    navigation.navigate('ManageCRWD' as never);
  };

  const renderCRWDItem = (crwd: any) => (
    <View key={crwd.id} style={styles.crwdItem}>
      <TouchableOpacity
        style={styles.crwdContent}
        onPress={() => handleCRWDPress(crwd)}
      >
        <View style={[styles.crwdAvatar, { backgroundColor: crwd.backgroundColor }]}>
          <Text style={styles.crwdAvatarText}>{crwd.avatar}</Text>
        </View>
        <View style={styles.crwdInfo}>
          <Text style={styles.crwdName}>{crwd.name}</Text>
          <Text style={styles.crwdDescription}>{crwd.description}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.manageButton}
        onPress={() => handleManage(crwd)}
      >
        <Text style={styles.manageButtonText}>Manage</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your CRWDs</Text>
      </View>

      {/* CRWDs List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {mockCrwds.map(renderCRWDItem)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: LightGrey,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 8,
    paddingTop: 16,
  },
  crwdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  crwdContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  crwdAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  crwdAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  crwdInfo: {
    flex: 1,
    minWidth: 0,
  },
  crwdName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 18,
  },
  crwdDescription: {
    fontSize: 12,
    color: PrimaryGrey,
    marginTop: 2,
    maxWidth: 140,
  },
  manageButton: {
    marginLeft: 8,
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: PrimaryBlue,
  },
});
