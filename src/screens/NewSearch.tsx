import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Search as SearchIcon, Heart, Plus } from 'lucide-react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import { normalizeSearchText } from '../utils/textNormalization';

export default function NewSearchPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');

  // Get category parameters if present
  const params = route.params as any;

  useEffect(() => {
    // If there's a category/query in params, navigate immediately to SearchResults
    if (params?.searchQuery) {
      navigation.navigate('SearchResults' as never, { searchQuery: params.searchQuery } as never);
    } else if (params?.categoryId || params?.categoryName) {
      const categoryName = params.categoryName || params.searchQuery;
      navigation.navigate('SearchResults' as never, {
        searchQuery: categoryName,
        categoryId: params.categoryId,
        categoryName: params.categoryName,
        tab: 'Causes'
      } as never);
    }
  }, [params, navigation]);

  const handleSearch = () => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    if (normalizedQuery) {
      Keyboard.dismiss();
      navigation.navigate('SearchResults' as never, { searchQuery: normalizedQuery } as never);
      setSearchQuery(''); // Optional: clear input after search or keep it
    }
  };

  const handleSurpriseMe = () => {
    const categories = (route.params as any)?.categories;
    if (categories && Array.isArray(categories) && categories.length > 0) {
      navigation.navigate('SurpriseMe' as never, { categories } as never);
    } else {
      navigation.navigate('SurpriseMe' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <MainHeaderNav
        title="Search"
        menu={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Input */}
        <View style={styles.searchSection}>
          <View style={styles.inputContainer}>
            <SearchIcon size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Search nonprofits, giving groups, or people"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Not Sure Where to Start Section */}
        <View style={styles.surpriseSection}>
          <Text style={styles.sectionTitle}>NOT SURE WHERE TO START?</Text>
          <TouchableOpacity
            onPress={handleSurpriseMe}
            style={styles.surpriseCard}
            activeOpacity={0.7}
          >
            <View style={styles.surpriseContent}>
              <View style={styles.iconContainer}>
                <Heart size={20} color="#FFFFFF" />
                <View style={styles.plusBadge}>
                  <Plus size={8} color="#A855F7" />
                </View>
              </View>

              <View style={styles.surpriseText}>
                <Text style={styles.surpriseTitle}>Surprise Me</Text>
                <Text style={styles.surpriseSubtitle}>
                  We'll pick 5 amazing nonprofits for you
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingLeft: 40,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#F9FAFB',
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#111827',
  },
  surpriseSection: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    fontFamily: 'Outfit-Bold',
  },
  surpriseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  surpriseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  plusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  surpriseText: {
    flex: 1,
  },
  surpriseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  surpriseSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Outfit-Regular',
  },
});

