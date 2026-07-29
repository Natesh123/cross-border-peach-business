import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SIZES } from 'app/constants/Assets';
import Vector from 'app/assets/vectors';

type Props = {
  buttons: string[],
  width: number,
  onPress: ((button: string) => void),
};

const GroupButton = ({ buttons, width, onPress }: Props) => {
  const [selection, setSelection] = useState(buttons[0]);
  const translateX = useSharedValue(0);

  // Constants for layout based on the user's preferred design
  const pillWidth = width;
  const margin = 4;

  const _onPressed = (selected: string, index: number) => {
    setSelection(selected);
    translateX.value = withSpring(index * (pillWidth + margin), {
      damping: 20,
      stiffness: 100,
    });
    onPress(selected);
  };

  const getIcon = (btn: string) => {
    switch (btn.toLowerCase()) {
      case 'money_remittance':
      case 'money transfer': return { as: 'materialcommunityicons', name: 'bank-transfer' };
      case 'airtopup':
      case 'airtime topup': return { as: 'materialcommunityicons', name: 'cellphone-wireless' };
      default: return null;
    }
  };

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.outerContainer}>
      <View style={styles.btnGroup}>
        {/* Sliding Active Indicator */}
        <Animated.View
          style={[
            styles.indicatorWrapper,
            { width: pillWidth },
            animatedIndicatorStyle
          ]}
        >
          <LinearGradient
            colors={['#5D4F4F', '#3B2F2F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.indicatorPill}
          />
        </Animated.View>

        {buttons.map((btn, index) => {
          const isSelected = selection === btn;
          const icon = getIcon(btn);

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              style={[styles.btnWrapper, { width: pillWidth }]}
              onPress={() => _onPressed(btn, index)}
            >
              <View style={styles.contentWrapper}>
                {icon && (
                  <Vector
                    as={icon.as as any}
                    name={icon.name}
                    size={20}
                    color={isSelected ? "#FCF5F1" : "#5D4F4F"}
                    style={styles.icon}
                  />
                )}
                <Text
                  style={[
                    styles.text,
                    { color: isSelected ? '#FCF5F1' : '#5D4F4F' }
                  ]}
                >
                  {btn}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    padding: 6,
    backgroundColor: 'rgba(255, 142, 114, 0.05)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 142, 114, 0.1)',
  },
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 52,
  },
  indicatorWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 0,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  indicatorPill: {
    flex: 1,
    borderRadius: 18,
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 10 },
    }),
  },
  btnWrapper: {
    zIndex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  icon: {
    // spacing handled by gap
  },
  text: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
});

export default memo(GroupButton);