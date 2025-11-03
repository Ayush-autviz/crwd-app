import React, { useRef, useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Share, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { getCauseById } from '../services/api/crwd';
import { PrimaryBlue, SecondaryBlue, SecondaryGrey } from '../Constants/Colors';
import MainHeaderNav from '../components/MainHeaderNav';
import CauseProfileCard from '../components/cause/CauseProfileCard';
import CauseRecentDonations from '../components/cause/CauseRecentDonations';
import CauseAboutCard from '../components/cause/CauseAboutCard';
import GroupCRWDBottomBar from '../components/groupcrwd/GroupCRWDBottomBar';
import { useToast } from '../contexts/ToastContext';

export default function CauseScreen() {
  const aboutCardRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  
  // Get cause ID from route params or use default
  const causeId = (route.params as any)?.causeId || '';
  
  // Fetch cause data using React Query
  const { data: causeData, isLoading: isLoadingCause, error: causeError } = useQuery({
    queryKey: ['cause', causeId],
    queryFn: () => getCauseById(causeId),
    enabled: !!causeId,
  });

  const scrollToAboutCard = () => {
    // Scroll to about section (approximate position)
    aboutCardRef.current?.scrollTo({ y: 800, animated: true });
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this Nonprofit: ${causeData?.name || 'Cause'}`,
        title: `${causeData?.name || 'Helping Humanity'} - CRWD`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share cause');
    }
  };

  const handleDonate = () => {
    (navigation as any).navigate('DrawerNav', {
      screen: 'Donation',
      params: {
        initialTab: 'onetime',
        preselectedItem: causeData ? {
          id: causeData.id.toString(),
          type: 'cause' as const,
          data: causeData
        } : undefined,
        activeTab: 'nonprofits'
      }
    });
  };

  // Show loading state
  if (isLoadingCause) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
        <MainHeaderNav show={true} menu={false} title={'Nonprofit'}/>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>
            Loading cause details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (causeError) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
        <MainHeaderNav show={true} menu={false} title={'Nonprofit'}/>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#ef4444' }}>
            Failed to load cause details
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <MainHeaderNav show={true} menu={false} title={'Nonprofit'}/>
      
      {/* Action Buttons Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        paddingTop: 24, 
        paddingBottom: 16, 
        paddingHorizontal: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
      }}>
        <View style={{ 
          backgroundColor: SecondaryBlue, 
          paddingHorizontal: 8, 
          paddingVertical: 4, 
          borderRadius: 8 
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: PrimaryBlue }}>
            Nonprofit
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          style={{ 
            borderWidth: 1, 
            borderColor: '#d1d5db', 
            paddingHorizontal: 16, 
            paddingVertical: 8, 
            borderRadius: 8,
            backgroundColor: SecondaryGrey,
          }}
          onPress={handleShare}
        >
          <Text style={{ color: 'black', fontSize: 14, fontWeight: '500' }}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ 
            backgroundColor: PrimaryBlue, 
            paddingHorizontal: 16, 
            paddingVertical: 8, 
            borderRadius: 8 
          }}
          onPress={handleDonate}
        >
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>Donate</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={aboutCardRef}
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingBottom: 30 }}>
          <CauseProfileCard 
            onLearnMoreClick={scrollToAboutCard} 
            causeData={causeData}
          />
          <CauseRecentDonations 
            donations={causeData?.recent_donations} 
            showEmpty={!causeData?.recent_donations || causeData.recent_donations.length === 0} 
          />
          <View style={{ paddingTop: 24 }}>
            <CauseAboutCard causeData={causeData} />
          </View>
        </View>
      </ScrollView>
      {/* <GroupCRWDBottomBar /> */}
    </SafeAreaView>
  );
}
