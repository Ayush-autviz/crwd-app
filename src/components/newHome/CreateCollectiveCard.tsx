import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function CreateCollectiveCard() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.card, styles.whiteCard]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CreateCRWD' as never)}
      >
        <View style={styles.cardInner}>
          <View style={[styles.iconContainer, styles.greenIcon]}>
            <Plus size={24} color="#000000" />
          </View>
          <View style={styles.content}>
            <Text style={styles.cardTitle}>Start Your Own Collective</Text>
            <Text style={styles.cardSubtitle}>
              Bring people together around causes you care about.
            </Text>
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('CreateCRWD' as never)}
            >
              <Text style={styles.blackLink}>Create collective</Text>
              <ArrowRight size={12} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
  },
  cardInner: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  greenIcon: {
    backgroundColor: '#AEFF30',
  },
  content: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'left',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#4B5563',
    marginBottom: 8,
    marginTop: 4,
    textAlign: 'left',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blackLink: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
});

