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
            <Plus size={20} color="#000000" />
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'left',
    fontFamily: 'Outfit-Bold',
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 8,
    marginTop: 4,
    textAlign: 'left',
    fontFamily: 'Outfit-Regular',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blackLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
});

