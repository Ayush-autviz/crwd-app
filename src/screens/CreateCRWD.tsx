import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Share } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import MainHeaderNav from '../components/MainHeaderNav';
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryBlue, SecondaryGrey } from '../Constants/Colors';
import { Bookmark, Heart, Plus } from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';
import { Organization, RECENTS, SUGGESTED } from '../Constants/organizations';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function CreateCRWD() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [bookmarkedOrgs, setBookmarkedOrgs] = useState<string[]>([]);
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [showDescTooltip, setShowDescTooltip] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
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
    // Check fields from top to bottom
    if (name.trim() === '') {
      setToast('Please enter a name for your CRWD');
      setTimeout(() => setToast(null), 4000);
      return;
    }
    if (desc.trim() === '') {
      setToast('Please enter a description for your CRWD');
      setTimeout(() => setToast(null), 4000);
      return;
    }
    if (selectedOrganizations.length === 0) {
      setToast('Please select at least one cause');
      setTimeout(() => setToast(null), 4000);
      return;
    }

    // Proceed if no errors
    setStep(2);
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
              <Heart
                size={16}
                color={isBookmarked ? 'red' : PrimaryGrey}
                fill={isBookmarked ? 'red' : 'none'}
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

  if (step === 2) {
    return (
      <SafeAreaView style={styles.container}>
        <MainHeaderNav menu={false} title={'Create a Giving Circle'} show={true} />
        
        <View style={styles.successContainer}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav menu={false} title={'Create a Giving Circle'} show={true} />
      
      {/* Toast Notification */}
      {toast && (
        <View style={styles.toastContainer}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
            <TouchableOpacity
              onPress={() => setToast(null)}
              style={styles.toastClose}
            >
              <Text style={styles.toastCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Create a CRWD</Text>
        <Text style={styles.subtitle}>Be the inspiration to your community. Choose causes, invite friends, discuss and make an impact together</Text>

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
          placeholder='e.g. Atlanta Food Friends' 
          placeholderTextColor={SecondaryGrey}
          value={name}
          onChangeText={setName}
        />

        <View style={{ position: 'relative', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: PrimaryGrey, fontSize: 16 }}>What brings this group together?</Text>
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
          placeholder='e.g., "We support shelters & meals programs in ATL."' 
          placeholderTextColor={SecondaryGrey}
          value={desc}
          onChangeText={setDesc}
        />

        <Text style={{ color: PrimaryGrey, fontSize: 16 }}>Choose one or more causes for your CRWD</Text>

        <Text style={styles.subsectionTitle}>Select from your causes (if any)</Text>
        {RECENTS.map(renderOrganizationCard)}

        <Text style={styles.subsectionTitle}>Suggested Causes</Text>
        {SUGGESTED.map(renderOrganizationCard)}
      </ScrollView>

      <TouchableOpacity
        onPress={handleCreateCRWD}
        // disabled={selectedOrganizations.length === 0 || name === '' || desc === ''}
        style={[
          styles.donateButton,
          // (selectedOrganizations.length === 0 || name === '' || desc === '') && styles.disabledButton
        ]}
      >
        <Text style={[
          styles.donateButtonText,
          // (selectedOrganizations.length === 0 || name === '' || desc === '') && styles.disabledButtonText
        ]}>
          Create CRWD
        </Text>
      </TouchableOpacity>
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
    color: '#1F2937',
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
    width: 24,
    height: 24,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkedButton: {
    // backgroundColor: 'red',
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
  toastContainer: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  toastClose: {
    marginLeft: 12,
  },
  toastCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
