import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  FlatList,
  Modal,
  Platform,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { GetQuickWatchList, DeleteWatchList } from "app/http-services";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "app/constants/Colors";
import { FONTS, SIZES, SHADOWS } from "app/constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";
import Vector from "app/assets/vectors";

const { width } = Dimensions.get("window");

const QuickAddWatchlist: React.FC = () => {
  const currentToken = useRecoilValue(ProfileState);
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [watchList, setWatchList] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (isFocused) fetchQuickWatchList();
  }, [isFocused]);

  const fetchQuickWatchList = async () => {
    try {
      setLoading(true);
      const req = { RemitterID: currentToken?.remitterId };
      const response = await GetQuickWatchList(req);
      if (
        response.data.StatusCode === "ER0000" &&
        Array.isArray(response.data.Quickwatchdetail)
      ) {
        setWatchList(response.data.Quickwatchdetail);
      } else {
        setWatchList([]);
      }
    } catch (error) {
      console.error("GetQuickWatchList error:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      setLoading(true);
      const req = {
        RemitterID: currentToken?.remitterId,
        ToCountryCode: selectedItem.ToCountryCode,
      };
      const res = await DeleteWatchList(req);
      if (res.data.StatusCode === "ER0000") {
        setWatchList((prev) =>
          prev.filter((w) => w.ToCountryCode !== selectedItem.ToCountryCode)
        );
        Toast.show({
          type: "success",
          text1: "Success",
          text2: res?.data?.StatusMsg || "Deleted Success",
          position: "top",
        });
      }
    } catch (error) {
      console.error("DeleteWatchList error:", error);
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setSelectedItem(null);
    }
  };

  const filteredData = watchList.filter(
    (item) =>
      item.ToCountryName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.ToCurrency?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.ToCountryCode?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleEdit = (item: any) => {
    navigation.navigate("QuickAddWatchlistForm", { editItem: item });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.watchlistEliteCard}>
      <View style={styles.cardHeaderElite}>
        <View style={styles.cardCountryInfo}>
          <View style={styles.avatarContainerElite}>
            <View style={styles.avatarBoxElite}>
              {item.CountryFlag ? (
                <Image source={{ uri: item.CountryFlag }} style={styles.flagIconElite} />
              ) : (
                <MaterialCommunityIcons name="currency-eur" size={24} color="#3B2F2F" />
              )}
            </View>
            <View style={styles.flagOverlayElite}>
               {/* This can be a mini flag or currency icon if needed */}
               <MaterialCommunityIcons name="trending-up" size={10} color="#FF8E72" />
            </View>
          </View>
          <View style={styles.cardTitleBox}>
            <Text style={styles.itemTitleText}>{item.ToCountryName}</Text>
            <Text style={styles.itemSubtitleText}>1 GBP → {item.ToCurrency}</Text>
          </View>
        </View>

        <View style={styles.cardActionRowElite}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionIconElite}>
            <Feather name="edit-3" size={16} color="#3B2F2F" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setSelectedItem(item);
              setShowConfirm(true);
            }}
            style={[styles.actionIconElite, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rateDisplayElite}>
        <View style={styles.rateCol}>
          <Text style={styles.rateLabelElite}>EXCHANGE RATE</Text>
          <Text style={styles.rateValueElite}>{item.ExchangeCheckRate}</Text>
        </View>
        <View style={styles.statusBadgePulse}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusTextElite}>LIVE TRACKING</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ELITE WALNUT HEADER (MATCHING RECIPIENTS) */}
      <View style={styles.walnutHeader}>
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtnGlass}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#FCF5F1" />
            </TouchableOpacity>
            
            <View style={styles.headerTitlesBox}>
              <Text style={styles.headerTitleText}>Watchlist</Text>
              <View style={styles.subtitleRowElite}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.headerSubtitleText}>MONITOR EXCHANGE RATES</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("QuickAddWatchlistForm")}
              style={styles.headerAddBtnElite}
            >
              <LinearGradient
                colors={['#FFB09C', '#FF8E72']}
                style={styles.addBtnGradientElite}
              >
                <Feather name="plus" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Integrated Search Bar (Dark style) */}
          <View style={styles.searchContainerElite}>
            <View style={styles.searchInnerElite}>
              <Feather name="search" size={18} color="rgba(252, 245, 241, 0.4)" />
              <TextInput
                placeholder="Search country or currency..."
                placeholderTextColor="rgba(252, 245, 241, 0.4)"
                value={searchText}
                onChangeText={setSearchText}
                style={[styles.searchTextInputElite, { outlineStyle: "none" } as any]}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.mainContentBody}>
        {/* RECENTLY TRACKED SECTION */}
        <View style={styles.sectionHeaderElite}>
           <View style={styles.accentBarElite} />
           <Text style={styles.sectionHeaderText}>RECENTLY TRACKED</Text>
        </View>

        {loading && watchList.length === 0 ? (
          <View style={styles.loaderContainerElite}>
            <ActivityIndicator size="large" color="#FF8E72" />
            <Text style={styles.loaderLabelElite}>Updating live rates...</Text>
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.emptyStateElite}>
            <View style={styles.emptyIconCircleElite}>
                <MaterialCommunityIcons name="magnify-close" size={42} color="#DBCAC0" />
            </View>
            <Text style={styles.emptyTitleElite}>No Results Found</Text>
            <Text style={styles.emptyDescElite}>Try searching for another currency pair.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.ToCountryCode}
            contentContainerStyle={styles.listContainerElite}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* CONFIRMATION MODAL */}
      <Modal transparent visible={showConfirm} animationType="fade">
        <View style={styles.modalOverlayElite}>
          <View style={styles.modalBoxElite}>
            <View style={styles.alertIconHaloElite}>
              <Feather name="alert-circle" size={32} color="#FF8E72" />
            </View>
            
            <Text style={styles.modalTitleElite}>REMOVE TRACKER?</Text>
            <Text style={styles.modalDescElite}>
              Stop tracking <Text style={{color: '#3B2F2F', fontFamily: FONTS.bold}}>{selectedItem?.ToCountryName}</Text>? You can always add it back later.
            </Text>
            
            <View style={styles.modalActionRowElite}>
              <TouchableOpacity
                style={styles.modalCancelBtnElite}
                onPress={() => {
                  setShowConfirm(false);
                  setSelectedItem(null);
                }}
              >
                <Text style={styles.modalCancelTextElite}>CANCEL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalConfirmBtnElite} onPress={confirmDelete}>
                <LinearGradient colors={['#3B2F2F', '#1A1515']} style={styles.modalConfirmGradientElite}>
                  <Text style={styles.modalConfirmTextElite}>REMOVE</Text>
                </LinearGradient>
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
  walnutHeader: {
    backgroundColor: '#1C0D06',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingBottom: 35,
    ...SHADOWS.shadow,
  },
  safeHeader: {
    paddingHorizontal: 25,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    marginBottom: 25,
  },
  backBtnGlass: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitlesBox: {
    flex: 1,
    marginLeft: 20,
  },
  headerTitleText: {
    fontSize: RFValue(20),
    fontFamily: FONTS.bold,
    color: '#FCF5F1',
    letterSpacing: 1.5,
  },
  subtitleRowElite: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  headerSubtitleText: {
    fontSize: 10,
    color: 'rgba(252, 245, 241, 0.6)',
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  headerAddBtnElite: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    ...SHADOWS.shadow,
  },
  addBtnGradientElite: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainerElite: {
    marginTop: 5,
  },
  searchInnerElite: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  searchTextInputElite: {
    flex: 1,
    marginLeft: 15,
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: '#FCF5F1',
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  mainContentBody: {
    flex: 1,
    paddingHorizontal: 25,
    marginTop: 20,
  },
  sectionHeaderElite: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  accentBarElite: {
    width: 4,
    height: 16,
    backgroundColor: '#FF8E72',
    borderRadius: 2,
    marginRight: 10,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: 1.2,
  },
  listContainerElite: {
    paddingBottom: 40,
  },
  watchlistEliteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.02)',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 20 },
      android: { elevation: 3 }
    })
  },
  cardHeaderElite: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardCountryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainerElite: {
    width: 54,
    height: 54,
    position: 'relative',
  },
  avatarBoxElite: {
    flex: 1,
    backgroundColor: '#F8F4F1',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.05)',
  },
  flagIconElite: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  flagOverlayElite: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.shadow,
  },
  cardTitleBox: {
    marginLeft: 15,
  },
  itemTitleText: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  itemSubtitleText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#8E7F77',
    marginTop: 2,
  },
  cardActionRowElite: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIconElite: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.05)',
  },
  rateDisplayElite: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FBF8F6',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.02)',
  },
  rateCol: {
    flexDirection: 'column',
  },
  rateLabelElite: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#A3968F',
    letterSpacing: 1,
  },
  rateValueElite: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#FF8E72',
    marginTop: 4,
  },
  statusBadgePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusTextElite: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#10B981',
    letterSpacing: 0.5,
  },
  loaderContainerElite: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  loaderLabelElite: {
    marginTop: 15,
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#8E7F77',
  },
  emptyStateElite: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircleElite: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(219, 202, 192, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitleElite: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    marginBottom: 10,
  },
  emptyDescElite: {
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
  alertIconHaloElite: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 114, 0.1)',
  },
  modalTitleElite: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: 1.5,
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
  modalActionRowElite: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  modalCancelBtnElite: {
    flex: 1,
    height: 60,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.1)',
  },
  modalCancelTextElite: {
    color: '#3B2F2F',
    fontFamily: FONTS.bold,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  modalConfirmBtnElite: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalConfirmGradientElite: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmTextElite: {
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: 14,
    letterSpacing: 1.5,
  },
});

export default QuickAddWatchlist;
