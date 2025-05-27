import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const Footer = ({children}: {children: React.ReactNode}) => {
  return (
    
      <View style={styles.overlay}>
        {/* <View style={styles.overlayContent}>
          <View style={styles.overlayContentTop}>
            <Text style={styles.overlayContentPriceBefore}>$399</Text>
            <Text style={styles.overlayContentPrice}>$299/mo</Text>
          </View>
          <Text style={styles.overlayContentTotal}>
            30% discount applied
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            // handle onPress
          }}>
          <View style={styles.btn}>
            <Text style={styles.btnText}>Get Started</Text>
          </View>
        </TouchableOpacity> */}
        {children}
      </View>
  )
}

export default Footer

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 48,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
      },
      overlayContent: {
        flexDirection: 'column',
        alignItems: 'flex-start',
      },
      overlayContentTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 2,
      },
      overlayContentPriceBefore: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '600',
        color: '#8e8e93',
        marginRight: 4,
        textDecorationLine: 'line-through',
        textDecorationColor: '#8e8e93',
        textDecorationStyle: 'solid',
      },
      overlayContentPrice: {
        fontSize: 21,
        lineHeight: 26,
        fontWeight: '700',
        color: '#000',
      },
      overlayContentTotal: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
        color: '#4c6cfd',
        letterSpacing: -0.07,
        textDecorationLine: 'underline',
        textDecorationColor: '#4c6cfd',
        textDecorationStyle: 'solid',
      },
      /** Button */
      btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        backgroundColor: '#007aff',
        borderColor: '#007aff',
      },
      btnText: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '600',
        color: '#fff',
      },
})