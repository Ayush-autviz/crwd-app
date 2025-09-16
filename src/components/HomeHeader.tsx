import { View, Text, Image, Dimensions, TouchableOpacity, SafeAreaView, TextInput } from 'react-native'
import React from 'react'
import { AlignJustify, ChevronLeft, Plus, Search } from 'lucide-react-native'
import { LightGrey, PrimaryGreen, PrimaryGrey } from '../Constants/Colors';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

    const handlePostPress = () => {
        navigation.navigate('Post');
    };

    const handleMenuPress = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };


    return (
        <SafeAreaView style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginHorizontal: 20, borderBottomWidth: 2, borderBottomColor: LightGrey, }}>
            <Image source={require('../assets/logo/main.png')} style={{ resizeMode: 'contain', width: 90, height: 60 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between', backgroundColor: LightGrey, padding: 10, borderRadius: 40 }}>
                <TextInput
                    placeholder='Find nonprofits'
                    placeholderTextColor={PrimaryGrey}
                    style={{ fontSize: 12, width: '75%' }}
                    />
                    <Search size={20} color={PrimaryGrey} />
                    </View>
            <View style={{ flexDirection: 'row', gap: 20 }}>
               {/* <TouchableOpacity onPress={handlePostPress} disabled={!post}>
                        <Plus color={post ? '#000' : '#fff'} />
                    </TouchableOpacity>  */}

                <TouchableOpacity style={{ backgroundColor: PrimaryGreen, padding: 5, borderRadius: 8 }} onPress={() => navigation.navigate('Circles')}>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>Circles</Text>
                </TouchableOpacity>

                
            
             <View style={{ position: 'relative' }}>
                    <TouchableOpacity onPress={handleMenuPress} disabled={!menu}>
                        <AlignJustify color={menu ? '#000' : '#fff'} />
                    </TouchableOpacity>
                    <View style={{ position: 'absolute', top: -2, right: -6, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' }} />
                </View>
                





            </View>
        </SafeAreaView>
    )
}