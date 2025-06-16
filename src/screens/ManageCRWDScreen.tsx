import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Settings, Trash2 } from 'lucide-react-native';

export default function ManageCRWDScreen() {
  const navigation = useNavigation();
  const [crowds, setCrowds] = useState([
    {
      id: '1',
      name: 'Environmental CRWD',
      description: 'Supporting environmental causes',
      organizations: 5,
      totalDonated: 1200,
    },
    {
      id: '2',
      name: 'Education CRWD',
      description: 'Supporting educational initiatives',
      organizations: 3,
      totalDonated: 800,
    },
  ]);

  const handleEditCRWD = (crowdId: string) => {
    // Navigate to edit CRWD screen
    // navigation.navigate('EditCRWD', { crowdId });
  };

  const handleDeleteCRWD = (crowdId: string) => {
    setCrowds(crowds.filter(crowd => crowd.id !== crowdId));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage CRWDs</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create New CRWD Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {/* navigation.navigate('CreateCRWD') */}}
        >
          <Text style={styles.createButtonText}>Create New CRWD</Text>
        </TouchableOpacity>

        {/* CRWDs List */}
        {crowds.map(crowd => (
          <View key={crowd.id} style={styles.crowdCard}>
            <View style={styles.crowdHeader}>
              <View style={styles.crowdInfo}>
                <Text style={styles.crowdName}>{crowd.name}</Text>
                <Text style={styles.crowdDescription}>{crowd.description}</Text>
              </View>
              <View style={styles.crowdActions}>
                <TouchableOpacity
                  onPress={() => handleEditCRWD(crowd.id)}
                  style={styles.actionButton}
                >
                  <Settings size={16} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteCRWD(crowd.id)}
                  style={styles.actionButton}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.crowdStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{crowd.organizations}</Text>
                <Text style={styles.statLabel}>Organizations</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${crowd.totalDonated}</Text>
                <Text style={styles.statLabel}>Total Donated</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  createButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  crowdCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  crowdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  crowdInfo: {
    flex: 1,
  },
  crowdName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  crowdDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  crowdActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crowdStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginTop: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
}); 