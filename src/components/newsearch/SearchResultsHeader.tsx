import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Search as SearchIcon } from 'lucide-react-native';

interface SearchResultsHeaderProps {
  searchQuery: string;
  onClearSearch: () => void;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

export default function SearchResultsHeader({
  searchQuery,
  onClearSearch,
  onSearchChange,
  onSearch,
}: SearchResultsHeaderProps) {
  return (
    <View style={styles.container}>
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
            onPress={onClearSearch}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        ) : null}
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

