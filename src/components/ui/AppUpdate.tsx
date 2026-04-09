import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Linking } from 'react-native';

const AppUpdate = () => {
    const handleUpdate = () => {
        const url = Platform.OS === 'ios'
            ? 'https://apps.apple.com/in/app/crwd/id6748994882'
            : 'https://apps.apple.com/in/app/crwd/id6748994882'
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../../assets/newLogo/FullLogo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <View style={styles.textContainer}>
                    <Text style={styles.title}>A new version of CRWD is available</Text>
                    <Text style={styles.subtitle}>Update to get the latest fixes and improvements</Text>
                </View>
            </View>

            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.button}
                onPress={handleUpdate}
            >
                <Text style={styles.buttonText}>Update now</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Light background from screenshot
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: '25%',
        paddingBottom: 50,
    },
    content: {
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 60,
        marginBottom: 30,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '800', // Heavy weight for the headline
        color: '#111827',
        textAlign: 'center',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 17,
        color: '#8E94A4', // Muted gray color from screenshot
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#2222EE', // CRWD blue
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default AppUpdate;
