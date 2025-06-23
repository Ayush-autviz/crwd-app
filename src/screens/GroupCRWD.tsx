import React from 'react';
import { View, ScrollView } from 'react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import GroupCRWDHeader from '../components/groupcrwd/GroupCRWDHeader';
import GroupCRWDSuggested from '../components/groupcrwd/GroupCRWDSuggested';
import GroupCRWDUpdates from '../components/groupcrwd/GroupCRWDUpdates';
import GroupCRWDEvent from '../components/groupcrwd/GroupCRWDEvent';
import GroupCRWDBottomBar from '../components/groupcrwd/GroupCRWDBottomBar';

export default function GroupCRWD() {
  return (
    <View style={{ backgroundColor: 'white', flex: 1 }}>
       <MainHeaderNav show menu={false} post={false} />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <GroupCRWDHeader />
        <GroupCRWDSuggested />
        <GroupCRWDUpdates />
        <GroupCRWDEvent />
        <View style={{ height: 100 }} />
      </ScrollView>
      <GroupCRWDBottomBar />
    </View>
  );
}
