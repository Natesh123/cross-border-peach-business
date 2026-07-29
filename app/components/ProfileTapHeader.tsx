import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { useRecoilState } from "recoil";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  interpolateColor
} from "react-native-reanimated";
import { ProfileTabState } from "../atoms";
import { FONTS, SIZES } from "../constants/Assets";
import Vector from "app/assets/vectors";

const ROUTES = [
  { title: "Personal", key: "PersonalDetails", icon: "account-outline" },
  { title: "Business", key: "BusinessDetails", businessOnly: true, icon: "office-building-outline" },
  { title: "Additional", key: "AdditionalDetails", icon: "shield-edit-outline" },
  { title: "Security", key: "ChangePassword", icon: "lock-outline" },
];

type Props = {
  accountType: string | null;
};

const ProfileTapHeader = ({ accountType }: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const [tabIndex, setTabIndex] = useRecoilState(ProfileTabState);

  const visibleRoutes = ROUTES.filter(
    (item) => !(item.businessOnly && accountType !== "Y")
  );

  const containerPadding = 20 * 2;
  const containerWidth = screenWidth - containerPadding;
  const tabWidth = (containerWidth - 8) / visibleRoutes.length;
  const translateX = useSharedValue(tabIndex * tabWidth);

  useEffect(() => {
    translateX.value = withSpring(tabIndex * tabWidth, {
      damping: 20,
      stiffness: 100,
    });
  }, [tabIndex, tabWidth]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  return (
    <View style={localStyles.wrapper}>
      <View style={[localStyles.container, { width: containerWidth }]}>
        <Animated.View style={[localStyles.indicator, animatedIndicatorStyle]} />
        
        {visibleRoutes.map(({ key, title, icon }, index) => {
          const isActive = tabIndex === index;
          
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.7}
              onPress={() => setTabIndex(index)}
              style={[localStyles.tab, { width: tabWidth }]}
            >
              <View style={localStyles.tabContent}>
                <Vector 
                  as="materialcommunityicons" 
                  name={icon} 
                  size={16} 
                  color={isActive ? "#3B2F2F" : "#8E7F77"} 
                  style={{ marginBottom: 2 }}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    localStyles.tabText,
                    isActive && localStyles.activeTabText,
                  ]}
                >
                  {title}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  wrapper: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  container: {
    height: RFValue(48),
    backgroundColor: 'rgba(59, 47, 47, 0.05)', // Very light tinted background
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    height: RFValue(40),
    backgroundColor: '#FFF',
    borderRadius: 16,
    left: 4,
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  tab: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: RFValue(8.5),
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  activeTabText: {
    color: '#3B2F2F',
  },
});

export default ProfileTapHeader;
