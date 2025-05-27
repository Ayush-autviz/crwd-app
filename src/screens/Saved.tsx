import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image } from 'react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import { Bookmark } from 'lucide-react-native';
import { PrimaryGrey, SecondaryGrey } from '../Constants/Colors';

export default function Saved() {

  // Sample data for suggested causes
  const suggestedCauses = [
    {
      name: "The Red Cross",
      description: "An health organization that...",
      image: require("../assets/images/redcross.png"),
      // imageUrl: "/redcross.png",
    },
    {
      name: "St. Judes",
      description: "The leading children's hea...",
      image: require("../assets/images/grocery.jpg"),
      // imageUrl: "/grocery.jpg",
    },
    {
      name: "Women's Healthcare of At...",
      description: "We are Atlanta's #1 healthca...",
      image: require("../assets/images/redcross.png"),
      // image: "/redcross.png",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} />
      <FlatList data={suggestedCauses}
        renderItem={({ item }) => (
          <View style={{ marginTop: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image source={item.image} style={{ width: 40, height: 40, borderRadius: 20, }} />
              <View>
                <Text style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: PrimaryGrey }}>{item.description}</Text>
              </View>
            </View>
            <Bookmark color={PrimaryGrey}/>
          </View>
        )} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
