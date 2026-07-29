import {
  View,
  useWindowDimensions,
  StyleSheet,
  ViewStyle,
  Text,
} from 'react-native';
import React from 'react';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { FONTS } from '../../../constants/Assets';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  item: { text: string; description: string; eyebrow?: string; icon?: string };
  index: number;
  x: Animated.SharedValue<number>;
  style?: ViewStyle;
};

const ListItem = ({ item, index, x, style }: Props) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const rnTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      x.value,
      [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      x.value,
      [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
      [40, 0, 40],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY: withSpring(translateY, { damping: 12 }) }],
    };
  }, [index, x, SCREEN_WIDTH]);

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      x.value,
      [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  return (
    <View style={[styles.itemContainer, { width: SCREEN_WIDTH }]}>
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        {item.icon && (
          <MaterialCommunityIcons name={item.icon as any} size={32} color="#3B2F2F" />
        )}
      </Animated.View>

      <Animated.View style={[styles.textContainer, rnTextStyle]}>
        {item.eyebrow && (
          <View style={styles.eyebrowOuter}>
            <View style={styles.eyebrowContainer}>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
            </View>
          </View>
        )}

        <Text style={styles.title}>{item.text}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </View>
  );
};

export default React.memo(ListItem);

const styles = StyleSheet.create({
  itemContainer: {
    height: '100%',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 47, 47, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: -10,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  eyebrowOuter: {
    marginBottom: 16,
  },
  eyebrowContainer: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#3B2F2F',
    borderRadius: 12,
    shadowColor: '#3B2F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#FCF5F1',
    letterSpacing: 1.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24, // Reduced from 28
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 14, // Reduced from 16
    fontFamily: FONTS.medium,
    color: '#3B2F2F',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.7,
    paddingHorizontal: 20,
  },
});
