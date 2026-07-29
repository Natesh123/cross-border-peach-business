import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { GetDocumentList, RemitterUpgrade } from "app/http-services";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "app/constants/Colors";
import Animated, { FadeInDown, FadeInUp, FadeInRight, useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const UploadnewDocuments: React.FC = () => {
  const currentToken = useRecoilValue(ProfileState);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState<any>({ value: "", error: "" });
  const [documentGroups, setDocumentGroups] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [frontDoc, setFrontDoc] = useState<any>(null);
  const [backDoc, setBackDoc] = useState<any>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Custom Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "warning" as "warning" | "error" | "info"
  });

  const showFeedback = (title: string, message: string, type: "warning" | "error" | "info" = "warning") => {
    setFeedbackModal({ visible: true, title, message, type });
  };

  useEffect(() => {
    if (isFocused) {
      fetchDocumentList(currentToken.tokenId);
    }
  }, [isFocused]);

  const getExtensionFromMime = (mime: string) => {
    switch (mime) {
      case "image/png": return ".png";
      case "image/jpeg":
      case "image/jpg": return ".jpg";
      case "application/pdf": return ".pdf";
      default: return "";
    }
  };

  const fetchDocumentList = async (tokenId: string) => {
    try {
      setLoading(true);
      const res = await GetDocumentList(tokenId);
      if (res.status === 200 && res.data.StatusCode === "ER0000") {
        const types = Array.isArray(res.data.DocumentTypes) ? res.data.DocumentTypes : [];
        let groupedDocs = types.map((type: any) => ({
          type: type.Type || "",
          typeDocuments: Array.isArray(type.Documents) ? type.Documents : [],
          subCategories: Array.isArray(type.SubCategories) ? type.SubCategories.map((sub: any) => ({
            name: sub?.Name?.trim() ? sub.Name : null,
            documents: Array.isArray(sub.Documents) ? sub.Documents : [],
          })) : [],
          expanded: false,
          visibleSubCategory: null,
        }));
        groupedDocs.sort((a: any, b: any) => {
          const aIsID = a.type.toLowerCase().startsWith("id-");
          const bIsID = b.type.toLowerCase().startsWith("id-");
          if (aIsID && !bIsID) return -1;
          if (!aIsID && bIsID) return 1;
          return 0;
        });
        setDocumentGroups(groupedDocs);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async (side: "front" | "back") => {
    if (!documentType.value) {
      setShowPopup(true);
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        if (file.size && file.size > 2 * 1024 * 1024) {
          showFeedback(
            "File Too Large",
            "This file is too big (over 2MB). Please select a smaller file.",
            "error"
          );
          return;
        }
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          if (side === "front") setFrontDoc({ ...file, base64 });
          else setBackDoc({ ...file, base64 });
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      console.log("Error picking file:", err);
    }
  };

  const handleUpload = async () => {
    if (!documentType.value) {
      setDocumentType((prev: any) => ({ ...prev, error: "Please select document type" }));
      return;
    }
    if (!frontDoc || !backDoc) {
      showFeedback(
        "Photos Missing",
        "Please upload both the front and back photos of your document.",
        "warning"
      );
      return;
    }
    try {
      setLoading(true);
      const req = {
        TokenId: currentToken.tokenId,
        RemitterId: currentToken.remitterId,
        IdType: documentType.value,
        ImageType: getExtensionFromMime(frontDoc.mimeType),
        Imagebase64: frontDoc.base64,
        Imagename: frontDoc.name || `front${getExtensionFromMime(frontDoc.mimeType)}`,
        BackSideImageType: getExtensionFromMime(backDoc.mimeType),
        BackSideImagebase64: backDoc.base64,
        BackSideImagename: backDoc.name || `back${getExtensionFromMime(backDoc.mimeType)}`,
      };
      const res = await RemitterUpgrade(req);
      if (res.data.StatusCode === "ER0000") setShowSuccessPopup(true);
      else showFeedback("Upload Error", res.data.Status || "Something went wrong while uploading. Please try again.", "error");
    } catch (e) {
      showFeedback("System Error", "We are having trouble connecting. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderUploadZone = (side: "front" | "back") => {
    const file = side === "front" ? frontDoc : backDoc;
    const label = side === "front" ? "FRONT SIDE" : "BACK SIDE";
    const icon = side === "front" ? "camera-outline" : "document-text-outline";

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => pickFile(side)}
        style={[localStyles.uploadZone, file && localStyles.uploadZoneActive]}
      >
        <View style={[localStyles.zoneIconWrapper, file && localStyles.zoneIconWrapperActive]}>
          <Ionicons name={file ? "checkmark-done" : icon} size={24} color={file ? '#10B981' : '#A3968F'} />
        </View>

        <Text style={localStyles.zoneLabel}>{label}</Text>

        {file ? (
          <View style={localStyles.previewContainer}>
            {file.mimeType === "application/pdf" ? (
              <View style={localStyles.pdfPlaceholder}>
                <Ionicons name="document-text" size={32} color="#EF4444" />
                <Text style={localStyles.pdfText}>PDF READY</Text>
              </View>
            ) : (
              <Image source={{ uri: file.uri }} style={localStyles.previewImage} resizeMode="cover" />
            )}
            <View style={localStyles.previewOverlay}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
            </View>
          </View>
        ) : (
          <View style={localStyles.browseBtn}>
            <Text style={localStyles.browseBtnText}>SELECT PHOTO</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={localStyles.mainWrapper}>
          
          <View style={localStyles.splitCard}>
            {/* TOP SECTION: DARK WALNUT */}
            <View style={localStyles.topSection}>
              <View style={localStyles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backIconCircle}>
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={localStyles.badgeContLight}>
                  <Text style={localStyles.badgeTextLight}>SECURE VAULT</Text>
                </View>
              </View>

              <Text style={localStyles.vaultTitleLarge}>Upload Document</Text>

              <View style={localStyles.translucentFeeBox}>
                <View style={localStyles.feeRow}>
                  <View style={localStyles.labelWithIcon}>
                    <Ionicons name="cloud-upload-outline" size={14} color="rgba(255,255,255,0.6)" />
                    <Text style={localStyles.feeLabelWhite}>Upload Progress</Text>
                  </View>
                  <Text style={localStyles.feeValueWhite}>{(frontDoc && backDoc) ? "100%" : (frontDoc || backDoc) ? "50%" : "0%"}</Text>
                </View>
                <View style={[localStyles.feeRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={localStyles.feeLabelWhite}>Current Task</Text>
                  <Text style={localStyles.feeValueWhite}>Adding Photos</Text>
                </View>
              </View>
            </View>

            {/* BOTTOM SECTION: WHITE/CREAM */}
            <View style={localStyles.bottomSection}>
              
              {/* STEP 01: SELECTION */}
              <View style={localStyles.stepContainer}>
                <View style={localStyles.stepHeader}>
                  <Text style={localStyles.stepText}>01</Text>
                  <Text style={localStyles.stepAction}>SELECT DOCUMENT TYPE</Text>
                </View>

                <View style={[localStyles.pickerContainer, documentType.error && localStyles.pickerError]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setShowDropdown(!showDropdown); setDocumentGroups(documentGroups.map(g => ({ ...g, expanded: false, visibleSubCategory: null }))); }}
                    style={localStyles.pickerTrigger}
                  >
                    <View style={localStyles.pickerInner}>
                      <View style={localStyles.pickerIconCont}>
                        <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                      </View>
                      <Text style={[localStyles.pickerValue, !documentType.value && localStyles.pickerPlaceholder]}>
                        {documentType.value?.includes(",") ? documentType.value.split(",")[1].trim() : (documentType.value || "Choose Document Type")}
                      </Text>
                    </View>
                    <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
                  </TouchableOpacity>

                  {showDropdown && (
                    <View style={localStyles.dropdownWrapper}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 300 }}>
                        {documentGroups.map((group, gIndex) => (
                          <View key={group.type}>
                            <TouchableOpacity
                              onPress={() => setDocumentGroups(documentGroups.map((g, i) => ({ ...g, expanded: i === gIndex ? !g.expanded : false, visibleSubCategory: null })))}
                              style={[localStyles.groupHeader, group.expanded && localStyles.groupHeaderActive]}
                            >
                              <Text style={[localStyles.groupHeaderText, group.expanded && localStyles.groupHeaderTextActive]}>{group.type}</Text>
                              <Ionicons name={group.expanded ? "remove" : "add"} size={16} color={group.expanded ? Colors.primary : "#94A3B8"} />
                            </TouchableOpacity>

                            {group.expanded && (
                              <View style={localStyles.itemsContainer}>
                                {group.typeDocuments.map((doc: string) => (
                                  <TouchableOpacity
                                    key={doc}
                                    onPress={() => { setDocumentType({ value: `${group.type}, ${doc}`, error: "" }); setShowDropdown(false); }}
                                    style={localStyles.docItem}
                                  >
                                    <View style={localStyles.dotIndicator} />
                                    <Text style={localStyles.docItemText}>{doc}</Text>
                                  </TouchableOpacity>
                                ))}
                                {group.subCategories.map((sub: any, sIndex: number) => (
                                  <View key={sIndex}>
                                    {sub.name && (
                                      <TouchableOpacity
                                        onPress={() => { const updated = [...documentGroups]; updated[gIndex].visibleSubCategory = updated[gIndex].visibleSubCategory === sub.name ? null : sub.name; setDocumentGroups(updated); }}
                                        style={localStyles.subCategoryHeader}
                                      >
                                        <Text style={localStyles.subCategoryText}>{sub.name}</Text>
                                        <Ionicons name={group.visibleSubCategory === sub.name ? "chevron-up" : "chevron-down"} size={14} color="#94A3B8" />
                                      </TouchableOpacity>
                                    )}
                                    {(group.visibleSubCategory === sub.name || !sub.name) && sub.documents.map((doc: string) => (
                                      <TouchableOpacity
                                        key={doc}
                                        onPress={() => { setDocumentType({ value: `${group.type}, ${doc}`, error: "" }); setShowDropdown(false); }}
                                        style={localStyles.docSubItem}
                                      >
                                        <Text style={localStyles.docSubItemText}>{doc}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* STEP 02: UPLOADS */}
              <View style={localStyles.stepContainer}>
                <View style={localStyles.stepHeader}>
                  <Text style={localStyles.stepText}>02</Text>
                  <Text style={localStyles.stepAction}>UPLOAD DOCUMENT PHOTOS</Text>
                </View>

                <View style={localStyles.uploadGrid}>
                  {renderUploadZone("front")}
                  {renderUploadZone("back")}
                </View>

                <View style={localStyles.protocolBox}>
                  <View style={localStyles.protocolIconCont}>
                    <Ionicons name="bulb-outline" size={18} color="#059669" />
                  </View>
                  <View style={localStyles.protocolContent}>
                    <Text style={localStyles.protocolTitle}>Upload Instructions</Text>
                    <Text style={localStyles.protocolSub}>
                      Make sure your photos are clear and easy to read.
                    </Text>
                  </View>
                </View>
              </View>

            </View>
          </View>

          {/* ACTION BUTTON - COLOR UPDATED TO PEACH */}
          <View style={localStyles.footer}>
            <TouchableOpacity 
              style={localStyles.sendButton} 
              onPress={handleUpload}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient colors={["#FF8E72", "#FF6B4A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={localStyles.sendButtonGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={localStyles.sendButtonText}>UPLOAD DOCUMENTS</Text>
                    <View style={localStyles.sendIconWrapper}>
                      <Ionicons name="arrow-up" size={20} color="#FF6B4A" />
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <View style={localStyles.secureBadge}>
              <Ionicons name="lock-closed" size={12} color="#059669" />
              <Text style={localStyles.secureText}>Your data is safe and encrypted</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* FEEDBACK MODAL (Simple English) */}
      <Modal visible={feedbackModal.visible} transparent animationType="fade">
        <View style={localStyles.modalOverlay}>
          <Animated.View entering={FadeInDown} style={localStyles.modalContent}>
            <View style={[localStyles.modalIconInner, feedbackModal.type === 'error' && { backgroundColor: '#FEF2F2' }]}>
              <Ionicons 
                name={feedbackModal.type === 'error' ? "close-circle" : "alert-circle"} 
                size={36} 
                color={feedbackModal.type === 'error' ? "#EF4444" : "#EAB308"} 
              />
            </View>
            <Text style={localStyles.modalTitle}>{feedbackModal.title}</Text>
            <Text style={localStyles.modalSubText}>{feedbackModal.message}</Text>
            <TouchableOpacity 
              onPress={() => setFeedbackModal(prev => ({ ...prev, visible: false }))} 
              style={[localStyles.modalDismissBtn, feedbackModal.type === 'error' && { backgroundColor: '#EF4444' }]}
            >
              <Text style={localStyles.modalDismissText}>OK, GOT IT</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* SELECTION POPUP (Simple English) */}
      <Modal visible={showPopup} transparent animationType="fade">
        <View style={localStyles.modalOverlay}>
          <Animated.View entering={FadeInDown} style={localStyles.modalContent}>
            <View style={localStyles.modalIconInner}>
              <Ionicons name="alert-circle" size={36} color="#EF4444" />
            </View>
            <Text style={localStyles.modalTitle}>Select Type First</Text>
            <Text style={localStyles.modalSubText}>
              Please choose a document type before selecting your photos.
            </Text>
            <TouchableOpacity onPress={() => setShowPopup(false)} style={localStyles.modalDismissBtn}>
              <Text style={localStyles.modalDismissText}>UNDERSTOOD</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* SUCCESS MODAL (Simple English) */}
      <Modal visible={showSuccessPopup} transparent animationType="fade">
        <View style={localStyles.modalOverlay}>
          <Animated.View entering={FadeInDown} style={localStyles.modalContent}>
            <View style={[localStyles.modalIconInner, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle" size={36} color="#10B981" />
            </View>
            <Text style={localStyles.modalTitle}>Upload Successful</Text>
            <Text style={localStyles.modalSubText}>
              We have received your documents. Our team will review them and let you know soon.
            </Text>
            <TouchableOpacity onPress={() => { setShowSuccessPopup(false); navigation.navigate("IdDocuments"); }} style={localStyles.modalPrimaryBtn}>
              <Text style={localStyles.modalPrimaryText}>GO BACK</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  mainWrapper: {
    paddingHorizontal: 20,
    paddingTop: 24,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
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
  },
  topSection: {
    backgroundColor: "#3B2F2F",
    padding: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  bottomSection: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  vaultTitleLarge: {
    fontSize: 26,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 24,
  },
  translucentFeeBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 20,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feeLabelWhite: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  feeValueWhite: {
    fontSize: 13,
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
  stepContainer: {
    marginBottom: 32,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  stepText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.executive.peachSoft,
    opacity: 0.8,
  },
  stepAction: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  pickerError: {
    borderColor: '#FECACA',
    borderWidth: 2,
  },
  pickerTrigger: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerIconCont: {
    width: 44,
    height: 44,
    backgroundColor: Colors.executive.peachSoft,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pickerValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.secondary,
  },
  pickerPlaceholder: {
    color: '#94A3B8',
  },
  dropdownWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  groupHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  groupHeaderActive: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  groupHeaderText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#64748B',
  },
  groupHeaderTextActive: {
    color: Colors.primary,
  },
  itemsContainer: {
    backgroundColor: '#fff',
  },
  docItem: {
    padding: 14,
    paddingLeft: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginRight: 12,
  },
  docItemText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  subCategoryHeader: {
    padding: 12,
    paddingLeft: 24,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subCategoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondary,
  },
  docSubItem: {
    padding: 12,
    paddingLeft: 36,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  docSubItemText: {
    fontSize: 13,
    color: '#64748B',
  },
  uploadGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  uploadZone: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  uploadZoneActive: {
    backgroundColor: '#fff',
    borderColor: '#10B981',
    borderWidth: 2,
    shadowColor: "#10B981",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  zoneIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  zoneIconWrapperActive: {
    backgroundColor: '#ECFDF5',
  },
  zoneLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.secondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  previewContainer: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfPlaceholder: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#EF4444',
    marginTop: 2,
  },
  browseBtn: {
    backgroundColor: '#3B2F2F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  browseBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  protocolBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  protocolIconCont: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
  },
  protocolContent: {
    flex: 1,
  },
  protocolTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#064E3B',
    marginBottom: 2,
  },
  protocolSub: {
    fontSize: 11,
    color: '#059669',
    lineHeight: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  sendButton: {
    width: "100%",
    borderRadius: 24,
    shadowColor: "#FF8E72",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  sendButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 32,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 24,
    height: 64,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sendIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  secureText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "700",
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
  modalIconInner: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.secondary,
    marginBottom: 12,
  },
  modalSubText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    fontWeight: '600',
  },
  modalDismissBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDismissText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  }
});

export default UploadnewDocuments;
