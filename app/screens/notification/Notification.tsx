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

import { ProfileState } from "../../atoms";
import { GetNotificationListInfo, UpdateNotification } from "app/http-services";
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
      const response = await GetNotificationListInfo({});
      const data = response?.data?.Notifications || [];

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

      const mappedNotifications = data.map((item: any) => {
        const storageKey = `notification_${item.NotificationLogId}`;
        const localItem = localStatus[storageKey];
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
        return { icon: "repeat", color: "#FF8E72", as: "ionicons" }; // Peach
      case "Wallet Update":
        return { icon: "account-balance-wallet", color: "#FBBF24", as: "materialicons" }; // Gold
      case "Registration":
        return { icon: "person-add", color: "#10B981", as: "materialicons" }; // Mint
      default:
        return { icon: "notifications", color: "#FF8E72", as: "ionicons" };
    }
  };

  const renderItem = (item: any, index: number, isLast: boolean) => {
    const { icon, color, as } = getNotificationStyles(item.type);
    const dateParts = item.time.split(" ");
    const dateStr = dateParts[0];
    const timeStr = dateParts.slice(1).join(" ");

    return (
      <Animated.View
        key={item.id}
        entering={FadeInRight.delay(index * 50).duration(400)}
        layout={Layout.springify()}
        style={styles.timelineRow}
      >
        {/* The Continuous Timeline Line */}
        {!isLast && <View style={[styles.timelineLine, !item.unread && styles.timelineLineMuted]} />}

        {/* Timeline Node (Icon) */}
        <View style={styles.nodeColumn}>
          <View style={[
            styles.nodeCircle, 
            item.unread ? { backgroundColor: color, shadowColor: color, elevation: 6 } : styles.nodeCircleMuted
          ]}>
            <Vector 
              as={as as any} 
              name={icon} 
              size={18} 
              color={item.unread ? "#FFF" : "#94A3B8"} 
            />
          </View>
        </View>

        {/* The Chat Bubble Content */}
        <TouchableOpacity
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.8}
          style={styles.bubbleColumn}
        >
          <View style={[
            styles.bubbleCard, 
            item.unread ? styles.bubbleCardUnread : styles.bubbleCardRead
          ]}>
            {/* The little pointer pointing to the node */}
            <View style={[styles.bubblePointer, item.unread ? styles.bubblePointerUnread : styles.bubblePointerRead]} />
            
            <View style={styles.bubbleHeader}>
              <Text style={[styles.bubbleTitle, item.unread ? { color: color } : styles.bubbleTitleRead]}>
                {item.type}
              </Text>
              <Text style={styles.bubbleDate}>{dateStr}</Text>
            </View>

            <Text style={[styles.bubbleDesc, !item.unread && styles.bubbleDescRead]} numberOfLines={3}>
              {item.description}
            </Text>

            <View style={styles.bubbleFooter}>
              <Text style={styles.bubbleTime}>{timeStr}</Text>
              {item.unread ? (
                <View style={[styles.statusPill, { backgroundColor: `${color}1A` }]}>
                  <View style={[styles.statusDot, { backgroundColor: color }]} />
                  <Text style={[styles.statusTxt, { color: color }]}>NEW</Text>
                </View>
              ) : (
                <Text style={styles.viewedTxt}>Viewed</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const unreadItems = notifications.filter((n) => n.unread);
  const readItems = notifications.filter((n) => !n.unread);
  const allSortedItems = [...unreadItems, ...readItems]; // In case we want to show them together, but we'll keep sections as before.

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
              <Text style={styles.headerTitle}>Activity Timeline</Text>
              <Text style={styles.headerSub}>Track your transactions & updates</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#FF8E72" />
            <Text style={styles.loaderTxt}>Loading your timeline...</Text>
          </View>
        ) : error ? (
          <View style={styles.loader}>
            <Vector as="ionicons" name="alert-circle" size={50} color="#EF4444" />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Vector as="materialcommunityicons" name="timeline-clock-outline" size={80} color="#E2E8F0" />
            <Text style={styles.emptyTxt}>No recent activity</Text>
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
                <View style={styles.timelineContainer}>
                  {unreadItems.map((item, idx) => renderItem(item, idx, idx === unreadItems.length - 1 && readItems.length === 0))}
                </View>
              </View>
            )}

            {readItems.length > 0 && (
              <View style={[styles.section, { marginTop: unreadItems.length > 0 ? 30 : 0 }]}>
                <View style={styles.sectionHeader}>
                  <Vector as="feather" name="clock" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionLabel, { color: '#94A3B8' }]}>PAST ACTIVITY</Text>
                </View>
                <View style={styles.timelineContainer}>
                  {readItems.map((item, idx) => renderItem(item, idx + unreadItems.length, idx === readItems.length - 1))}
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
    backgroundColor: "#FCF5F1", // Peach cream background
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
    marginBottom: 20,
    paddingLeft: 10,
  },
  sectionLabel: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
    letterSpacing: 1.5,
  },
  timelineContainer: {
    position: 'relative',
  },
  timelineRow: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 25,
  },
  timelineLine: {
    position: 'absolute',
    top: 36, // Start below the node
    bottom: -35, // Reach the next node
    left: 27, // Center of the 54px nodeColumn
    width: 2,
    backgroundColor: 'rgba(255, 142, 114, 0.4)', // Peach glow
    zIndex: 0,
  },
  timelineLineMuted: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)', // Gray line for read items
  },
  nodeColumn: {
    width: 56,
    alignItems: 'center',
    zIndex: 10,
  },
  nodeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FCF5F1', // Matches app bg to look carved out
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    }),
  },
  nodeCircleMuted: {
    backgroundColor: '#FCF5F1',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    elevation: 0,
    shadowOpacity: 0,
  },
  bubbleColumn: {
    flex: 1,
    paddingRight: 10,
  },
  bubbleCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderTopLeftRadius: 4, // Makes it look like a bubble pointing left
    padding: 18,
    position: 'relative',
  },
  bubbleCardUnread: {
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 114, 0.15)',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  bubbleCardRead: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.05)',
  },
  bubblePointer: {
    position: 'absolute',
    left: -6,
    top: 0,
    width: 12,
    height: 12,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 3,
    transform: [{ rotate: '-45deg' }],
  },
  bubblePointerUnread: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 142, 114, 0.15)',
  },
  bubblePointerRead: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.05)',
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bubbleTitle: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
  },
  bubbleTitleRead: {
    color: '#64748B',
  },
  bubbleDate: {
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
    color: '#94A3B8',
  },
  bubbleDesc: {
    fontSize: RFValue(11),
    fontFamily: FONTS.medium,
    color: '#3B2F2F',
    lineHeight: RFValue(18),
  },
  bubbleDescRead: {
    color: '#64748B',
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 47, 47, 0.05)',
  },
  bubbleTime: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: '#CBD5E1',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTxt: {
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  viewedTxt: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: '#CBD5E1',
    fontStyle: 'italic',
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
