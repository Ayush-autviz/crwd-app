import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Search as SearchIcon, Plus, Loader2, ChevronRight, Sparkles } from 'lucide-react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../services/api/crwd';
import { normalizeSearchText } from '../utils/textNormalization';

export default function NewSearchPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: true,
  });

  const categories = categoriesData?.data || [];

  // Get category parameters if present
  const params = route.params as any;

  useEffect(() => {
    // If there's a category/query in params, navigate immediately to SearchResults
    if (params?.searchQuery) {
      (navigation as any).navigate('SearchResults', { searchQuery: params.searchQuery });
    } else if (params?.categoryId || params?.categoryName) {
      const categoryName = params.categoryName || params.searchQuery;
      (navigation as any).navigate('SearchResults', {
        searchQuery: categoryName,
        categoryId: params.categoryId,
        categoryName: params.categoryName,
        tab: 'Nonprofits'
      });
    }
  }, [params, navigation]);

  const handleSearch = () => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    if (normalizedQuery) {
      Keyboard.dismiss();
      (navigation as any).navigate('SearchResults', { searchQuery: normalizedQuery });
      setSearchQuery('');
    }
  };

  const handleToggleCategories = () => {
    setShowCategories(!showCategories);
  };

  const handleCategoryClick = (cat: any) => {
    (navigation as any).navigate('SearchResults', {
      searchQuery: cat.name,
      categoryId: cat.id,
      categoryName: cat.name,
      tab: 'Nonprofits'
    });
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
        {/* Search Input Section */}
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
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Not Sure Where to Start Section - Exactly like Vite Card */}
        <View style={styles.surpriseSection}>
          <Text style={styles.sectionTitle}>NOT SURE WHERE TO START?</Text>

          <TouchableOpacity
            onPress={handleToggleCategories}
            activeOpacity={0.8}
            style={styles.browseCard}
          >
            <View style={styles.browseCardContent}>
              <View style={styles.browseHeader}>
                {/* Gradient Icon Wrapper */}
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={['#A855F7', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientIcon}
                  >
                    <Sparkles size={20} color="#FFFFFF" strokeWidth={2.5} />
                  </LinearGradient>
                  {/* Plus badge positioned absolutely relative to iconContainer to avoid clipping */}
                  <View style={styles.plusBadge}>
                    <Plus size={8} color="#A855F7" />
                  </View>
                </View>

                <View style={styles.browseTextContainer}>
                  <Text style={styles.browseTitle}>Browse Nonprofits</Text>
                  <Text style={styles.browseSubtitle}>Discover nonprofits by category</Text>
                </View>
              </View>

              {/* Categories Section */}
              {showCategories && (
                <View style={styles.categoriesContainer}>
                  {isLoadingCategories ? (
                    <View style={styles.loaderArea}>
                      <ActivityIndicator size="small" color="#1600ff" />
                    </View>
                  ) : (
                    <View style={styles.categoriesGrid}>
                      {categories.map((cat: any) => (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => handleCategoryClick(cat)}
                          style={[
                            styles.categoryPill,
                            { backgroundColor: cat.background_color || '#f3f4f6' }
                          ]}
                        >
                          <Text style={[
                            styles.categoryText,
                            { color: cat.text_color || cat.color || '#111' }
                          ]}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
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
    paddingBottom: 100,
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
  browseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  browseCardContent: {
    padding: 12,
  },
  browseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    position: 'relative',
  },
  gradientIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 4,
  },
  browseTextContainer: {
    flex: 1,
  },
  browseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  browseSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Outfit-Regular',
  },
  categoriesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  loaderArea: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
  },
});

