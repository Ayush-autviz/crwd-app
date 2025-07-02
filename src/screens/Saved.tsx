import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, Modal, TouchableOpacity, Pressable } from 'react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import { Bookmark } from 'lucide-react-native';
import { PrimaryGrey, SecondaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors';
import { useToast } from '../contexts/ToastContext';
import FilledBookmark from '../components/FilledBookmark';

interface SavedItem {
  id: string;
  name: string;
  description: string;
  image: any; // Using any for require() image type
}

export default function Saved() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const { showToast } = useToast();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([
    {
      id: '1',
      name: "The Red Cross",
      description: "An health organization that...",
      image: require("../assets/images/redcross.png"),
    },
    {
      id: '2',
      name: "St. Judes",
      description: "The leading children's hea...",
      image: require("../assets/images/grocery.jpg"),
    },
    {
      id: '3',
      name: "Women's Healthcare of At...",
      description: "We are Atlanta's #1 healthca...",
      image: require("../assets/images/redcross.png"),
    },
  ]);

  const handleUnsave = (item: SavedItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const confirmUnsave = () => {
    if (selectedItem) {
      setSavedItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
      setModalVisible(false);
      showToast('Item removed from saved');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={{ marginBottom: 16 }}>
        <Bookmark size={48} color={PrimaryGrey} />
      </View>
      <Text style={styles.emptyTitle}>No saved items</Text>
      <Text style={styles.emptySubtitle}>Items you save will appear here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} menu={false} post={false} />
      
      <FlatList 
        data={savedItems}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{ flexGrow: 1 }}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <Image source={item.image} style={styles.itemImage} />
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => handleUnsave(item)}
              style={styles.bookmarkButton}
            >
              <FilledBookmark size={20} color={PrimaryBlue} />
            </TouchableOpacity>
          </View>
        )} 
      />

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Unsave Item</Text>
            <Text style={styles.modalText}>
              Are you sure you want to remove this item from your saved list?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.unsaveButton]} 
                onPress={confirmUnsave}
              >
                <Text style={styles.unsaveButtonText}>Unsave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  itemContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 12,
    color: PrimaryGrey,
  },
  bookmarkButton: {
    padding: 8,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: PrimaryGrey,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: LightGrey,
  },
  unsaveButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: PrimaryGrey,
    fontWeight: '500',
  },
  unsaveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PrimaryGrey,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: SecondaryGrey,
    textAlign: 'center',
  },
});
