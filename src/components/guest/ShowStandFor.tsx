import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

export default function ShowStandFor() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Be Someone Who Shows Up</Text>

                <Text style={styles.description}>
                    Your profile shows what you stand for. Share the causes you support, inspire your community, and turn caring into action.
                </Text>

                <Image
                    // Using learn2.jpeg as placeholder for stand.jpeg
                    source={require('../../assets/learn/stand.jpeg')}
                    style={styles.image}
                    resizeMode="contain"
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('OnBoard' as never)}
                >
                    <Text style={styles.buttonText}>See How It Works</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        paddingVertical: 48,
        paddingHorizontal: 16,
    },
    content: {
        alignSelf: 'center',
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
        // lineHeight: 32,
        maxWidth: 500,
    },
    description: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 32,
        textAlign: 'center',
        maxWidth: 500,
        lineHeight: 24,
    },
    image: {
        width: '100%',
        height: 300,
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#1600ff',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 9999,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
