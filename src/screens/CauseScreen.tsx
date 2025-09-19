import React, { useRef } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PrimaryBlue, SecondaryBlue, SecondaryGrey } from '../Constants/Colors';
import MainHeaderNav from '../components/MainHeaderNav';
import CauseProfileCard from '../components/cause/CauseProfileCard';
import CauseRecentDonations from '../components/cause/CauseRecentDonations';
import CauseAboutCard from '../components/cause/CauseAboutCard';
import GroupCRWDBottomBar from '../components/groupcrwd/GroupCRWDBottomBar';

export default function CauseScreen() {
  const aboutCardRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  const scrollToAboutCard = () => {
    // Scroll to about section (approximate position)
    aboutCardRef.current?.scrollTo({ y: 800, animated: true });
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: 'check out this Nonprofit',
        title: 'Helping Humanity - CRWD',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share cause');
    }
  };

  const handleDonate = () => {
    navigation.navigate('DrawerNav' as never, { 
      screen: 'MainTabs',
      params: { screen: 'Donation' }
    } as never);
  };

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
        <View style={{ paddingBottom: 120 }}>
          <CauseProfileCard onLearnMoreClick={scrollToAboutCard} />
          <CauseRecentDonations showEmpty={true} />
          <View style={{ paddingTop: 24 }}>
            <CauseAboutCard />
          </View>
        </View>
      </ScrollView>
      {/* <GroupCRWDBottomBar /> */}
    </SafeAreaView>
  );
}
