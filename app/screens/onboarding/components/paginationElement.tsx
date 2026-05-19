import { StyleSheet, View, useWindowDimensions } from 'react-native';
import React from 'react';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

type Props = {
  length: number;
  x: Animated.SharedValue<number>;
};

const PaginationComponent = ({
  index,
  x,
  SCREEN_WIDTH,
}: {
  index: number;
  x: Animated.SharedValue<number>;
  SCREEN_WIDTH: number;
}) => {
  const itemRnStyle = useAnimatedStyle(() => {
    const width = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [10, 24, 10],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0.3, 1, 0.3],
      Extrapolate.CLAMP
    );

    return {
      width,
      opacity,
    };
  }, [x, index, SCREEN_WIDTH]);

  return <Animated.View style={[styles.itemStyle, itemRnStyle]} />;
};

const PaginationElement = ({ length, x }: Props) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        return (
          <PaginationComponent
            index={index}
            key={index}
            x={x}
            SCREEN_WIDTH={SCREEN_WIDTH}
          />
        );
      })}
    </View>
  );
};

export default React.memo(PaginationElement);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 10,
  },
  itemStyle: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#3B2F2F',
  },
});