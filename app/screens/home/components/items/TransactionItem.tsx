import React from "react";
import { View, Text, StyleSheet, Platform, Image, TouchableOpacity, useWindowDimensions } from "react-native";
import CountryFlag from "react-native-country-flag";
import { FONTS, SIZES } from "app/constants/Assets";
import { dateFormat } from "app/helpers";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInRight, FadeInDown, FadeIn } from "react-native-reanimated";
import Vector from "app/assets/vectors";

interface IProps {
  item: any;
  index: number;
  variant?: 'hero' | 'square' | 'minimal';
  currency?: string;
}

const TransactionItem = ({ item, index, variant = 'hero', currency: sysCurrency }: IProps) => {
  const { width } = useWindowDimensions();
  const getCountryISO2 = require("country-iso-3-to-2");
  const isoCode = getCountryISO2(item.DestinationCountry) || "";

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Success":
        return { color: "#10B981", glow: "rgba(16, 185, 129, 0.1)", label: "COMPLETED", icon: "checkmark-circle" };
      case "Processing":
        return { color: "#F59E0B", glow: "rgba(245, 158, 11, 0.1)", label: "PENDING", icon: "time" };
      default:
        return { color: "#EF4444", glow: "rgba(239, 68, 68, 0.1)", label: "FAILED", icon: "close-circle" };
    }
  };

  const { color: statusColor, glow: statusGlow, label: statusLabel, icon: statusIcon } = getStatusConfig(item.TranStatus);
  const displayName = (item.ReceiverFirstName || item.ReceiverLastName)
    ? `${item.ReceiverFirstName} ${item.ReceiverLastName}`.trim()
    : item.TransactionPurpose || "Money Transfer";

  const displayCurrency = item.Currency || sysCurrency || "£";

  if (variant === 'hero') {
    return (
      <Animated.View entering={FadeInRight.delay(index * 150).duration(800)} style={localStyles.galleryWrapper}>
        <LinearGradient
          colors={['#FF8E72', '#FC6D41']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={localStyles.galleryHeroCard}
        >
          {/* VIBRANT PEACH SPECULAR EFFECT */}
          <View style={localStyles.gallerySpec} />

          <View style={localStyles.galleryHeroTop}>
            <View style={localStyles.galleryIdentity}>
              <View style={localStyles.galleryAvatar}>
                {isoCode ? (
                  <CountryFlag isoCode={isoCode} size={28} />
                ) : (
                  <Vector as="materialcommunityicons" name="send-clock" size={24} color="#FFF" />
                )}
              </View>
              <View>
                <Text style={localStyles.galleryHeroTitle} numberOfLines={1}>{displayName}</Text>
                <Text style={localStyles.galleryHeroDate}>{dateFormat(item.TransactionDate)}</Text>
              </View>
            </View>

            <View style={localStyles.galleryStatusPeach}>
              <Text style={localStyles.galleryStatusTxtPeach}>{statusLabel}</Text>
            </View>
          </View>

          <View style={localStyles.galleryHeroValue}>
            <Text style={localStyles.galleryCurrencyPeach}>{displayCurrency}</Text>
            <Text style={localStyles.galleryAmount}>{item.Amount}</Text>
          </View>

          <View style={localStyles.galleryHeroFooter}>
            <View style={localStyles.galleryTagPeach}>
              <Vector as="materialcommunityicons" name="shield-check" size={10} color="#FFF" />
              <Text style={localStyles.galleryTagTxtPeach}>VERIFIED</Text>
            </View>
            <TouchableOpacity style={localStyles.galleryAction}>
              <Text style={localStyles.galleryActionTxt}>View Receipt</Text>
              <Vector as="feather" name="arrow-up-right" size={12} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (variant === 'square') {
    return (
      <Animated.View entering={FadeInDown.delay(index * 200).duration(800)} style={localStyles.squareWrapper}>
        <TouchableOpacity activeOpacity={0.9} style={localStyles.gridCardAtm}>
          <View style={localStyles.gridCardHeader}>
            <View style={[localStyles.gridIndicator, { backgroundColor: statusColor }]} />
            <Text style={localStyles.gridDate}>{dateFormat(item.TransactionDate)}</Text>
          </View>

          <Text style={localStyles.gridName} numberOfLines={1}>{displayName}</Text>
          <Text style={localStyles.gridValue}>
            <Text style={localStyles.gridCurrency}>{displayCurrency}</Text>{item.Amount}
          </Text>

          <View style={localStyles.gridFooterAtm}>
            <Text style={localStyles.gridMode}>{item.TransactionMode}</Text>
            <Vector as="feather" name="chevron-right" size={10} color="#DBCAC0" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)} style={localStyles.streamWrapperAtm}>
      <TouchableOpacity activeOpacity={0.8} style={localStyles.streamRowAtm}>
        <View style={localStyles.streamRowLeft}>
          <View style={localStyles.streamIconBoxAtm}>
            <Vector as="ionicons" name={statusIcon} size={16} color={statusColor} />
          </View>
          <View>
            <Text style={localStyles.streamNameAtm}>{displayName}</Text>
            <Text style={localStyles.streamMetaAtm}>{dateFormat(item.TransactionDate)}</Text>
          </View>
        </View>

        <View style={localStyles.streamRowRight}>
          <Text style={localStyles.streamAmountAtm}>
            <Text style={localStyles.streamCurrAtm}>{displayCurrency}</Text>{item.Amount}
          </Text>
          <View style={[localStyles.streamBullet, { backgroundColor: statusColor }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const localStyles = StyleSheet.create({
  galleryWrapper: {
    width: '100%',
  },
  galleryHeroCard: {
    borderRadius: 36,
    padding: 24,
    height: 190,
    overflow: 'hidden',
    justifyContent: 'space-between',
    elevation: 15,
    shadowColor: '#FF8E72',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  gallerySpec: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  galleryHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  galleryIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  galleryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  galleryHeroTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFF',
    letterSpacing: -0.3,
  },
  galleryHeroDate: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  galleryStatusPeach: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  galleryStatusTxtPeach: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  galleryHeroValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    zIndex: 10,
  },
  galleryCurrencyPeach: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.5)',
  },
  galleryAmount: {
    fontSize: 34,
    fontFamily: FONTS.bold,
    color: '#FFF',
    letterSpacing: -0.8,
  },
  galleryHeroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  galleryTagPeach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 47, 47, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  galleryTagTxtPeach: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  galleryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  galleryActionTxt: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  squareWrapper: {
    flex: 1,
  },
  gridCardAtm: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.04)',
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gridDate: {
    fontSize: 9,
    fontFamily: FONTS.medium,
    color: '#A19188',
  },
  gridName: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    marginVertical: 4,
  },
  gridValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  gridCurrency: {
    color: '#FF8E72',
    fontSize: 12,
  },
  gridFooterAtm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  gridMode: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: '#DBCAC0',
  },
  streamWrapperAtm: {
    width: '100%',
  },
  streamRowAtm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  streamRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  streamIconBoxAtm: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.02)',
  },
  streamNameAtm: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  streamMetaAtm: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#A19188',
    marginTop: 1,
  },
  streamRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streamAmountAtm: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  streamCurrAtm: {
    fontSize: 12,
    color: '#FF8E72',
    marginRight: 2,
  },
  streamBullet: {
    width: 4,
    height: 16,
    borderRadius: 2,
  }
});

export default TransactionItem;