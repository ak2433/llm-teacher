import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#4c86f9', '#49a84c', '#f6bb02', '#f6bb02', '#2196f3'];
const DELAYS = [0, 100, 200, 300, 400];
const DURATION = 900;
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

export const ThinkingLoader = () => {
  const scaleYs = useRef(COLORS.map(() => new Animated.Value(0.05))).current;

  useEffect(() => {
    const animations = scaleYs.map((anim, i) =>
      Animated.sequence([
        Animated.delay(DELAYS[i]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: DURATION * 0.2,
              easing: EASE_IN_OUT,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.05,
              duration: DURATION * 0.2,
              easing: EASE_IN_OUT,
              useNativeDriver: true,
            }),
            Animated.delay(DURATION * 0.6),
          ]),
        ),
      ]),
    );

    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.container}>
      {COLORS.map((color, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              transform: [{ scaleY: scaleYs[i] }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 100,
    gap: 6,
  },
  bar: {
    width: 4,
    height: 50,
  },
});
