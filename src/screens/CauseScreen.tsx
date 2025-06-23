import React, { useRef } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MainHeaderNav from '../components/MainHeaderNav';
import CauseProfileCard from '../components/cause/CauseProfileCard';
import CauseHighlights from '../components/cause/CauseHighlights';
import CauseRecentDonations from '../components/cause/CauseRecentDonations';
import CauseAboutCard from '../components/cause/CauseAboutCard';
import CauseDonateBar from '../components/cause/CauseDonateBar';
import GroupCRWDBottomBar from '../components/groupcrwd/GroupCRWDBottomBar';

export default function CauseScreen() {
  const aboutCardRef = useRef<ScrollView>(null);

  const scrollToAboutCard = () => {
    // Scroll to about section (approximate position)
    aboutCardRef.current?.scrollTo({ y: 800, animated: true });
  };

  return (
    <View style={{ backgroundColor: 'white', flex: 1 }}>
       <MainHeaderNav show menu={false} post={false} />
      <ScrollView 
        ref={aboutCardRef}
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingBottom: 120 }}>
          <CauseProfileCard onLearnMoreClick={scrollToAboutCard} />
          <CauseHighlights />
          <CauseRecentDonations />
          <CauseAboutCard />
        </View>
      </ScrollView>
      <GroupCRWDBottomBar />
    </View>
  );
}
