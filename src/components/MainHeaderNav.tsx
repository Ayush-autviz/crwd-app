import { View, Text, Image, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native'
import React from 'react'
import { AlignJustify, ChevronLeft, Plus } from 'lucide-react-native'
import { LightGrey, PrimaryGreen, PrimaryGrey, SecondaryGrey } from '../Constants/Colors';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Post: undefined;
    Donation: undefined;
    // ... other screens
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MainHeaderNav({ show = false, menu = true, postButton = false, title }) {
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
        <SafeAreaView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#E5E7EB', height: 60, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', gap: 10, marginLeft: 16 }}>
                {show &&
                    <TouchableOpacity disabled={!show} onPress={() => navigation.goBack()} style={{ marginTop: 1 }}>
                        <ChevronLeft color={show ? '#000' : '#fff'} />
                    </TouchableOpacity>
                }

                {title && <Text style={{ fontSize: 20, fontFamily: 'Outfit-SemiBold' }}>{title}</Text>}
                {/* <TouchableOpacity>
                        <AlignJustify color="#fff" />
                    </TouchableOpacity> */}


            </View>
            {/* <Image source={require('../assets/logo/logo3.webp')} style={{ resizeMode: 'center', width: imageWidth }} /> */}
            {/* <Image source={require('../assets/logo/main.png')} style={{ resizeMode: 'contain', width: 70, height: 60 }} /> */}

            <View style={{ flexDirection: 'row', gap: 10, marginRight: 16 }}>
                {/* <TouchableOpacity onPress={handlePostPress} disabled={!post}>
                        <Plus color={post ? '#000' : '#fff'} />
                    </TouchableOpacity> */}
                {postButton &&
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Post' as never)}
                        style={{ padding: 8, backgroundColor: '#E5E7EB', borderRadius: 8 }}
                    >
                        <Text style={{ fontSize: 14, }}>Post Something</Text>
                    </TouchableOpacity>
                }

                {menu &&
                <></>
                    // <TouchableOpacity onPress={handleMenuPress} disabled={!menu}>
                    //     <AlignJustify color={menu ? '#000' : '#fff'} />
                    // </TouchableOpacity>

                }




            </View>
        </SafeAreaView>
    )
}