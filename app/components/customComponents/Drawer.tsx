import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS, IMAGES, SIZES } from "app/constants/Assets";
import { useRecoilState, useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

const CustomDrawer = (props: any) => {
  const navigation = useNavigation();
  const currentToken = useRecoilValue(ProfileState);
  const [ProfileItems, setProfileItems] = useRecoilState(ProfileState);
  const [loading, setLoading] = useState(false);

  const _onSignOutPressed = async () => {
    setLoading(true);
    await AsyncStorage.clear();
    setProfileItems({
      remitterId: currentToken.remitterId,
      firstName: currentToken.firstName,
      lastName: currentToken.lastName,
      email: currentToken.email,
      mobileNo: currentToken.mobileNo,
      tokenId: '',
    });
    await AsyncStorage.removeItem("isLoggedIn");
    navigation.navigate('Login');
    setLoading(false);
  };

  return (
    <View style={s.root}>

      {/* ── DARK HEADER ── */}
      <View style={s.header}>
        <SafeAreaView edges={['top']}>
          {/* Avatar row */}
          <View style={s.avatarRow}>
            {/* Avatar */}
            <View style={s.avatarRing}>
              <Image source={IMAGES.MenUser} style={s.avatar} />
              <View style={s.onlineDot} />
            </View>

            <View style={s.brandBadge}>
              <Image 
                source={require('../../assets/logos/cb_logo_new.png')} 
                style={s.drawerLogo} 
                resizeMode="contain" 
              />
            </View>
          </View>

          {/* Name */}
          <Text style={s.userName}>
            {currentToken.firstName} {currentToken.lastName}
          </Text>
          {/* Orange underline */}
          <View style={s.nameUnderline} />

          {/* Remitter ID card */}
          <View style={s.idCard}>
            <View>
              <Text style={s.idLabel}>REMITTER IDENTITY</Text>
              <Text style={s.idValue}>{currentToken.remitterId || "KR0000000000"}</Text>
            </View>
            <MaterialCommunityIcons name="badge-account-horizontal-outline" size={28} color="#FF8E72" />
          </View>
        </SafeAreaView>
      </View>

      {/* ── MENU AREA ── */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label */}
        <Text style={s.sectionLabel}>CORE SERVICES</Text>

        {/* Drawer items (styled by DrawerNavigator screenOptions) */}
        <View style={s.itemsWrap}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* ── FOOTER ── */}
      <View style={s.footer}>
        {/* Logout */}
        <TouchableOpacity
          onPress={_onSignOutPressed}
          activeOpacity={0.85}
          style={s.logoutBtn}
        >
          <MaterialCommunityIcons name="power" size={18} color="#FF8E72" />
          <Text style={s.logoutTxt}>LOGOUT</Text>
        </TouchableOpacity>

        {/* Brand footer */}
        <View style={s.brandFooter}>
          <MaterialCommunityIcons name="star-four-points" size={10} color="#DBCAC0" />
          <Text style={s.brandFooterTxt}>CROSS BORDER • V1.2.0</Text>
        </View>
      </View>
    </View>
  );
};

export default CustomDrawer;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FCF5F1',
  },

  // ── HEADER ──
  header: {
    backgroundColor: '#2C1810',
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomRightRadius: 0,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 18,
  },
  avatarRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: '#FF8E72',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#2C1810',
  },
  brandBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  drawerLogo: {
    width: 80,
    height: 30,
  },
  brandBadgeTxt: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: '#C9A84C',
    letterSpacing: 0.5,
    lineHeight: RFValue(13),
  },

  userName: {
    fontSize: RFValue(18),
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  nameUnderline: {
    width: 36,
    height: 2.5,
    backgroundColor: '#FF8E72',
    borderRadius: 2,
    marginBottom: 18,
  },

  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  idLabel: {
    fontSize: RFValue(8.5),
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  idValue: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── SCROLL ──
  scrollContent: {
    paddingTop: 22,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
    color: '#A19188',
    letterSpacing: 2,
    marginLeft: 22,
    marginBottom: 14,
  },
  itemsWrap: {
    paddingHorizontal: 8,
  },

  // ── FOOTER ──
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,47,47,0.06)',
    backgroundColor: '#FCF5F1',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2C1810',
    borderRadius: 18,
    paddingVertical: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#2C1810', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  logoutTxt: {
    fontSize: RFValue(11),
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  brandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  brandFooterTxt: {
    fontSize: RFValue(9),
    fontFamily: FONTS.medium,
    color: '#DBCAC0',
    letterSpacing: 1,
  },
});