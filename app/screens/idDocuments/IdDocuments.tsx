import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import Container from "../../theme/Container";
import { GetDocument } from "app/http-services";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { useIsFocused } from "@react-navigation/native";
import SendMoneyHeader from "app/components/SendMoneyHeader";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { Ionicons } from "@expo/vector-icons";
import Colors from "app/constants/Colors";
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const getMimeType = (ext: string) => {
  const mimes: { [key: string]: string } = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimes[ext.toLowerCase()] || "application/octet-stream";
};

const StatusBadge = ({ status, dark = false }: { status: string, dark?: boolean }) => {
  const config = {
    ACCEPT: { label: "Verified", icon: "checkmark-seal", bg: dark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5", color: "#10B981" },
    REJECT: { label: "Declined", icon: "alert-circle", bg: dark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2", color: "#EF4444" },
    PROCESS: { label: "Securing", icon: "shield-half", bg: dark ? "rgba(255, 142, 114, 0.15)" : Colors.executive.peachSoft, color: Colors.primary },
    DEFAULT: { label: "In Vault", icon: "briefcase", bg: dark ? "rgba(255,255,255,0.1)" : "#F9FAFB", color: dark ? "#fff" : "#6B7280" }
  };
  const active = (config as any)[status] || config.DEFAULT;
  return (
    <View style={[localStyles.badgeCont, { backgroundColor: active.bg }]}>
      <Ionicons name={active.icon} size={14} color={active.color} style={{ marginRight: 6 }} />
      <Text style={[localStyles.badgeText, { color: active.color }]}>{active.label}</Text>
    </View>
  );
};

const DocumentDetailModal = ({ visible, onClose, doc, remitterId, handleDownload }: { visible: boolean, onClose: () => void, doc: any, remitterId: string, handleDownload: (url: string, type: string) => void }) => {
  if (!doc) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={localStyles.modalOverlay}>
        <Animated.View entering={FadeInDown.springify()} style={localStyles.modalContent}>
          <View style={localStyles.modalHeader}>
            <View style={localStyles.modalIconInner}>
              <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
            </View>
          </View>
          <View style={localStyles.modalBody}>
            <Text style={localStyles.modalTitle}>Vault Asset Security</Text>
            <View style={localStyles.modalPreviewFrame}>
              <Image source={doc.Document_Name ? { uri: doc.Document_Name } : require("../../assets/pdf.png")} style={localStyles.modalImage} resizeMode="contain" />
            </View>
            <View style={localStyles.infoGrid}>
              <View style={localStyles.infoItem}>
                <Text style={localStyles.infoLabel}>ASSET TYPE</Text>
                <Text style={localStyles.infoValue}>{doc.Document_Type?.split(",")[1]?.trim() || doc.Document_Type}</Text>
              </View>
              <View style={localStyles.infoItem}>
                <Text style={localStyles.infoLabel}>STATUS</Text>
                <StatusBadge status={doc.Status} />
              </View>
            </View>
            <View style={localStyles.modalActionWrapper}>
              <TouchableOpacity onPress={onClose} style={localStyles.modalCloseActionBtn}>
                <Text style={localStyles.modalCloseText}>Exit Vault</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const IdDocuments: React.FC = () => {
  const currentToken = useRecoilValue(ProfileState);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const [idDocuments, setIdDocuments] = useState<any[]>([]);
  const [nonIdDocuments, setNonIdDocuments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"ID" | "Non-ID">("ID");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const tabAnim = useSharedValue(0);

  useEffect(() => {
    tabAnim.value = withSpring(activeTab === "ID" ? 0 : 1, { damping: 15 });
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabAnim.value * ((width - 40 - 10) / 2) }],
  }));

  const handleDownload = async (url: string, docType: string) => {
    try {
      if (!url) { Alert.alert("Error", "Download link not available."); return; }
      setLoading(true);
      const urlParts = url.split('.');
      const extension = (urlParts.length > 1 ? urlParts.pop()?.split('?')[0]?.toLowerCase() : 'pdf') || 'pdf';
      const fileName = `${docType.replace(/\s+/g, '_')}.${extension}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const downloadRes = await FileSystem.downloadAsync(url, fileUri);
      if (downloadRes.status === 200) {
        if (Platform.OS === 'android') {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') { await MediaLibrary.saveToLibraryAsync(downloadRes.uri); Alert.alert("Success", "Saved to gallery."); }
          else { await Sharing.shareAsync(downloadRes.uri); }
        } else { await Sharing.shareAsync(downloadRes.uri); }
      }
    } catch (error) { Alert.alert("Error", "Could not download file."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isFocused) fetchSubmittedDocuments(currentToken.tokenId);
  }, [isFocused]);

  const fetchSubmittedDocuments = async (tokenId: string) => {
    try {
      setLoading(true);
      const res = await GetDocument(tokenId);
      if (res?.status === 200 && res.data.StatusCode === "ER0000") {
        const docs = Array.isArray(res.data.Document) ? res.data.Document : [];
        setIdDocuments(docs.filter((d: any) => d?.Document_Type?.toLowerCase().startsWith("id-document")));
        setNonIdDocuments(docs.filter((d: any) => d?.Document_Type?.toLowerCase().startsWith("non-id-document")));
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const verifiedCount = [...idDocuments, ...nonIdDocuments].filter(d => d.Status === "ACCEPT").length;
  const totalCount = idDocuments.length + nonIdDocuments.length;

  const renderAssetCard = (doc: any, idx: number) => (
    <Animated.View entering={FadeInRight.delay(idx * 100)} key={idx} style={localStyles.assetCardCont}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => { setSelectedDoc(doc); setShowDetailModal(true); }}
        style={localStyles.assetCard}
      >
        <View style={localStyles.assetCardHeader}>
          <View style={localStyles.labelWithIcon}>
            <View style={localStyles.iconCircleGrey}>
              <Ionicons name="document-text" size={16} color="#A3968F" />
            </View>
            <Text style={localStyles.assetLabel}>{doc.Document_Type?.split(",")[0]?.trim()}</Text>
          </View>
          <StatusBadge status={doc.Status} />
        </View>

        <View style={localStyles.assetCardBody}>
          <View style={localStyles.assetInfo}>
            <Text style={localStyles.assetName} numberOfLines={1}>
              {doc.Document_Type?.split(",")[1]?.trim() || doc.Document_Type}
            </Text>
            <Text style={localStyles.assetDate}>{moment(doc.UploadedDate).format("DD MMM YYYY")}</Text>
          </View>
          <View style={localStyles.assetPreviewBox}>
            <Image source={doc.Document_Name ? { uri: doc.Document_Name } : require("../../assets/pdf.png")} style={localStyles.assetImage} resizeMode="cover" />
          </View>
        </View>

        <View style={localStyles.assetCardFooter}>
          <Text style={localStyles.reviewText}>Review Security Details</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SendMoneyHeader title="My Documents" subtitle="SECURE IDENTITY VAULT" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={localStyles.mainWrapper}>
          {loading && totalCount === 0 && (
            <View style={localStyles.loadingOverlay}>
              <ActivityIndicator size="large" color="#3B2F2F" />
            </View>
          )}

          <View style={localStyles.splitCard}>
            <View style={localStyles.topSection}>
              <View style={localStyles.headerRow}>
                <View style={localStyles.labelWithIcon}>
                  <View style={localStyles.iconCircleWhite}>
                    <Ionicons name="shield-checkmark" size={16} color="#3B2F2F" />
                  </View>
                  <Text style={localStyles.labelWhite}>Identity Vault</Text>
                </View>
                <View style={localStyles.badgeContLight}>
                  <Text style={localStyles.badgeTextLight}>SECURE</Text>
                </View>
              </View>

              <Text style={localStyles.vaultTitleLarge}>Vault Assets</Text>

              <View style={localStyles.translucentFeeBox}>
                <View style={localStyles.feeRow}>
                  <Text style={localStyles.feeLabelWhite}>Total Documents</Text>
                  <Text style={localStyles.feeValueWhite}>{totalCount} Assets</Text>
                </View>
                <View style={[localStyles.feeRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={localStyles.feeLabelWhite}>Verified Status</Text>
                  <Text style={localStyles.feeValueWhite}>{verifiedCount} Secured</Text>
                </View>
              </View>
            </View>

            <View style={localStyles.swapButtonWrapper}>
              <TouchableOpacity style={localStyles.swapButton} onPress={() => navigation.navigate("UploadnewDocuments")} activeOpacity={0.8}>
                <Ionicons name="add" size={28} color="#3B2F2F" />
              </TouchableOpacity>
            </View>

            <View style={localStyles.bottomSection}>
              <View style={localStyles.sliderContainer}>
                <Animated.View style={[localStyles.sliderIndicator, indicatorStyle]} />
                <TouchableOpacity onPress={() => setActiveTab("ID")} style={localStyles.sliderTab}>
                  <Text style={[localStyles.sliderTabText, activeTab === "ID" && localStyles.activeSliderText]}>ID DOCUMENT</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab("Non-ID")} style={localStyles.sliderTab}>
                  <Text style={[localStyles.sliderTabText, activeTab === "Non-ID" && localStyles.activeSliderText]}>NON-ID DOCUMENT</Text>
                </TouchableOpacity>
              </View>

              {(activeTab === "ID" ? idDocuments : nonIdDocuments).length > 0 ? (
                (activeTab === "ID" ? idDocuments : nonIdDocuments).map((doc, idx) => renderAssetCard(doc, idx))
              ) : (
                <View style={localStyles.emptyVault}>
                  <Ionicons name="safe-outline" size={60} color="#D1D5DB" />
                  <Text style={localStyles.emptyVaultTitle}>VAULT EMPTY</Text>
                  <Text style={localStyles.emptyVaultSub}>Securely store your official records here.</Text>
                </View>
              )}
            </View>
          </View>

        </View>
      </ScrollView>

      <DocumentDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        doc={selectedDoc}
        remitterId={currentToken.remitterId}
        handleDownload={handleDownload}
      />
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  mainWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: "rgba(252,245,241,0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 32,
  },
  splitCard: {
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 12,
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
  },
  topSection: {
    backgroundColor: "#3B2F2F",
    padding: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  bottomSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingTop: 40,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircleWhite: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleGrey: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
  },
  labelWhite: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  vaultTitleLarge: {
    fontSize: 26,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 20,
  },
  translucentFeeBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 20,
    marginRight: 65,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  feeLabelWhite: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  feeValueWhite: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  badgeContLight: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTextLight: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "900",
  },
  swapButtonWrapper: {
    position: "absolute",
    right: 12,
    top: 220,
    zIndex: 20,
  },
  swapButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sliderContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    height: 50,
    borderRadius: 18,
    padding: 5,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  sliderIndicator: {
    position: 'absolute',
    top: 5,
    left: 5,
    bottom: 5,
    width: (SCREEN_WIDTH - 40 - 50) / 2,
    backgroundColor: Colors.secondary,
    borderRadius: 14,
  },
  sliderTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  activeSliderText: {
    color: '#fff',
    fontWeight: '900',
  },
  assetCardCont: {
    marginBottom: 16,
  },
  assetCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  assetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetLabel: {
    fontSize: 12,
    color: "#3B2F2F",
    fontWeight: "700",
  },
  badgeCont: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  assetCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  assetDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  assetPreviewBox: {
    width: 60,
    height: 45,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  assetCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reviewText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FCF5F1",
    borderRadius: 36,
    padding: 32,
    alignItems: "center",
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.secondary,
    marginBottom: 20,
  },
  modalPreviewFrame: {
    width: '100%',
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalImage: {
    width: '90%',
    height: '90%',
  },
  infoGrid: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoItem: {
    flex: 1,
    paddingHorizontal: 5,
  },
  infoLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '800',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '900',
  },
  modalActionWrapper: {
    width: '100%',
    gap: 12,
  },
  modalDownloadBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  modalDownloadText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  modalCloseActionBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyVault: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  emptyVaultTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.secondary,
    marginTop: 15,
  },
  emptyVaultSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 5,
    textAlign: 'center',
  }
});

export default IdDocuments;
