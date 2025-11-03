import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Share, ActivityIndicator } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import MainHeaderNav from '../components/MainHeaderNav';
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryBlue, SecondaryGrey } from '../Constants/Colors';
import { Bookmark, Heart, Plus, Search, X, Check, User } from 'lucide-react-native';
import { TextInput } from 'react-native';
// import { Organization, RECENTS, SUGGESTED } from '../Constants/organizations';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createCollective, getCausesBySearch } from '../services/api/crwd';
import { getFavoriteCauses } from '../services/api/social';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/store';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateCRWD() {
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const { user: currentUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [selectedCausesData, setSelectedCausesData] = useState<any[]>([]);
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [showDescTooltip, setShowDescTooltip] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [createdCollective, setCreatedCollective] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const confettiRef = useRef<ConfettiCannon>(null);

  // Load saved form data from AsyncStorage on mount
  React.useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('createCrwd_name');
        const savedDesc = await AsyncStorage.getItem('createCrwd_desc');
        if (savedName) setName(savedName);
        if (savedDesc) setDesc(savedDesc);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    loadSavedData();
  }, []);

  // Save form data to AsyncStorage whenever it changes
  React.useEffect(() => {
    const saveData = async () => {
      try {
        if (name) {
          await AsyncStorage.setItem('createCrwd_name', name);
        } else {
          await AsyncStorage.removeItem('createCrwd_name');
        }
      } catch (error) {
        console.error('Error saving name:', error);
      }
    };
    saveData();
  }, [name]);

  React.useEffect(() => {
    const saveData = async () => {
      try {
        if (desc) {
          await AsyncStorage.setItem('createCrwd_desc', desc);
        } else {
          await AsyncStorage.removeItem('createCrwd_desc');
        }
      } catch (error) {
        console.error('Error saving desc:', error);
      }
    };
    saveData();
  }, [desc]);

  // Reset to step 1 when screen comes back into focus after navigating away
  useFocusEffect(
    React.useCallback(() => {
      // Reset form when screen comes back into focus if we were on step 2
      // This ensures that when user navigates back, they see a fresh form
      return () => {
        // Cleanup function - reset when screen loses focus
        // But we'll reset immediately when buttons are clicked instead
      };
    }, [])
  );

  // Get causes with search and category filtering
  const { data: causesData, isLoading: isCausesLoading } = useQuery({
    queryKey: ['causes', searchTrigger],
    queryFn: () => {
      return getCausesBySearch(searchQuery, '', 1);
    },
    enabled: true,
  });

  // Get favorite causes
  const { data: favoriteCauses, isLoading: isLoadingFavoriteCauses } = useQuery({
    queryKey: ['favoriteCauses'],
    queryFn: () => getFavoriteCauses(),
    enabled: true,
  });


  console.log('favoriteCauses', favoriteCauses);
  console.log('causesData', causesData);

  // Create collective mutation
  const createCollectiveMutation = useMutation({
    mutationFn: createCollective,
    onSuccess: async (response) => {
      console.log('Create collective successful:', response);
      // Clear saved form data on successful creation
      try {
        await AsyncStorage.removeItem('createCrwd_name');
        await AsyncStorage.removeItem('createCrwd_desc');
      } catch (error) {
        console.error('Error clearing saved data:', error);
      }
      setCreatedCollective(response);
      setStep(2);
      setShowSuccess(true);
      confettiRef.current?.start();
      setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
    },
    onError: (error: any) => {
      console.error('Create collective error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create collective';
      setToast(errorMessage);
      setTimeout(() => setToast(null), 4000);
    },
  });

  const handleCauseToggle = (cause: any, isFavorite: boolean = false) => {
    const causeId = isFavorite ? cause.cause?.id : cause.id;
    const causeData = isFavorite 
      ? { ...cause.cause, id: cause.cause.id, image: cause.image, logo: cause.image } 
      : { ...cause, id: cause.id, image: cause.image || cause.logo, logo: cause.logo || cause.image };
    
    setSelectedCauses((prev) => {
      const isSelected = prev.includes(causeId);
      const newSelection = isSelected
        ? prev.filter((id) => id !== causeId)
        : [...prev, causeId];
      
      // Update cause data array
      setSelectedCausesData((prevData) => {
        if (isSelected) {
          return prevData.filter((c) => c.id !== causeId);
    } else {
          // Check if cause already exists to avoid duplicates
          const exists = prevData.some((c) => c.id === causeId);
          if (!exists) {
            return [...prevData, causeData];
          }
          return prevData;
        }
      });
      
      return newSelection;
    });
  };

  const handleRemoveSelectedCause = (causeId: string) => {
    setSelectedCauses((prev) => prev.filter((id) => id !== causeId));
    setSelectedCausesData((prevData) => prevData.filter((c) => c.id !== causeId));
  };

  // const toggleBookmark = (orgId: string) => {
  //   if (bookmarkedOrgs.includes(orgId)) {
  //     setBookmarkedOrgs(bookmarkedOrgs.filter(id => id !== orgId));
  //   } else {
  //     setBookmarkedOrgs([...bookmarkedOrgs, orgId]);
  //   }
  // };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    // Don't trigger API call on every keystroke
  };

  const handleSearchSubmit = () => {
    // Trigger API call with search query
      setSearchTrigger(prev => prev + 1);
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
    if (selectedCauses.length === 0) {
      setToast('Please select at least one cause');
      setTimeout(() => setToast(null), 4000);
      return;
    }

    // Create collective via API
    createCollectiveMutation.mutate({
      name: name.trim(),
      description: desc.trim(),
      cause_ids: selectedCauses,
    });
  };

  if (!currentUser?.id) {
            return (
            <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav title={'Create a CRWD'} show={true} />
                <View style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    paddingHorizontal: 32,
                    backgroundColor: 'white'
                }}>
                    {/* Icon */}
                    <View style={{
                        width: 80,
                        height: 80,
                        backgroundColor: '#dbeafe',
                        borderRadius: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 24
                    }}>
                        <User size={40} color={PrimaryBlue} />
                    </View>
                    
                    {/* Title */}
                    <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: 12,
                        textAlign: 'center'
                    }}>
                        Sign in to create a CRWD
                    </Text>
                    
                    {/* Description */}
                    <Text style={{
                        fontSize: 16,
                        color: '#6b7280',
                        marginBottom: 32,
                        textAlign: 'center',
                        lineHeight: 24
                    }}>
                        Sign in to create a CRWD, manage your causes, and connect with your community.
                    </Text>
                    
                    {/* CTA Button */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login' as never)}
                        style={{
                            backgroundColor: '#2563eb',
                            paddingHorizontal: 32,
                            paddingVertical: 12,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                            Sign In to Continue
                        </Text>
                    </TouchableOpacity>
                    
                    {/* Additional Info */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ClaimProfile' as never)}
                      >
                    <Text style={{
                        fontSize: 14,
                        color: '#6b7280',
                        marginTop: 24,
                        textAlign: 'center'
                    }}>
                        Don't have an account? 
                        <Text style={{ color: '#2563eb', fontWeight: '500' }}> Create one here</Text>
                    </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
  }


  if (step === 2) {
    return (
      <SafeAreaView style={styles.container}>
        <MainHeaderNav menu={false} title={'Create a CRWD'} show={true} />
        
        <View style={styles.successContainer}>
          <Image 
            source={require('../assets/logo/CRWD.png')} 
            style={styles.successLogo}
            resizeMode="contain"
          />
          <Text style={styles.successTitle}>You've started a CRWD!</Text>
          {createdCollective && (
            <View style={{ marginBottom: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: PrimaryBlue, marginBottom: 5 }}>
                {createdCollective.name}
              </Text>
              <Text style={{ fontSize: 14, color: PrimaryGrey, textAlign: 'center', paddingHorizontal: 20 }}>
                {createdCollective.description}
              </Text>
            </View>
          )}
          <View style={styles.successButtons}>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={async () => {
                try {
                  await Share.share({
                  message: `Join me in my new CRWD "${name}"! We're working together to make a difference. Download the CRWD app to get involved!`,
                  title: `Join my CRWD: ${name}`,
                });
                } catch (error) {
                  console.error('Error sharing:', error);
                }
                // Reset form and go back to step 1 after sharing
                setStep(1);
                setName('');
                setDesc('');
                setSelectedCauses([]);
                setSelectedCausesData([]);
                setCreatedCollective(null);
              }}
            >
              <Text style={styles.inviteButtonText}>Invite Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => {
                if (createdCollective?.id) {
                  // Reset form before navigating
                  setStep(1);
                  setName('');
                  setDesc('');
                  setSelectedCauses([]);
                  setSelectedCausesData([]);
                  setCreatedCollective(null);
                  navigation.navigate('GroupCRWD' as never, { collectiveId: createdCollective.id.toString() } as never);
                }
              }}
            >
              <Text style={styles.viewButtonText}>View Collective</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav menu={false} title={'Create a CRWD Collective'} show={true} />
      
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

        {/* Selected Causes Section */}
        {selectedCausesData.length > 0 && (
          <View style={styles.selectedCausesContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e40af' }}>
                Selected Causes ({selectedCausesData.length})
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {selectedCausesData.map((cause) => (
                <View key={cause.id} style={styles.selectedCauseTag}>
                  <Avatar size={24}>
                    <AvatarImage src={cause.image || cause.logo} />
                    <AvatarFallback style={{ backgroundColor: '#dbeafe' }} textStyle={{ color: '#2563eb', fontWeight: '600' }}>
                      {cause.name?.charAt(0)?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827', marginLeft: 4 }}>{cause.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveSelectedCause(cause.id)}
                    style={{ marginLeft: 4 }}
                  >
                    <X size={14} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.causesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select from your causes (if any)</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NonProfitInterests' as never)}>
              <Plus size={16} color={PrimaryBlue} />
            </TouchableOpacity>
          </View>

          {isLoadingFavoriteCauses ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={PrimaryBlue} />
              <Text style={styles.loadingText}>Loading your causes...</Text>
            </View>
          ) : favoriteCauses?.results?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No favorite causes found</Text>
            </View>
          ) : (
            favoriteCauses?.results?.map((cause: any) => {
              const isSelected = selectedCauses.includes(cause.cause?.id);
              return (
                <TouchableOpacity
                  key={cause.cause.id}
                  style={[styles.orgCard, isSelected && styles.selectedOrgCard]}
                  onPress={() => handleCauseToggle(cause, true)}
                >
                  <View style={styles.orgHeader}>
                    <Avatar size={40}>
                      <AvatarImage src={cause.image} />
                      <AvatarFallback style={{ backgroundColor: '#dbeafe' }} textStyle={{ color: '#2563eb', fontWeight: '600' }}>
                        {cause.cause.name?.charAt(0)?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <View style={styles.orgInfo}>
                      <Text style={styles.orgName}>{cause.cause.name}</Text>
                      <Text style={styles.orgDesc}>{cause.cause.mission || 'Building communities'}</Text>
                    </View>
                    <View style={styles.orgActions}>
                      <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                        {isSelected && <Check size={16} color="#ffffff" />}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <Text style={styles.sectionTitle}>Suggested Causes</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search causes or nonprofits (press Enter to search)"
              placeholderTextColor={SecondaryGrey}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
            />
          </View>

          {isCausesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={PrimaryBlue} />
            </View>
          ) : (() => {
            // Filter out favorite causes from search results
            const favoriteCauseIds = new Set(
              (favoriteCauses?.results || [])
                .map((fav: any) => {
                  const id = fav.cause?.id;
                  return id ? String(id) : null;
                })
                .filter((id: any) => id !== null)
            );
            
            const filteredCauses = (causesData?.results || []).filter((cause: any) => {
              const causeId = cause?.id ? String(cause.id) : null;
              return causeId && !favoriteCauseIds.has(causeId);
            });

            if (filteredCauses.length === 0) {
              return (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No causes found</Text>
            </View>
              );
            }

            return filteredCauses.slice(0, 10).map((cause: any) => {
              const isSelected = selectedCauses.includes(cause.id);
              return (
                <TouchableOpacity
                  key={cause.id}
                  style={[styles.orgCard, isSelected && styles.selectedOrgCard]}
                  onPress={() => handleCauseToggle(cause, false)}
                >
                  <View style={styles.orgHeader}>
                    <Avatar size={40}>
                      <AvatarImage src={cause.image || cause.logo} />
                      <AvatarFallback style={{ backgroundColor: '#dbeafe' }} textStyle={{ color: '#2563eb', fontWeight: '600' }}>
                        {cause.name?.charAt(0)?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <View style={styles.orgInfo}>
                      <Text style={styles.orgName}>{cause.name}</Text>
                      <Text style={styles.orgDesc}>{cause.mission || cause.description || `Building ${cause.name.toLowerCase()} communities`}</Text>
                    </View>
                    <View style={styles.orgActions}>
                      <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                        {isSelected && <Check size={16} color="#ffffff" />}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={handleCreateCRWD}
        disabled={createCollectiveMutation.isPending}
        style={[
          styles.donateButton,
          createCollectiveMutation.isPending && styles.disabledButton
        ]}
      >
        {createCollectiveMutation.isPending ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="white" />
            <Text style={[styles.donateButtonText, { marginLeft: 8 }]}>
              Creating...
            </Text>
          </View>
        ) : (
          <Text style={styles.donateButtonText}>
            Create CRWD
          </Text>
        )}
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
  selectedCausesContainer: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedCauseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
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
  // API integration styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: PrimaryGrey,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: PrimaryGrey,
    fontSize: 14,
  },
  causesContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: PrimaryBlue,
    marginBottom: 8,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderWidth: 0,
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
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
  orgInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orgName: {
    fontSize: 14,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkedBox: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
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
    opacity: 0.5,
  },
});
