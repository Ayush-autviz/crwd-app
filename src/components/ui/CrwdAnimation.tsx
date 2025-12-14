import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

interface CrwdAnimationProps {
  size?: 'sm' | 'md' | 'lg';
}

const { width: screenWidth } = Dimensions.get('window');

const CrwdAnimation: React.FC<CrwdAnimationProps> = ({ 
  size = 'md'
}) => {
  const sizeStyles = {
    sm: {
      circle: { width: 48, height: 48 },
      gap: 8,
    },
    md: {
      circle: { width: 64, height: 64 },
      gap: 12,
    },
    lg: {
      circle: { width: 80, height: 80 },
      gap: 16,
    }
  };

  const currentSize = sizeStyles[size];
  
  // Animation values for each circle
  const blueScale = useRef(new Animated.Value(0)).current;
  const blueOpacity = useRef(new Animated.Value(0)).current;
  const pinkScale = useRef(new Animated.Value(0)).current;
  const pinkOpacity = useRef(new Animated.Value(0)).current;
  const limeScale = useRef(new Animated.Value(0)).current;
  const limeOpacity = useRef(new Animated.Value(0)).current;
  const purpleScale = useRef(new Animated.Value(0)).current;
  const purpleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.15,
              duration: 240, // 8% of 3000ms
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 240,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1,
              duration: 120, // 4% of 3000ms (12% - 8%)
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 120,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(540), // 18% of 3000ms (30% - 12%)
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 0.95,
              duration: 100, // 3.33% of 3000ms (33.33% - 30%)
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.9,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 0,
              duration: 80, // 2.67% of 3000ms (36% - 33.33%)
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 80,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(1920), // 64% of 3000ms (100% - 36%)
        ])
      );
    };

    const blueAnim = createAnimation(blueScale, blueOpacity, 0);
    const pinkAnim = createAnimation(pinkScale, pinkOpacity, 300);
    const limeAnim = createAnimation(limeScale, limeOpacity, 600);
    const purpleAnim = createAnimation(purpleScale, purpleOpacity, 900);

    blueAnim.start();
    pinkAnim.start();
    limeAnim.start();
    purpleAnim.start();

    return () => {
      blueAnim.stop();
      pinkAnim.stop();
      limeAnim.stop();
      purpleAnim.stop();
    };
  }, []);

  const Circle = ({ 
    scale, 
    opacity, 
    color 
  }: { 
    scale: Animated.Value; 
    opacity: Animated.Value; 
    color: string;
  }) => (
    <Animated.View
      style={[
        {
          width: currentSize.circle.width,
          height: currentSize.circle.height,
          borderRadius: currentSize.circle.width / 2,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );

  return (
    <View style={[styles.container, { gap: currentSize.gap }]}>
      {/* Top row */}
      <View style={[styles.row, { gap: currentSize.gap }]}>
        <Circle scale={blueScale} opacity={blueOpacity} color="#0000FF" />
        <Circle scale={pinkScale} opacity={pinkOpacity} color="#FF3366" />
      </View>
      
      {/* Bottom row */}
      <View style={[styles.row, { gap: currentSize.gap }]}>
        <Circle scale={limeScale} opacity={limeOpacity} color="#ADFF2F" />
        <Circle scale={purpleScale} opacity={purpleOpacity} color="#A855F7" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CrwdAnimation;

