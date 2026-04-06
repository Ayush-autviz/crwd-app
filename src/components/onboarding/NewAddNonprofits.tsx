import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Search, Heart, Check, X } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { getCausesBySearch, getCategories } from '../../services/api/crwd';
import { truncateAtFirstPeriod } from '../../utils/truncateFirstPeriod';

const { width } = Dimensions.get('window');

export default function NewAddNonprofits() {
  const navigation = useNavigation();
  const route = useRoute();
  const redirectTo = (route.params as any)?.redirectTo || 'DrawerNav';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCauses, setSelectedCauses] = useState<any[]>([]);

  // Fetch causes based on search or category
  const { data: causesData, isLoading: isLoadingCauses } = useQuery({
    queryKey: ['causes-search', searchQuery, selectedCategory],
    queryFn: () => getCausesBySearch(searchQuery, selectedCategory || '', 1),
  });

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const displayCauses = causesData?.results || [];
  const categories = categoriesData?.data || [];

  const toggleSelection = (cause: any) => {
    const id = cause.id.toString();
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      setSelectedCauses((prev) => prev.filter((c) => c.id.toString() !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
      setSelectedCauses((prev) => [...prev, cause]);
    }
  };

  const handleNext = () => {
    (navigation as any).navigate('DonationAmount', {
      ...route.params,
      selectedCauses: selectedIds,
      addedNonprofits: selectedCauses,
    });
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'DrawerNav',
          params: {
            screen: 'MainTabs',
            params: {
              screen: 'Profile',
            },
          },
        },
      ] as any,
    });
  };

  const renderCauseItem = ({ item }: { item: any }) => {
    const isSelected = selectedIds.includes(item.id.toString());
    return (
      <TouchableOpacity
        style={styles.causeItem}
        onPress={() => toggleSelection(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.image }} style={styles.causeAvatar} />
        <View style={styles.causeInfo}>
          <Text style={styles.causeName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.causeMission} >
            {truncateAtFirstPeriod(item.mission || item.bio || item.about_us || "Disaster relief and emergency assistance")}
          </Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={14} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Progress Indicator - Step 3 of 5 */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, styles.progressActive]} />
          <View style={[styles.progressStep, styles.progressActive]} />
          <View style={[styles.progressStep, styles.progressActive]} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>

        <Text style={styles.title}>Add the nonprofits you care about.</Text>
        <Text style={styles.subtitle}>Search for ones you already support, or discover new ones.</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search nonprofits..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (selectedCategory) setSelectedCategory(null);
            }}
          />
        </View>

        <View style={styles.browseContainer}>
          <Text style={styles.browseText}>
            Not sure where to start?{' '}
            <Text
              style={styles.browseLink}
              onPress={() => setShowCategories(!showCategories)}
            >
              Browse nonprofits
            </Text>
          </Text>
        </View>

        {/* Categories List */}
        {showCategories && (
          <View style={styles.categoriesWrapper}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (item.id === 1 || item.name?.toLowerCase() === 'all') {
                      setSelectedCategory('');
                    } else {
                      setSelectedCategory(item.id.toString());
                    }
                    setSearchQuery('');
                  }}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: item.background_color || '#F3F4F6' },
                    selectedCategory === item.id.toString() && styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: item.text_color || '#374151' },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.categoriesList}
            />
          </View>
        )}
      </View>

      {/* Nonprofit List */}
      <View style={styles.listContainer}>
        {isLoadingCauses ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#1600ff" />
          </View>
        ) : (
          <FlatList
            data={displayCauses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCauseItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No nonprofits found. Try another search.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Footer / Selected Causes Card */}
      <View style={styles.footer}>
        <View style={styles.footerHeader}>
          <View style={styles.footerIconBox}>
            <Heart size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.footerLabel}>YOUR DONATION BOX</Text>
            <Text style={styles.footerSublabel}>{selectedIds.length} nonprofits selected</Text>
          </View>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={selectedCauses}
          renderItem={({ item }) => (
            <View style={styles.selectedNgoAvatar}>
              <Image source={{ uri: item.image }} style={styles.selectedNgoImage} />
              <TouchableOpacity
                style={styles.removeSelectedNgo}
                onPress={() => toggleSelection(item)}
                activeOpacity={0.7}
              >
                <X size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={() => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[...Array(Math.max(0, 5 - selectedCauses.length))].map((_, i) => (
                <View key={`empty-${i}`} style={styles.emptyNgoSlot} />
              ))}
            </View>
          )}
          contentContainerStyle={styles.selectedCausesList}
        />

        <TouchableOpacity
          style={[styles.nextButton, selectedIds.length === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selectedIds.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressStep: {
    height: 4,
    width: (width - 48 - 32) / 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#1600ff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    // lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 10,
    // lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F2',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  browseContainer: {
    marginBottom: 5,
  },
  browseText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  browseLink: {
    color: '#1600ff',
    fontWeight: '700',
  },
  categoriesWrapper: {
    marginHorizontal: -24,
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 24,
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  categoryChipSelected: {
    shadowColor: '#1600ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clearCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    gap: 4,
    marginRight: 8,
  },
  clearCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 220, // Space for footer
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  causeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  causeInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  causeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  causeMission: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    // lineHeight: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1600ff',
    borderColor: '#1600ff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 20,
  },
  footerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  footerIconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#1600ff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1600ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  footerLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    // letterSpacing: 1,
  },
  footerSublabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  selectedCausesList: {
    gap: 8,
    marginBottom: 20,
    paddingLeft: 4,
  },
  selectedNgoAvatar: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'visible',
    marginRight: 8,
    marginTop: 8,
  },
  selectedNgoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10, // Added border radius to the image since parent no longer clips
  },
  removeSelectedNgo: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#6B7280',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 50,
    elevation: 5,
  },
  emptyNgoSlot: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  nextButton: {
    backgroundColor: '#1600ff',
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  skipButton: {
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
  },
});
