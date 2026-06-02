import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import { useRecoilValue } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, Layout, FadeInRight } from "react-native-reanimated";
import CountryFlag from "react-native-country-flag";

import { ProfileState } from "../../atoms";
import { GetNotificationListInfo, UpdateNotification, GetTransactionDetails } from "app/http-services";
import { FONTS, SIZES, SHADOWS } from "app/constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";
import Vector from "app/assets/vectors";

const { width } = Dimensions.get("window");

const Notification = () => {
  const currentToken = useRecoilValue(ProfileState);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    fetchNotifications();
  }, [isFocused]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const transPayload = {
        fromDate: '',
        numberTranList: '50',
        toDate: '',
        tranList: 'COUNT',
        transId: '',
        transactionType: 'MONEY_REMITTANCE',
        walletMode: 'Sendmoney'
      };

      const [notifResponse, transResponse] = await Promise.all([
        GetNotificationListInfo({}),
        GetTransactionDetails(transPayload)
      ]);

      const data = notifResponse?.data?.Notifications || [];
      const transData = transResponse?.data?.TransDetails || [];

      const notificationTypes: Record<number, string> = {
        1: "Registration",
        2: "Wallet Update",
        4: "Transaction",
      };

      const keys = await AsyncStorage.getAllKeys();
      const storedValues = await AsyncStorage.multiGet(keys);
      const localStatus: Record<string, any> = {};
      storedValues.forEach(([key, value]) => {
        if (key.startsWith("notification_") && value) {
          localStatus[key] = JSON.parse(value);
        }
      });

      let transIndex = 0;
      const mappedNotifications = data.map((item: any) => {
        const storageKey = `notification_${item.NotificationLogId}`;
        const localItem = localStatus[storageKey];
        
        let transactionDetails = null;
        if (item.NotificationMasterId === 4 && transIndex < transData.length) {
          transactionDetails = transData[transIndex];
          transIndex++;
        }

        return {
          id: item.NotificationLogId,
          masterId: item.NotificationMasterId,
          type: notificationTypes[item.NotificationMasterId] || "Alert",
          description: item.NotificationMessage,
          time: item.NotificationCreatedDate || "",
          unread:
            localItem?.unread !== undefined
              ? localItem.unread
              : item.NotificationIsread === "False",
          transactionDetails
        };
      });

      setNotifications(mappedNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (item: any) => {
    if (!item.unread) return;
    try {
      await UpdateNotification({
        NotificationlogId: item.id,
        NotificationMasterId: item.masterId,
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, unread: false } : n
        )
      );

      await AsyncStorage.setItem(
        `notification_${item.id}`,
        JSON.stringify({ ...item, unread: false })
      );
    } catch (err) {
      console.error("Failed to update notification status:", err);
    }
  };

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case "Transaction":
        return { icon: "repeat", color: "#FF8E72", as: "ionicons" };
      case "Wallet Update":
        return { icon: "account-balance-wallet", color: "#FBBF24", as: "materialicons" };
      case "Registration":
        return { icon: "person-add", color: "#10B981", as: "materialicons" };
      default:
        return { icon: "notifications", color: "#FF8E72", as: "ionicons" };
    }
  };

  const renderItem = (item: any, index: number) => {
    const { icon, color, as } = getNotificationStyles(item.type);
    const dateParts = item.time.split(" ");
    const dateStr = dateParts[0];
    const timeStr = dateParts.slice(1).join(" ");
    
    // Using require inside the component block similar to TransactionItem
    const getCountryISO2 = require("country-iso-3-to-2");

    if (item.type === "Transaction" && item.transactionDetails) {
      const trans = item.transactionDetails;
      const senderIso = getCountryISO2(trans.SourceCountry) || "GB";
      const receiverIso = getCountryISO2(trans.DestinationCountry) || "";
      const isSuccess = trans.TranStatus === "Success";
      const statusColor = isSuccess ? "#10B981" : trans.TranStatus === "Processing" ? "#F59E0B" : "#EF4444";
      const statusLabel = isSuccess ? "SUCCESS" : trans.TranStatus === "Processing" ? "PENDING" : "FAILED";

      const senderName = `${trans.SenderFirstName || ''} ${trans.SenderLastName || ''}`.trim() || "Sender";
      const receiverName = `${trans.ReceiverFirstName || ''} ${trans.ReceiverLastName || ''}`.trim() || trans.TransactionPurpose || "Receiver";

      return (
        <Animated.View
          key={item.id}
          entering={FadeInRight.delay(index * 50).duration(400)}
          layout={Layout.springify()}
          style={styles.cardRow}
        >
          <TouchableOpacity
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.9}
            style={[styles.receiptCard, item.unread ? styles.receiptCardUnread : null]}
          >
            {/* Status Header */}
            <View style={[styles.statusHeader, { backgroundColor: `${statusColor}10` }]}>
              <Vector as="ionicons" name={isSuccess ? "checkmark-circle" : "time"} size={14} color={statusColor} />
              <Text style={[styles.statusHeaderText, { color: statusColor }]}>{statusLabel}</Text>
            </View>

            {/* Sender & Receiver Info */}
            <View style={styles.participantRow}>
              <View style={styles.participant}>
                <Text style={styles.participantLabel}>Sender: </Text>
                <Text style={styles.participantName}>{senderName}</Text>
                <Text style={styles.countryCode}> ({trans.SourceCountry || "GBR"})</Text>
                {senderIso ? <CountryFlag isoCode={senderIso} size={14} style={styles.flagStyle} /> : null}
              </View>

              <Vector as="feather" name="arrow-right" size={16} color="#10B981" />

              <View style={styles.participant}>
                <Text style={styles.participantLabel}>Receiver: </Text>
                <Text style={styles.participantName}>{receiverName}</Text>
                <Text style={styles.countryCode}> ({trans.DestinationCountry || "IND"})</Text>
                {receiverIso ? <CountryFlag isoCode={receiverIso} size={14} style={styles.flagStyle} /> : null}
              </View>
            </View>

            {/* Amount & Mode */}
            <View style={styles.detailsBox}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Amount Sent:</Text>
                <Text style={styles.detailValue}>{trans.Currency || "£"}{trans.Amount}</Text>
              </View>
              <View style={styles.detailItemEnd}>
                <Text style={styles.detailLabel}>Receiving Mode:</Text>
                <Text style={styles.detailValueMode}>{trans.TransactionMode || "DEBIT"}</Text>
              </View>
            </View>

            {/* Dashed Separator */}
            <View style={styles.dashedContainer}>
              <View style={styles.dashedLine} />
            </View>

            {/* Footer */}
            <View style={styles.receiptFooter}>
              <View style={styles.footerLeft}>
                <Vector as="feather" name="send" size={12} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.footerModeText}>
                  {(trans.TransactionMode || "MOBILE WALLET").toUpperCase()}
                </Text>
              </View>

              <View style={styles.footerCenter}>
                <Text style={styles.footerDate}>{dateStr} • {timeStr}</Text>
              </View>

              <View style={styles.footerRight}>
                <Text style={styles.transIdText}>{trans.TransactionID || trans.TransID || "N/A"}</Text>
              </View>
            </View>
            
            {item.unread && (
               <View style={styles.unreadDot} />
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // Generic Fallback UI for non-transactions
    return (
      <Animated.View
          key={item.id}
          entering={FadeInRight.delay(index * 50).duration(400)}
          layout={Layout.springify()}
          style={styles.cardRow}
        >
        <TouchableOpacity
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.9}
            style={[styles.genericCard, item.unread ? styles.receiptCardUnread : null]}
          >
            <View style={styles.genericHeader}>
               <View style={[styles.genericIconBox, { backgroundColor: `${color}1A` }]}>
                  <Vector as={as as any} name={icon} size={16} color={color} />
               </View>
               <Text style={styles.genericTitle}>{item.type}</Text>
               {item.unread && <View style={styles.unreadDotGeneric} />}
            </View>
            
            <Text style={styles.genericDesc}>{item.description}</Text>
            
            <View style={styles.genericFooter}>
               <Text style={styles.footerDate}>{dateStr} • {timeStr}</Text>
            </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const unreadItems = notifications.filter((n) => n.unread);
  const readItems = notifications.filter((n) => !n.unread);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Elite Peach/Brown Header */}
      <LinearGradient
        colors={['#2C1810', '#3B2F2F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerWrapper}
      >
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backCircle}
              activeOpacity={0.7}
            >
              <Vector as="ionicons" name="chevron-back" size={24} color="#FCF5F1" />
            </TouchableOpacity>
            <View style={styles.titleBox}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSub}>Activity & Updates</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#FF8E72" />
            <Text style={styles.loaderTxt}>Loading your updates...</Text>
          </View>
        ) : error ? (
          <View style={styles.loader}>
            <Vector as="ionicons" name="alert-circle" size={50} color="#EF4444" />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Vector as="materialcommunityicons" name="bell-off-outline" size={80} color="#E2E8F0" />
            <Text style={styles.emptyTxt}>No recent notifications</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {unreadItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Vector as="feather" name="activity" size={16} color="#FF8E72" style={{ marginRight: 8 }} />
                  <Text style={styles.sectionLabel}>NEW ACTIVITY</Text>
                </View>
                <View style={styles.listContainer}>
                  {unreadItems.map((item, idx) => renderItem(item, idx))}
                </View>
              </View>
            )}

            {readItems.length > 0 && (
              <View style={[styles.section, { marginTop: unreadItems.length > 0 ? 30 : 0 }]}>
                <View style={styles.sectionHeader}>
                  <Vector as="feather" name="clock" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionLabel, { color: '#94A3B8' }]}>PAST ACTIVITY</Text>
                </View>
                <View style={styles.listContainer}>
                  {readItems.map((item, idx) => renderItem(item, idx + unreadItems.length))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Light background for contrast
  },
  headerWrapper: {
    paddingBottom: 25,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15 },
      android: { elevation: 10 },
    }),
  },
  safeHeader: {
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleBox: {
    marginLeft: 18,
  },
  headerTitle: {
    fontSize: RFValue(18),
    fontFamily: FONTS.bold,
    color: '#FCF5F1',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: RFValue(10),
    color: 'rgba(252, 245, 241, 0.7)',
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 25,
    paddingHorizontal: 15,
    paddingBottom: 50,
  },
  section: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingLeft: 5,
  },
  sectionLabel: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
    letterSpacing: 1.5,
  },
  listContainer: {
    gap: 15, // Space between cards
  },
  cardRow: {
    width: '100%',
  },
  receiptCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.05)',
    padding: 16,
    paddingBottom: 12,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  receiptCardUnread: {
    borderWidth: 1.5,
    borderColor: '#FF8E72',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  statusHeaderText: {
    fontSize: RFValue(10),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    justifyContent: 'center',
  },
  participantLabel: {
    fontSize: RFValue(10),
    fontFamily: FONTS.medium,
    color: '#94A3B8',
  },
  participantName: {
    fontSize: RFValue(10),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  countryCode: {
    fontSize: RFValue(10),
    fontFamily: FONTS.bold,
    color: '#64748B',
    marginRight: 4,
  },
  flagStyle: {
    width: 14,
    height: 10,
    borderRadius: 2,
  },
  detailsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailItemEnd: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: RFValue(9),
    fontFamily: FONTS.medium,
    color: '#94A3B8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  detailValueMode: {
    fontSize: RFValue(11),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  dashedContainer: {
    overflow: 'hidden',
    height: 2,
    marginBottom: 16,
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderStyle: 'dashed',
    width: '100%',
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerModeText: {
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  footerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  footerDate: {
    fontSize: RFValue(8.5),
    fontFamily: FONTS.medium,
    color: '#94A3B8',
  },
  footerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  transIdText: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: RFValue(8.5),
    fontFamily: FONTS.bold,
    color: '#64748B',
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF8E72',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  
  // Generic Card Styles
  genericCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.05)',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  genericHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  genericIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  genericTitle: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  genericDesc: {
    fontSize: RFValue(11),
    fontFamily: FONTS.medium,
    color: '#64748B',
    lineHeight: RFValue(16),
    marginBottom: 12,
  },
  genericFooter: {
    alignItems: 'flex-end',
  },
  unreadDotGeneric: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8E72',
    marginLeft: 8,
  },
  
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderTxt: {
    marginTop: 15,
    fontFamily: FONTS.medium,
    color: "#8E7F77",
  },
  errorTxt: {
    marginTop: 10,
    fontFamily: FONTS.bold,
    color: "#EF4444",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTxt: {
    marginTop: 15,
    fontSize: RFValue(14),
    fontFamily: FONTS.bold,
    color: "#CBD5E1",
  },
});

export default Notification;
