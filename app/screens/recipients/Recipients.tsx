import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TextInput,
  useWindowDimensions,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  SectionList,
  Modal,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GetReceiverInfoList, GetReferDetails, DeleteBeneficiary } from "app/http-services";
import COLORS from "app/constants/Colors";
import { FONTS, SIZES, SHADOWS } from "app/constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";
import Vector from "app/assets/vectors";
import CountryFlag from "react-native-country-flag";
import Toast from "react-native-toast-message";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getCountryISO2 = require("country-iso-3-to-2");

const Recipients = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const currentToken = useRecoilValue(ProfileState);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState("");
  const [recipientList, setRecipientList] = useState<any[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [recipientToDelete, setRecipientToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchReceiverList();
    fetchReferDetails();
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReceiverList().finally(() => setRefreshing(false));
  };

  const fetchReceiverList = async () => {
    try {
      setLoading(true);
      const response = await GetReceiverInfoList(currentToken.tokenId || "");
      if (response.status === 200) {
        const _data = response?.data?.ReceiverDetails;
        if (Array.isArray(_data)) {
          const grouped = groupRecipients(_data);
          setRecipientList(_data);
          setFilteredRecipients(grouped);
        }
      }
    } catch (err) {
      console.error("Fetch recipients error:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupRecipients = (data: any[]) => {
    const groupedMap: Record<string, any[]> = data.reduce((acc, curr) => {
      const groupKey = curr.Country || curr.CountryCode || "Others";
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(curr);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.keys(groupedMap)
      .sort((a, b) => a.localeCompare(b))
      .map((country) => ({
        title: country,
        data: groupedMap[country],
        isoCode: groupedMap[country][0]?.CountryCode || ""
      }));
  };

  const fetchReferDetails = async () => {
    try {
      const response = await GetReferDetails(currentToken.tokenId || "");
      if (response.status === 200) {
        setReward(response?.data?.Refer?.PotentialEarning);
      }
    } catch (err) {
      console.error("Error refer details:", err);
    }
  };

  const handleSearch = (text: string) => {
    const safeText = text || "";
    setSearch(safeText);
    if (!safeText.trim()) {
      const grouped = groupRecipients(recipientList);
      setFilteredRecipients(grouped);
      return;
    }
    const lowerSearch = safeText.toLowerCase();
    const filtered = recipientList.filter((r) =>
      `${r.FirstName || ""} ${r.LastName || ""} ${r.ReceiverName || ""} ${r.Country || ""}`.toLowerCase().includes(lowerSearch)
    );
    const grouped = groupRecipients(filtered);
    setFilteredRecipients(grouped);
  };

  const handleDelete = (recipient: any) => {
    setRecipientToDelete(recipient);
    setDeleteModalVisible(true);
  };

  const performDelete = async () => {
    if (!recipientToDelete) return;

    try {
      setIsDeleting(true);
      const res = await DeleteBeneficiary({
        ReceiverID: recipientToDelete.ReceiverID,
        remitterId: currentToken.remitterId,
        tokenId: currentToken.tokenId || "",
      });
      if (res.status === 200) {
        setDeleteModalVisible(false);
        Toast.show({ type: "success", text1: "Recipient Removed" });
        fetchReceiverList();
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Remove Failed" });
    } finally {
      setIsDeleting(false);
      setRecipientToDelete(null);
    }
  };

  const handleSendMoney = async (recipient: any) => {
    await AsyncStorage.setItem('selectedRecipientCurrency', recipient?.CountryCode || '');
    navigation.navigate("SendMoney", { editData: recipient });
  };

  const menuStyles = {
    optionsContainer: {
      borderRadius: 15,
      padding: 5,
      marginTop: 35,
      width: 160,
      ...SHADOWS.shadow,
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ELITE WALNUT HEADER */}
      <View style={styles.eliteHeader}>
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButtonGlass}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#FCF5F1" />
            </TouchableOpacity>
            
            <View style={styles.headerTitles}>
              <Text style={styles.headerMainTitle}>My Recipients</Text>
              <View style={styles.safelyProtectedRow}>
                <View style={styles.statusDotPulse} />
                <Text style={styles.safelyProtectedText}>SAFELY PROTECTED</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("AddRecipients")}
              style={styles.headerAddBtn}
            >
              <LinearGradient
                colors={['#FFB09C', '#FF8E72']}
                style={styles.headerAddBtnGradient}
              >
                <Feather name="plus" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Integrated Search Bar */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchInner}>
              <Feather name="search" size={18} color="rgba(252, 245, 241, 0.4)" />
              <TextInput
                placeholder="Search name or country..."
                placeholderTextColor="rgba(252, 245, 241, 0.4)"
                value={search}
                onChangeText={handleSearch}
                style={styles.searchInputRefined}
                // @ts-ignore
                outlineStyle="none"
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* PILL COUNTRY FILTERS */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            onPress={() => handleSearch("")}
            style={[
              styles.filterPill,
              search === "" && styles.filterPillActive
            ]}
          >
            <Text style={[
              styles.filterPillText,
              search === "" && styles.filterPillTextActive
            ]}>All Countries</Text>
          </TouchableOpacity>
          
          {(filteredRecipients || []).map((section) => (
            <TouchableOpacity
              key={section?.title || Math.random().toString()}
              onPress={() => handleSearch(section?.title || "")}
              style={[
                styles.filterPill,
                search === section?.title && styles.filterPillActive
              ]}
            >
              <CountryFlag
                isoCode={getCountryISO2(section?.isoCode) || ""}
                size={14}
                style={{ borderRadius: 3, marginRight: 8 }}
              />
              <Text style={[
                styles.filterPillText,
                search === section?.title && styles.filterPillTextActive
              ]}>{section?.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* RECIPIENTS LIST */}
      <View style={styles.listWrapper}>
        {loading && recipientList.length === 0 ? (
          <View style={styles.loaderCenter}>
             <ActivityIndicator size="large" color="#FF8E72" />
             <Text style={styles.loaderLabel}>Securing recipient list...</Text>
          </View>
        ) : (
          <SectionList
            sections={filteredRecipients}
            keyExtractor={(item) => item.ReceiverID}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8E72" />}
            renderSectionHeader={({ section: { title, data } }) => (
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleBox}>
                  <View style={styles.accentBar} />
                  <Text style={styles.sectionTitleText}>{title.toUpperCase()}</Text>
                </View>
                <View style={styles.countBadgeElite}>
                  <Text style={styles.countBadgeText}>{data.length} PEOPLE</Text>
                </View>
              </View>
            )}
            renderItem={({ item }) => {
              const isSelected = selectedRecipientId === item.ReceiverID;
              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setSelectedRecipientId(item.ReceiverID)}
                  style={[
                    styles.recipientEliteCard,
                    isSelected && styles.recipientEliteCardSelected
                  ]}
                >
                  <View style={styles.cardContentRow}>
                    <View style={styles.avatarWrapperElite}>
                      <View style={styles.initialsBox}>
                        <Text style={styles.initialsText}>
                          {item.FirstName?.[0]}{item.LastName?.[0]}
                        </Text>
                      </View>
                      <View style={styles.flagOverlayElite}>
                        <CountryFlag
                          isoCode={getCountryISO2(item.CountryCode) || ""}
                          size={12}
                          style={{ borderRadius: 2 }}
                        />
                      </View>
                    </View>

                    <View style={styles.cardInfoElite}>
                      <Text style={styles.cardNameText}>{item.FirstName} {item.LastName}</Text>
                      <Text style={styles.cardStatusText}>
                        {item.RecieverMobileNo || "Verified contact"}
                      </Text>
                    </View>

                    <View style={styles.cardActionElite}>
                      <Menu>
                        <MenuTrigger style={styles.menuTriggerElite}>
                          <MaterialCommunityIcons name="dots-vertical" size={22} color="#DBCAC0" />
                        </MenuTrigger>
                        <MenuOptions customStyles={menuStyles}>
                          <MenuOption onSelect={() => handleSendMoney(item)}>
                            <View style={styles.menuItemRow}>
                              <Feather name="send" size={16} color="#3B2F2F" />
                              <Text style={styles.menuItemLabel}>Send Money</Text>
                            </View>
                          </MenuOption>
                          <MenuOption onSelect={() => navigation.navigate("AddRecipients", { editData: item })}>
                            <View style={styles.menuItemRow}>
                              <Feather name="edit-3" size={16} color="#3B2F2F" />
                              <Text style={styles.menuItemLabel}>Edit Details</Text>
                            </View>
                          </MenuOption>
                          <MenuOption onSelect={() => handleDelete(item)}>
                            <View style={[styles.menuItemRow, { borderBottomWidth: 0 }]}>
                              <Feather name="trash-2" size={16} color="#EF4444" />
                              <Text style={[styles.menuItemLabel, { color: '#EF4444' }]}>Remove</Text>
                            </View>
                          </MenuOption>
                        </MenuOptions>
                      </Menu>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons name="account-search-outline" size={48} color="#D2C5BD" />
                </View>
                <Text style={styles.emptyMainTitle}>No Recipients Yet</Text>
                <Text style={styles.emptySubDesc}>Start by adding a new recipient to your secure list.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* DELETE MODAL - ELITE REFINEMENT */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayElite}>
          <View style={styles.modalBoxElite}>
            <View style={styles.modalIconBoxElite}>
              <View style={styles.redIconCircle}>
                <Feather name="trash-2" size={32} color="#EF4444" />
              </View>
            </View>

            <Text style={styles.modalTitleElite}>Remove Recipient?</Text>
            <Text style={styles.modalDescElite}>
              Are you sure you want to remove <Text style={{ color: '#3B2F2F', fontFamily: FONTS.bold }}>{recipientToDelete?.FirstName} {recipientToDelete?.LastName}</Text> from your secure contact list?
            </Text>

            <View style={styles.modalActionsElite}>
              <TouchableOpacity
                style={styles.modalConfirmBtnElite}
                disabled={isDeleting}
                onPress={performDelete}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmTextElite}>Yes, Remove</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtnElite}
                onPress={() => { if (!isDeleting) setDeleteModalVisible(false); }}
                disabled={isDeleting}
              >
                <Text style={styles.modalCancelTextElite}>Keep Recipient</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF5F1",
  },
  eliteHeader: {
    backgroundColor: '#1C0D06',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingBottom: 35,
    ...SHADOWS.shadow,
  },
  safeHeader: {
    paddingHorizontal: 25,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    marginBottom: 25,
  },
  backButtonGlass: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitles: {
    flex: 1,
    marginLeft: 20,
  },
  headerMainTitle: {
    fontSize: RFValue(20),
    fontFamily: FONTS.bold,
    color: '#FCF5F1',
    letterSpacing: 1,
  },
  safelyProtectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  safelyProtectedText: {
    fontSize: RFValue(8),
    color: 'rgba(252, 245, 241, 0.6)',
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  headerAddBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    ...SHADOWS.shadow,
  },
  headerAddBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    marginTop: 5,
  },
  searchInner: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  searchInputRefined: {
    flex: 1,
    marginLeft: 15,
    fontSize: RFValue(12),
    fontFamily: FONTS.medium,
    color: '#FCF5F1',
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    // @ts-ignore
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  filterSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  filterScrollContent: {
    paddingHorizontal: 25,
    gap: 12,
    paddingVertical: 5,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.05)',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  filterPillActive: {
    backgroundColor: '#3B2F2F',
    borderColor: '#3B2F2F',
  },
  filterPillText: {
    fontSize: RFValue(11),
    fontFamily: FONTS.bold,
    color: '#8E7F77',
  },
  filterPillTextActive: {
    color: '#FCF5F1',
  },
  listWrapper: {
    flex: 1,
    paddingHorizontal: 25,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    marginTop: 10,
  },
  sectionTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentBar: {
    width: 4,
    height: 16,
    backgroundColor: '#FF8E72',
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitleText: {
    fontSize: RFValue(10),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: 1.2,
  },
  countBadgeElite: {
    backgroundColor: 'rgba(255, 142, 114, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
    color: '#FF8E72',
    letterSpacing: 0.5,
  },
  recipientEliteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.02)',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15 },
      android: { elevation: 3 }
    })
  },
  recipientEliteCardSelected: {
    borderColor: '#FF8E72',
    backgroundColor: '#FEF9F6',
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapperElite: {
    width: 54,
    height: 54,
    position: 'relative',
  },
  initialsBox: {
    flex: 1,
    backgroundColor: '#F8F4F1',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.05)',
  },
  initialsText: {
    fontSize: RFValue(14),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  flagOverlayElite: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    padding: 2,
    borderRadius: 6,
    ...SHADOWS.shadow,
  },
  cardInfoElite: {
    flex: 1,
    marginLeft: 18,
  },
  cardNameText: {
    fontSize: RFValue(13),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  cardStatusText: {
    fontSize: RFValue(11),
    fontFamily: FONTS.medium,
    color: '#8E7F77',
    marginTop: 2,
  },
  cardActionElite: {
    marginLeft: 10,
  },
  menuTriggerElite: {
    padding: 8,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 47, 47, 0.05)',
  },
  menuItemLabel: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  loaderLabel: {
    marginTop: 15,
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#8E7F77',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(219, 202, 192, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyMainTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    marginBottom: 10,
  },
  emptySubDesc: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#8E7F77',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlayElite: {
    flex: 1,
    backgroundColor: 'rgba(28, 13, 6, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  modalBoxElite: {
    width: '100%',
    backgroundColor: '#FCF5F1',
    borderRadius: 36,
    padding: 35,
    alignItems: 'center',
    ...SHADOWS.shadow,
  },
  modalIconBoxElite: {
    marginBottom: 20,
  },
  redIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.shadow,
  },
  modalTitleElite: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    marginBottom: 12,
  },
  modalDescElite: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: '#8E7F77',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 35,
  },
  modalActionsElite: {
    width: '100%',
    gap: 15,
  },
  modalConfirmBtnElite: {
    height: 64,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.shadow,
  },
  modalConfirmTextElite: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  modalCancelBtnElite: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelTextElite: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    letterSpacing: 0.5,
  },
});

export default Recipients;
