import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Search as SearchIcon, ArrowLeft } from 'lucide-react-native';

interface SearchResultsHeaderProps {
  searchQuery: string;
  onClearSearch: () => void;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onBack?: () => void;
}

export default function SearchResultsHeader({
  searchQuery,
  onClearSearch,
  onSearchChange,
  onSearch,
  onBack,
}: SearchResultsHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
        )} */}
        <View style={styles.inputContainer}>
          <SearchIcon size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  inputContainer: {
    flex: 1,
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
    paddingRight: 40,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
});

