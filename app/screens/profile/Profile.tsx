import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { useRecoilState, useRecoilValue } from "recoil";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Spinner from "react-native-loading-spinner-overlay";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";

import { ProfileState, ProfileTabState } from "../../atoms";
import ProfileTapHeader from "app/components/ProfileTapHeader";
import { GetReferDetails, GetRemitterProfile } from "app/http-services";
import { FONTS, SIZES, SHADOWS } from "app/constants/Assets";
import Vector from "app/assets/vectors";

import PersonalDetails from "./components/personalDetails";
import BusinessDetails from "./components/BusinessDetails";
import AdditionalDetails from "./components/AdditionalDetails";
import ChangePassword from "./components/ChangePassword";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const Profile = () => {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const isFocused = useIsFocused();
  const currentToken = useRecoilValue(ProfileState);
  const [tabIndex] = useRecoilState(ProfileTabState);

  const [profile, setProfile] = useState<any>("");
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState("");
  const [accountType, setAccountType] = useState<string | null>(null);

  // Background Orb Animations
  const orb1Pos = useSharedValue(0);
  const orb2Pos = useSharedValue(0);
  const avatarAnim = useSharedValue(0);
  const rotationAnim = useSharedValue(0);

  useEffect(() => {
    orb1Pos.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    orb2Pos.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    avatarAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    rotationAnim.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb1Pos.value, [0, 1], [-50, 50]) },
      { translateY: interpolate(orb1Pos.value, [0, 1], [-30, 30]) },
      { scale: interpolate(orb1Pos.value, [0, 1], [1, 1.3]) },
    ],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb2Pos.value, [0, 1], [30, -30]) },
      { translateY: interpolate(orb2Pos.value, [0, 1], [20, -20]) },
      { scale: interpolate(orb2Pos.value, [0, 1], [1.1, 0.8]) },
    ],
  }));

  const animatedAvatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(avatarAnim.value, [0, 1], [0, -8]) },
      { scale: interpolate(avatarAnim.value, [0, 1], [1, 1.04]) },
    ],
  }));

  const rotatingBorderStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(rotationAnim.value, [0, 1], [0, 360])}deg` },
    ],
  }));

  useEffect(() => {
    getAsyncUser();
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchReferDetails(currentToken.tokenId);
      fetchRemitterProfile(currentToken.tokenId);
    }
  }, [isFocused]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: tabIndex * width,
      animated: true,
    });
  }, [tabIndex, width]);

  const getAsyncUser = async () => {
    const stored = await AsyncStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      setAccountType(user?.Is_BusinessType);
    }
  };

  const fetchReferDetails = async (tokenId: string) => {
    try {
      setLoading(true);
      const res: any = await GetReferDetails(tokenId);
      if (res.status === 200) setReward(res?.data?.Refer?.PotentialEarning);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRemitterProfile = async (tokenId: string) => {
    try {
      setLoading(true);
      const res: any = await GetRemitterProfile(tokenId);
      if (res.status === 200) setProfile(res?.data?.Sender);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName?: string) => {
    if (!firstName) return "U";
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : "";
    return `${first}${last}`;
  };

  const userName = currentToken.firstName
    ? `${currentToken.firstName} ${currentToken.lastName || ""}`.trim()
    : "User Profile";

  return (
    <View style={localStyles.mainContainer}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* DYNAMIC ALIVE BACKGROUND */}
      <View style={localStyles.bgWrapper}>
        <Animated.View style={[localStyles.glowOrb1, orb1Style]} />
        <Animated.View style={[localStyles.glowOrb2, orb2Style]} />
        <View style={localStyles.glassOverlay} />
      </View>

      <SafeAreaView style={localStyles.safeArea} edges={["top", "left", "right"]}>
        {/* HEADER TOP ROW */}
        <View style={localStyles.headerTopRow}>
          <View style={{ width: 44 }} />
          <Text style={localStyles.headerTitle}>Account Identity</Text>
          <TouchableOpacity style={localStyles.headerIconBtn}>
            <Vector as="feather" name="edit-3" size={20} color="#3B2F2F" />
          </TouchableOpacity>
        </View>

        {/* FROSTED FLOATING IDENTITY CARD */}
        <Animated.View entering={FadeInDown.duration(800)} style={localStyles.heroWrapper}>
          <View style={localStyles.glassCard}>
            <View style={localStyles.avatarContainer}>
              <Animated.View style={[localStyles.avatarCircle, animatedAvatarStyle]}>
                <Animated.View style={[localStyles.rotatingRing, rotatingBorderStyle]} />
                <Text style={localStyles.avatarInitials}>
                  {getInitials(currentToken.firstName, currentToken.lastName)}
                </Text>
              </Animated.View>
              <View style={localStyles.verifiedTag}>
                <Vector as="materialicons" name="verified" size={16} color="#10B981" />
              </View>
            </View>

            <Text style={localStyles.userNameTxt}>{userName}</Text>
            
            <View style={localStyles.statusBadge}>
              <LinearGradient
                colors={["#FFD700", "#FFB000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={localStyles.badgeGradient}
              >
                <Vector as="materialcommunityicons" name="earth" size={14} color="#3B2F2F" />
                <Text style={localStyles.badgeTxt}>CROSS BORDER</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* LAYERED CONTENT SECTION */}
        <Animated.View entering={FadeInUp.duration(800).delay(200)} style={localStyles.contentArea}>
          <View style={localStyles.tabHeaderWrapper}>
            <ProfileTapHeader accountType={accountType} />
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={localStyles.scrollView}
            contentContainerStyle={{ flexDirection: "row" }}
          >
            {/* PERSONAL */}
            <View style={{ width, flex: 1 }}>
              <PersonalDetails profile={profile} />
            </View>

            {/* BUSINESS */}
            {accountType === "Y" && (
              <View style={{ width, flex: 1 }}>
                <BusinessDetails />
              </View>
            )}

            {/* ADDITIONAL */}
            <View style={{ width, flex: 1 }}>
              <AdditionalDetails profile={profile} />
            </View>

            {/* SECURITY */}
            <View style={{ width, flex: 1 }}>
              <ChangePassword />
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      {loading && <Spinner visible={true} size="large" animation="slide" overlayColor="rgba(0,0,0,0.15)" />}
    </View>
  );
};

const localStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#FCF5F1",
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  glowOrb1: {
    position: "absolute",
    top: -100,
    right: -100,
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: SCREEN_WIDTH * 0.6,
    backgroundColor: "rgba(255, 142, 114, 0.2)",
  },
  glowOrb2: {
    position: "absolute",
    bottom: SCREEN_HEIGHT * 0.4,
    left: -100,
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: SCREEN_WIDTH / 2,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(252, 245, 241, 0.4)",
  },
  safeArea: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  headerTitle: {
    fontSize: RFValue(16),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
    letterSpacing: 0.5,
  },
  heroWrapper: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 32,
    padding: SCREEN_WIDTH * 0.06,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.8)",
    ...Platform.select({
      ios: {
        shadowColor: "#3B2F2F",
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatarCircle: {
    width: RFValue(70),
    height: RFValue(70),
    borderRadius: RFValue(35),
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FF8E72",
  },
  avatarInitials: {
    fontSize: RFValue(24),
    fontFamily: FONTS.bold,
    color: "#FF8E72",
  },
  rotatingRing: {
    position: "absolute",
    width: RFValue(76),
    height: RFValue(76),
    borderRadius: RFValue(38),
    borderWidth: 2,
    borderColor: "#FF8E72",
    borderStyle: "dashed",
  },
  verifiedTag: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 2,
    ...SHADOWS?.shadow || {},
  },
  userNameTxt: {
    fontSize: RFValue(18),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
    marginBottom: 10,
    textAlign: "center",
  },
  statusBadge: {
    borderRadius: 100,
    overflow: "hidden",
  },
  badgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 6,
    gap: 6,
  },
  badgeTxt: {
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
    letterSpacing: 1.5,
  },
  contentArea: {
    flex: 1,
    backgroundColor: "#FCF5F1",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    ...Platform.select({
      ios: {
        shadowColor: "#3B2F2F",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
      },
      android: { elevation: 12 },
    }),
  },
  tabHeaderWrapper: {
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
});

export default Profile;
