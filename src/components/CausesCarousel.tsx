import * as React from "react";
import { Dimensions, Text, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { LightGrey, PrimaryBlue, SecondaryBlue, TertiaryBlue, PrimaryGrey } from "../Constants/Colors";
 
const data = [{
    heading: 'Pick your Causes',
    subHeading: 'Search or explore non-profits by category or local Circles.',
    backgroundColor: '#3730A3' // indigo-800
},
{
    heading: 'Set One Donation',
    subHeading: 'Decide your amount once - it splits across your chosen causes.',
    backgroundColor: '#15803D' // lime-700
},
{
    heading: 'Give Together',
    subHeading: 'Learn Mores to give alongside others and see your shared impact.',
    backgroundColor: '#DC2626' // red-600
}];

const width = Dimensions.get("window").width;

export default function CausesCarousel() {
    const ref = React.useRef<ICarouselInstance>(null);
    const progress = useSharedValue<number>(0);
    
    const onPressPagination = (index: number) => {
      ref.current?.scrollTo({
        /**
         * Calculate the difference between the current index and the target index
         * to ensure that the carousel scrolls to the nearest index
         */
        count: index - progress.value,
        animated: true,
      });
    };
   
    return (
      <View style={{ 
        flex: 1, 
        marginTop: 10, 
        // paddingHorizontal: 20,
      }}>
        <Carousel
          ref={ref}
          width={width - 40}
          autoPlay
          autoPlayInterval={3000}
          height={130}
          data={data}
          onProgressChange={progress}
          renderItem={({item, index }) => (
            <View
              style={{
                flex: 1,
                backgroundColor: item.backgroundColor,
                borderRadius: 16,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
                elevation: 5,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}>
                <Text style={{ 
                  fontSize: 20, 
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: 8,
                  textAlign: 'center',
                }}>
                  {item.heading}
                </Text>
                <Text style={{ 
                  fontSize: 16, 
                  color: 'white',
                  lineHeight: 22,
                  textAlign: 'center',
                  opacity: 0.9,
                }}>
                  {item.subHeading}
                </Text>
              </View>
            </View>
          )}
        />
   
        <Pagination.Basic
          progress={progress}
          data={data}
          dotStyle={{ 
            backgroundColor: '#d1d5db', 
            borderRadius: 50,
            width: 8,
            height: 8,
          }}
          activeDotStyle={{ 
            backgroundColor: PrimaryGrey,
          }}
          containerStyle={{ 
            gap: 8, 
            marginTop: 24,
            alignItems: 'center',
            alignSelf: 'flex-end',
            marginRight: 10,
          }}
          onPress={onPressPagination}
        />
      </View>
  )
}