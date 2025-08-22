import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Share } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import MainHeaderNav from '../components/MainHeaderNav';
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryBlue, SecondaryGrey } from '../Constants/Colors';
import { Bookmark, Plus } from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';
import OneTimeDonation from '../components/donation/OneTimeDonation';
import { Organization, RECENTS, SUGGESTED } from '../Constants/organizations';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function CreateCRWD() {
  const navigation = useNavigation();
  const [count, setcount] = useState(5)
  const [checkout, setCheckout] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [bookmarkedOrgs, setBookmarkedOrgs] = useState<string[]>([]);
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [showDescTooltip, setShowDescTooltip] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);


  const toggleOrganization = (orgId: string) => {
    if (selectedOrganizations.includes(orgId)) {
      setSelectedOrganizations(selectedOrganizations.filter(id => id !== orgId));
    } else {
      setSelectedOrganizations([...selectedOrganizations, orgId]);
    }
  };

  const toggleBookmark = (orgId: string) => {
    if (bookmarkedOrgs.includes(orgId)) {
      setBookmarkedOrgs(bookmarkedOrgs.filter(id => id !== orgId));
    } else {
      setBookmarkedOrgs([...bookmarkedOrgs, orgId]);
    }
  };

  const handleCreateCRWD = () => {
    setShowSuccess(true);
    
    // Fire confetti after modal appears
    setTimeout(() => {
      confettiRef.current?.start();
    }, 300);
  };

  const renderOrganizationCard = (org: Organization) => {
    const isSelected = selectedOrganizations.includes(org.id);
    const isBookmarked = bookmarkedOrgs.includes(org.id);

    return (
      <TouchableOpacity
        key={org.id}
        style={[styles.orgCard, isSelected && styles.selectedOrgCard]}
        onPress={() => toggleOrganization(org.id)}
      >
        <View style={styles.orgHeader}>
          <Image source={{ uri: org.imageUrl }} style={styles.orgImage} />
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{org.name}</Text>
            <Text style={styles.orgDesc}>{org.shortDesc}</Text>
          </View>
          <View style={styles.orgActions}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleBookmark(org.id);
              }}
              style={[styles.actionButton, isBookmarked && styles.bookmarkedButton]}
            >
              <Bookmark
                size={16}
                color={isBookmarked ? '#ffffff' : '#6b7280'}
              />
            </TouchableOpacity>
            <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav menu={false} post={false} show={true} />
      
            <ScrollView style={styles.content}>
        <Text style={styles.title}>Create a CRWD</Text>
        <Text style={styles.subtitle}>Be the inspiration to your community. Choose a causes, invite friends, discuss and make an impact together</Text>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center', marginVertical: 20 }}>
          <View style={{ borderColor: SecondaryGrey, borderWidth: 1, padding: 15, borderRadius: 10 }}>
            <Plus color={SecondaryGrey} size={20} />
          </View>
          <Text style={{ color: SecondaryGrey }}>Choose a photo</Text>
        </View>

        <View style={{ position: 'relative', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: PrimaryGrey, fontSize: 16 }}>Name your CRWD</Text>
            <TouchableOpacity
              onPress={() => setShowNameTooltip(!showNameTooltip)}
              style={{ padding: 8 }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#6c757d',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>?</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Name Tooltip */}
          {showNameTooltip && (
            <View style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: '#000',
              paddingHorizontal: 12,
              marginTop: 40,
              paddingVertical: 8,
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              maxWidth: 250,
              zIndex: 1000,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '500',
                textAlign: 'center'
              }}>
                Keep it short & memorable (&lt;40 characters)
              </Text>
              <View style={{
                position: 'absolute',
                top: -6,
                right: 12,
                width: 0,
                height: 0,
                borderLeftWidth: 6,
                borderRightWidth: 6,
                borderBottomWidth: 6,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: '#000',
              }} />
            </View>
          )}
        </View>

        <TextInput 
          style={{ borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 15, marginBottom: 20 }} 
          placeholder='Atlanta Food Friends' 
          placeholderTextColor={SecondaryGrey}
          value={name}
          onChangeText={setName}
        />

        <View style={{ position: 'relative', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: PrimaryGrey, fontSize: 16 }}>Describe your CRWD</Text>
            <TouchableOpacity
              onPress={() => setShowDescTooltip(!showDescTooltip)}
              style={{ padding: 8 }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#6c757d',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>?</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Description Tooltip */}
          {showDescTooltip && (
            <View style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: '#000',
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginTop: 40,
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              maxWidth: 250,
              zIndex: 1000,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '500',
                textAlign: 'center'
              }}>
                A quick one-liner works best (&lt;160 characters)
              </Text>
              <View style={{
                position: 'absolute',
                top: -6,
                right: 12,
                width: 0,
                height: 0,
                borderLeftWidth: 6,
                borderRightWidth: 6,
                borderBottomWidth: 6,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: '#000',
              }} />
            </View>
          )}
        </View>

        <TextInput 
          style={{ borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 15, marginBottom: 20 }} 
          multiline={true} 
          numberOfLines={2} 
          placeholder='We support shelters & meals programs in ATL.' 
          placeholderTextColor={SecondaryGrey}
          value={desc}
          onChangeText={setDesc}
        />

        {/* <Text style={{ color: SecondaryGrey, marginBottom: 10, fontSize: 16 }}>Enter Suggested Amount</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: LightGrey, padding: 15, borderRadius: 10 }}>
          <Text style={{ color: SecondaryGrey, fontSize: 16 }}>Input amount over $5</Text>
          <View style={{ flexDirection: 'row', gap: 10 , justifyContent: 'space-around', alignContent: 'center', backgroundColor: SecondaryBlue, borderRadius: 10, padding: 15 }}>
            <TouchableOpacity onPress={() => setcount(prev => prev - 1)} disabled={count === 5}>
              <Minus color={PrimaryBlue} size={20} />
            </View>
          </View>
        </View> */}

        <Text style={{ color: PrimaryGrey, fontSize: 16 }}>Choose one or more causes for your CRWD</Text>

        {/* <OneTimeDonation
              setCheckout={setCheckout}
              selectedOrganizations={selectedOrganizations}
              setSelectedOrganizations={setSelectedOrganizations}
              show={false}
            /> */}

<Text style={styles.subsectionTitle}>Select from your causes (if any)</Text>
        {RECENTS.map(renderOrganizationCard)}

        <Text style={styles.subsectionTitle}>Suggested Causes</Text>
        {SUGGESTED.map(renderOrganizationCard)}
      </ScrollView>

      <TouchableOpacity
        onPress={handleCreateCRWD}
        disabled={selectedOrganizations.length === 0 || name === '' || desc === ''}
        style={[
          styles.donateButton,
          (selectedOrganizations.length === 0 || name === '' || desc === '') && styles.disabledButton
        ]}
      >
        <Text style={[
          styles.donateButtonText,
          (selectedOrganizations.length === 0 || name === '' || desc === '') && styles.disabledButtonText
        ]}>
          Create
        </Text>
      </TouchableOpacity>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Confetti Cannon */}
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{ x: -10, y: 0 }}
            autoStart={false}
            colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']}
            fadeOut={true}
          />
          
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSuccess(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <Image 
              source={require('../assets/logo/CRWD.png')} 
              style={styles.successLogo}
              resizeMode="contain"
            />
            <Text style={styles.successTitle}>You've started a CRWD!</Text>
            <View style={styles.successButtons}>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => {
                  Share.share({
                    message: `Join me in my new CRWD "${name}"! We're working together to make a difference. Download the CRWD app to get involved!`,
                    title: `Join my CRWD: ${name}`,
                  });
                }}
              >
                <Text style={styles.inviteButtonText}>Invite Friends</Text>
              </TouchableOpacity>
                              <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => {
                    setShowSuccess(false);
                    navigation.navigate('GroupCRWD' as never);
                  }}
                >
                  <Text style={styles.viewButtonText}>View CRWD</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: PrimaryGrey,
    // textAlign: 'center',
  },
  amountSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  amountTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    marginBottom: 8,
  },
  amountButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  amountInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    width: 80,
  },
  amountHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  selectedSection: {
    marginBottom: 24,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },

  selectedOrgImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  selectedOrgInfo: {
    flex: 1,
  },
  selectedOrgName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedOrgAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  orgCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  selectedOrgCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  orgDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  orgActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  bookmarkedButton: {
    backgroundColor: '#2563eb',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  donateSection: {
    paddingBottom: 40,
  },
  donateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButton: {
    backgroundColor: SecondaryGrey,
    borderWidth: 1,
    borderColor: '#d1d5db',
    opacity: 1,
  },
  disabledButtonText: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  successContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  successLogo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 32,
    textAlign: 'center',
  },
  successButtons: {
    width: '100%',
    gap: 16,
  },
  inviteButton: {
    backgroundColor: PrimaryBlue,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    
  },
  inviteButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  viewButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    width: '100%',
    
  },
  viewButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    // alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
  },
});
