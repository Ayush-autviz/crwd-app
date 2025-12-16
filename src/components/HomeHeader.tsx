import { View, Text, Image, Dimensions, TouchableOpacity, SafeAreaView, TextInput } from 'react-native'
import React from 'react'
import { AlignJustify, Bell, ChevronLeft, Plus, Search, User } from 'lucide-react-native'
import { LightGrey, PrimaryGreen, PrimaryGrey } from '../Constants/Colors';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getUnreadCount } from '../services/api/notification';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/store';
import { Settings } from 'lucide-react-native';

type RootStackParamList = {
    Post: undefined;
    Donation: undefined;
    // ... other screens
    Circles: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeHeader({ show = false, menu = true, post = true }) {
    const navigation = useNavigation<NavigationProp>();
    const screenWidth = Dimensions.get('window').width;
    const imageWidth = screenWidth * 0.25;
    const { user: currentUser } = useAuthStore();

    const handlePostPress = () => {
        navigation.navigate('Post');
    };

    const handleMenuPress = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const { data: unreadCount } = useQuery({
        queryKey: ['unreadCount'],
        queryFn: getUnreadCount,
        enabled: !!currentUser?.id,
    });
    console.log(unreadCount?.data, 'unreadCount.data');

    return (
        <SafeAreaView style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 5, alignItems: 'center', marginHorizontal: 10, borderBottomWidth: 2, borderBottomColor: LightGrey, }}>
            <Image source={require('../assets/newLogo/FullLogo.png')} style={{ resizeMode: 'contain', width: 100, height: 50 }} />
            {/* <TouchableOpacity onPress={() => navigation.navigate('Search')} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between', backgroundColor: LightGrey, paddingHorizontal: 10, paddingVertical:5, borderRadius: 16 }}>
                <TextInput
                    placeholder='Find nonprofits'
                    placeholderTextColor={PrimaryGrey}
                    style={{ fontSize: 12,  }}
                    editable={false}
                    onPress={() => navigation.navigate('Search')}
                    />
                    <Search size={20} color={PrimaryGrey} />
            </TouchableOpacity> */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {/* <TouchableOpacity onPress={handlePostPress} disabled={!post}>
                        <Plus color={post ? '#000' : '#fff'} />
                    </TouchableOpacity>  */}

                {/* <TouchableOpacity style={{ backgroundColor: PrimaryGreen, padding: 5, borderRadius: 8 }} onPress={() => navigation.navigate('Circles')}>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>Collectives</Text>
                </TouchableOpacity> */}

                {currentUser?.id && (
                    <>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Activity' as never)}
                            activeOpacity={0.8}
                            style={{ padding: 6, position: 'relative', backgroundColor: '#FFE6E6', borderRadius: 100 }}
                        >
                            <Bell size={20} color="#111827" />
                            {unreadCount?.data > 0 && currentUser?.id && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -6,
                                        backgroundColor: 'red',
                                        borderRadius: 8,
                                        minWidth: 16,
                                        height: 16,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingHorizontal: 3,
                                    }}
                                >
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>{unreadCount?.data}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* <View style={{ position: 'relative' }}>
                        <TouchableOpacity onPress={handleMenuPress} disabled={!menu}>
                        <AlignJustify color={menu ? '#000' : '#fff'} />
                         </TouchableOpacity>
                         {unreadCount?.data > 0 && currentUser?.id && (
                            <View style={{ position: 'absolute', top: -2, right: -6, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' }} />
                        )}
                        </>
                        </View> */}


                        <TouchableOpacity onPress={() => navigation.navigate('NewSettings' as never)} >
                            <Settings size={24} color="#111827" />
                        </TouchableOpacity>

                    </>
                )}




            </View>
        </SafeAreaView>
    )
}