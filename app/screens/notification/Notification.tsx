import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useRecoilValue } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { ProfileState } from "../../atoms";
import Container from "app/theme/Container";
import { GetNotificationListInfo, UpdateNotification, VerifyTPIN, WalletTransfer, DenyWalletRequest } from "app/http-services";
import { FONTS } from "app/constants/Assets";
import Vector from "app/assets/vectors";
import ToastConfig from "app/components/ToastConfig";
import moment from "moment";

const Notification = () => {
  const currentToken = useRecoilValue(ProfileState);
  const [currency, setCurrency] = useState("£");
  const [reward, setReward] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  const [openVerifyTpin, setOpenVerifyTpin] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [showEnteredPin, setShowEnteredPin] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await GetNotificationListInfo({});
        const data = response?.data?.Notifications || [];

        const notificationTypes: Record<number, string> = {
          1: "Registration",
          2: "Wallet Update",
          4: "Transaction",
        };

        // 🔹 Load stored read statuses
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
          
          let type = notificationTypes[item.NotificationMasterId];
          if (!type) {
            if (item.NotificationMessage && item.NotificationMessage.toLowerCase().includes("request")) {
              type = "Wallet Request";
            } else {
              type = "Other";
            }
          }

          let normalizedStatus = "Pending";
          if (item.Status === "Denied" || item.Type === "Wallet_Request_Denied" || (item.NotificationMessage && item.NotificationMessage.toLowerCase().includes("denied"))) {
            normalizedStatus = "Denied";
          } else if (item.Status === "Approved" || item.Type === "Wallet_Request_Approved" || (item.NotificationMessage && item.NotificationMessage.toLowerCase().includes("approved"))) {
            normalizedStatus = "Approved";
          }

          let description = item.NotificationMessage;
          if (type === "Wallet Request") {
            if (normalizedStatus === "Approved" || normalizedStatus === "Denied") {
              description = `Your wallet request of £${item.Amount} to ${item.RemitterId} has been ${normalizedStatus.toLowerCase()}.`;
            } else if (item.FromRemitterEmail && item.Amount) {
              description = `${item.FromRemitterEmail} has requested £${item.Amount} from you.`;
            }
          }

          return {
            id: item.NotificationLogId,
            masterId: item.NotificationMasterId,
            type: type,
            description: description,
            time: item.NotificationCreatedDate || "",
            remitterId: item.FromRemitterId,
            remitterEmail: item.FromRemitterEmail,
            amount: item.Amount,
            rawMessage: item.NotificationMessage,
            status: normalizedStatus,
            unread:
              localItem?.unread !== undefined
                ? localItem.unread
                : item.NotificationIsread === "False",
          };
        });

        // Sort notifications: latest first (descending order by date)
        mappedNotifications.sort((a: any, b: any) => {
          const formats = ["M/D/YYYY h:mm:ss A", "MM/DD/YYYY hh:mm:ss A", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DDTHH:mm:ss.SSSZ"];
          let dateA = moment(a.time, formats, true).valueOf();
          let dateB = moment(b.time, formats, true).valueOf();
          
          if (isNaN(dateA)) dateA = moment(a.time).valueOf();
          if (isNaN(dateB)) dateB = moment(b.time).valueOf();

          const valA = isNaN(dateA) ? 0 : dateA;
          const valB = isNaN(dateB) ? 0 : dateB;

          if (valA > valB) return -1;
          if (valA < valB) return 1;
          return 0;
        });

        setNotifications(mappedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isFocused]);

  const handleNotificationPress = async (item: any) => {
    if (item.type === "Wallet Request") {
      setSelectedRequest(item);
      setModalVisible(true);
    }
    
    try {
      // 1️⃣ Call UpdateNotification API
      await UpdateNotification({
        NotificationlogId: item.id,
        NotificationMasterId: item.masterId,
      });

      // 2️⃣ Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, unread: false } : n
        )
      );

      // 3️⃣ Save in AsyncStorage
      await AsyncStorage.setItem(
        `notification_${item.id}`,
        JSON.stringify({ ...item, unread: false })
      );
    } catch (err) {
      console.error("Failed to update or refresh notifications:", err);
    }
  };

  const handleApprovePress = () => {
    setModalVisible(false);
    setOpenVerifyTpin(true);
  };

  const handleDenyPress = async () => {
    if (!selectedRequest) return;
    setModalVisible(false);
    try {
      const reqBody = {
        WalletRequestId: selectedRequest.id,
        NotificationLogId: selectedRequest.id,
        ToRemitterID: selectedRequest.remitterId,
      };
      
      const res = await DenyWalletRequest(reqBody);
      const statusCode = res?.data?.StatusCode;
      
      if (statusCode === "ER0000" || statusCode === "0") {
        setToastMsg(res?.data?.StatusMsg || "Request denied successfully");
        setShowToast(true);

        try {
          await UpdateNotification({
            NotificationlogId: selectedRequest.id,
            NotificationMasterId: selectedRequest.masterId,
            Status: "Denied"
          });
        } catch (err) {
          console.error("Failed to update notification after deny:", err);
        }

        setTimeout(() => {
          navigation.navigate("HomeDrawer" as never);
        }, 1500);
      } else {
        setToastMsg(res?.data?.StatusMsg || "Failed to deny request");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Deny wallet request failed", error);
      setToastMsg("Something went wrong. Please try again later.");
      setShowToast(true);
    }
  };

  const handleVerifyTpinSubmit = async () => {
    setVerifyLoading(true);
    try {
      const verifyRes = await VerifyTPIN({ TPIN: enteredPin });
      if (verifyRes?.data?.StatusCode === "ER0000" || verifyRes?.data?.StatusCode === "0") {
        const reqBody = {
          ToRemitterID: selectedRequest.remitterId,
          Amount: selectedRequest.amount,
          RemitterEmail: selectedRequest.remitterEmail,
          TPIN: enteredPin,
          WalletRequestId: selectedRequest.id
        };

        const res = await WalletTransfer(reqBody);
        
        const statusCode = res?.data?.StatusCode;
        if (statusCode === "ER0000" || statusCode === "0" || statusCode === "ER0073") {
           setToastMsg(res?.data?.StatusMsg || "Money sent successfully");
           setShowToast(true);
           
           try {
             await UpdateNotification({
               NotificationlogId: selectedRequest.id,
               NotificationMasterId: selectedRequest.masterId,
               Status: "Approved"
             });
           } catch (err) {
             console.error("Failed to update notification after transfer:", err);
           }

           setOpenVerifyTpin(false);
           setEnteredPin("");
           setShowEnteredPin(false);
           setModalVisible(false);
           setTimeout(() => {
             navigation.navigate("HomeDrawer" as never);
           }, 1500);
        } else {
           setToastMsg(res?.data?.StatusMsg || "Failed to transfer money");
           setShowToast(true);
        }
      } else {
         setToastMsg(verifyRes?.data?.StatusMessage || "Invalid TPIN");
         setShowToast(true);
      }
    } catch (error) {
       console.error("TPIN Verify / Transfer failed", error);
       setToastMsg("Something went wrong. Please try again later.");
       setShowToast(true);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.contentBackground}>
        <Container>
          {loading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={{ marginTop: 20 }}
          />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <Text style={styles.noNotifications}>
                No notifications available
              </Text>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  key={item.id}
                  onPress={() => handleNotificationPress(item)}
                >
                  <View style={[styles.card, item.unread && styles.unreadCard]}>
                    <View style={styles.cardContent}>
                      <View style={styles.row}>
                        <Text style={styles.title} numberOfLines={1}>{item.type}</Text>
                        <View style={styles.rightRow}>
                          <Text style={styles.time}>{item.time}</Text>
                          {item.unread && <View style={styles.dot} />}
                        </View>
                      </View>
                      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
        </Container>
      </View>

      {/* WALLET REQUEST DETAILS MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wallet Request Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Details Box */}
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Requested Remitter ID:</Text>
                <Text style={styles.detailValueBold}>{selectedRequest?.remitterId || "-"}</Text>
              </View>
              <View style={styles.divider} />
              
              {selectedRequest?.status === "Pending" && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Requested Email ID:</Text>
                    <Text style={styles.detailValueBold}>{selectedRequest?.remitterEmail || "-"}</Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Requested Amount:</Text>
                <Text style={styles.detailValueGreen}>£{selectedRequest?.amount || "0.00"}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Requested Date:</Text>
                <Text style={styles.detailValue}>{selectedRequest?.time}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.messageBox}>
                <Text style={styles.detailLabel}>Message:</Text>
                <Text style={styles.detailMessageText}>{selectedRequest?.description}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              {selectedRequest?.status === "Denied" || selectedRequest?.status === "Approved" ? (
                <Text style={[styles.statusText, { color: selectedRequest?.status === "Denied" ? "#EF4444" : "#10B981" }]}>
                  Request {selectedRequest.status}
                </Text>
              ) : (
                <>
                  <TouchableOpacity style={styles.denyButton} onPress={handleDenyPress}>
                    <Text style={styles.denyButtonText}>Deny</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.approveButton} onPress={handleApprovePress}>
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Verify TPIN Modal */}
      <Modal
        visible={openVerifyTpin}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setOpenVerifyTpin(false);
          setEnteredPin("");
          setShowEnteredPin(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
              onPress={() => {
                setOpenVerifyTpin(false);
                setEnteredPin("");
                setShowEnteredPin(false);
              }}
            >
              <Vector as="ionicons" name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20, marginTop: 10 }}>
              <Vector
                as="ionicons"
                name="lock-closed"
                size={22}
                color="#FF8E72"
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 18, fontFamily: FONTS.bold, color: "#FF8E72" }}>
                Enter Transaction PIN
              </Text>
            </View>

            {selectedRequest && (
              <View style={{ backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: "#6B7280", fontFamily: FONTS.medium }}>Transfer To</Text>
                  <Text style={{ fontSize: 13, color: "#111827", fontFamily: FONTS.bold }}>{selectedRequest.remitterId}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: "#6B7280", fontFamily: FONTS.medium }}>Beneficiary Email</Text>
                  <Text style={{ fontSize: 13, color: "#111827", fontFamily: FONTS.bold }}>{selectedRequest.remitterEmail}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB", alignItems: "center" }}>
                  <Text style={{ fontSize: 14, color: "#374151", fontFamily: FONTS.bold }}>Amount</Text>
                  <Text style={{ fontSize: 16, color: "#FF8E72", fontFamily: FONTS.bold }}>£{selectedRequest.amount}</Text>
                </View>
              </View>
            )}

            <Text style={{ fontSize: 14, color: "#4B5563", textAlign: "center", marginBottom: 20, fontFamily: FONTS.medium }}>
              Enter your secure 4-digit TPIN to complete this transfer.
            </Text>

            <View style={{ alignSelf: "center", position: "relative", marginBottom: 24, width: "70%" }}>
              <TextInput
                placeholder="••••"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showEnteredPin}
                value={enteredPin}
                onChangeText={(val) => setEnteredPin(val.replace(/[^0-9]/g, ''))}
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 12,
                  fontSize: 24,
                  letterSpacing: 8,
                  textAlign: "center",
                  paddingVertical: 14,
                  color: "#111827",
                  fontFamily: FONTS.bold,
                  borderWidth: 1,
                  borderColor: "#E5E7EB"
                }}
              />
              <TouchableOpacity
                onPress={() => setShowEnteredPin(!showEnteredPin)}
                style={{
                  position: "absolute",
                  right: 16,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 2,
                }}
              >
                <Vector
                  as="materialcommunityicons"
                  name={showEnteredPin ? "eye" : "eye-off"}
                  size={22}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setOpenVerifyTpin(false);
                  setEnteredPin("");
                  setShowEnteredPin(false);
                }}
                disabled={verifyLoading}
                style={{ flex: 1, backgroundColor: "#F3F4F6", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
              >
                <Text style={{ color: "#374151", fontFamily: FONTS.bold, fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleVerifyTpinSubmit}
                disabled={enteredPin.length !== 4 || verifyLoading}
                style={[
                  { flex: 1, backgroundColor: "#FF8E72", paddingVertical: 14, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center" },
                  (enteredPin.length !== 4 || verifyLoading) && { opacity: 0.5 }
                ]}
              >
                {verifyLoading && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
                <Text style={{ color: "#fff", fontFamily: FONTS.bold, fontSize: 15 }}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ToastConfig visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF8E72", // matches header so the iOS notch is blue
  },
  contentBackground: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#FF8E72",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: FONTS.semiBold,
    color: "#fff",
  },
  errorText: {
    color: "red",
    marginTop: 20,
    textAlign: "center",
  },
  noNotifications: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  unreadCard: {
    backgroundColor: "#F9FAFB",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: FONTS.bold,
    color: "#1C1C1E",
    flex: 1,
    paddingRight: 10,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  time: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: "#6B7280",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DC2626",
    marginLeft: 6,
  },
  description: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: "#6B7280",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: "#1C1C1E",
  },
  detailsBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: "#6B7280",
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: "#1C1C1E",
    textAlign: "right",
    flex: 1,
  },
  detailValueBold: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: "#1C1C1E",
    textAlign: "right",
    flex: 1,
  },
  detailValueGreen: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: "#059669",
    textAlign: "right",
    flex: 1,
  },
  messageBox: {
    paddingTop: 12,
  },
  detailMessageText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: "#1C1C1E",
    marginTop: 6,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  denyButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  denyButtonText: {
    color: "#EF4444",
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  approveButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#10B981",
  },
  approveButtonText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  statusText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    textAlign: "center",
    flex: 1,
    paddingVertical: 10,
  },
});

export default Notification;
