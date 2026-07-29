import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

import { MobileNumberLookUp } from "app/http-services";
import COLORS from "app/constants/Colors";
import { FONTS } from "app/constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";
import Animated, { FadeInDown } from "react-native-reanimated";

const AirtimeTopupForm = () => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState({ value: "", error: "" });
  const [lastName, setLastName] = useState({ value: "", error: "" });
  const [email, setEmail] = useState({ value: "", error: "" });
  const [mobile, setMobile] = useState({ value: "", error: "" });
  const [confirmMobile, setConfirmMobile] = useState({ value: "", error: "" });

  // AsyncStorage values
  const [selectedOperator, setSelectedOperator] = useState<{
    dataValue: string;
    displayvalue: string;
    flag?: string;
    ISDCode?: string;
  } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<{
    dataValue: string;
    displayvalue: string;
    flag?: string;
    ISDCode?: string;
  } | null>(null);

  // Load AsyncStorage data
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedOperator = await AsyncStorage.getItem("selectedOperator");
        if (storedOperator) setSelectedOperator(JSON.parse(storedOperator));

        const storedCountry = await AsyncStorage.getItem("selectedCountry");
        if (storedCountry) setSelectedCountry(JSON.parse(storedCountry));
      } catch (error) {
        console.log("Error loading AsyncStorage:", error);
      }
    };
    loadData();
  }, []);

  const validateForm = () => {
    let isValid = true;
    if (!firstName.value) {
      setFirstName({ ...firstName, error: "First Name is required" });
      isValid = false;
    }
    if (!lastName.value) {
      setLastName({ ...lastName, error: "Last Name is required" });
      isValid = false;
    }
    if (!email.value) {
      setEmail({ ...email, error: "Email is required" });
      isValid = false;
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email.value)) {
        setEmail({ ...email, error: "Please enter a valid email address" });
        isValid = false;
      }
    }
    if (!mobile.value) {
      setMobile({ ...mobile, error: "Mobile number is required" });
      isValid = false;
    } else if (!/^[0-9]{7,15}$/.test(mobile.value)) {
      setMobile({ ...mobile, error: "Invalid mobile number" });
      isValid = false;
    }
    if (!confirmMobile.value) {
      setConfirmMobile({ ...confirmMobile, error: "Confirmation is required" });
      isValid = false;
    } else if (confirmMobile.value !== mobile.value) {
      setConfirmMobile({ ...confirmMobile, error: "Numbers do not match" });
      isValid = false;
    }
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const requestPayload = {
        CountryCode: selectedCountry?.dataValue || "IN",
        Email: email.value,
        FirstName: firstName.value,
        LastName: lastName.value,
        MobileNumber: mobile.value,
        remitterId: "",
        operator_id: selectedOperator?.dataValue ? String(selectedOperator.dataValue) : "",
      };

      const response = await MobileNumberLookUp(requestPayload);
      const responseData = response?.data;

      if (responseData?.StatusCode === "ER0000") {
        const storedPackage = await AsyncStorage.getItem("selectedPackage");
        const selectedPackage = storedPackage ? JSON.parse(storedPackage) : null;
        await AsyncStorage.setItem(
          "selectedRecipient",
          JSON.stringify({ 
            ...requestPayload, 
            AccountName: `${firstName.value} ${lastName.value}`,
            AccountNumber: mobile.value,
            selectedPackage 
          })
        );

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Recipient added successfully',
        });

        setTimeout(() => {
          navigation.navigate('AirtimeTopupPay');
        }, 800);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lookup Failed',
          text2: responseData?.StatusMsg || 'Could not verify mobile number',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Connection failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string, 
    value: string, 
    onChange: (t: string) => void, 
    error: string, 
    placeholder: string,
    icon: string,
    keyboardType: any = "default",
    prefix?: string
  ) => (
    <View style={localStyles.inputGroup}>
      <Text style={localStyles.inputLabel}>{label}</Text>
      <View style={[localStyles.inputWrapper, error ? localStyles.inputError : null]}>
        <View style={localStyles.inputIconCont}>
          <Feather name={icon as any} size={18} color={error ? "#FF8E72" : "#94A3B8"} />
        </View>
        {prefix && <Text style={localStyles.prefixText}>{prefix}</Text>}
        <TextInput
          style={localStyles.textInput}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          keyboardType={keyboardType}
          autoComplete="off"
          importantForAutofill="no"
        />
      </View>
      {error ? <Text style={localStyles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={localStyles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* HEADER SECTION */}
      <View style={localStyles.headerArea}>
        <LinearGradient colors={["#3B2F2F", "#1A1515"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView>
          <View style={localStyles.headerContent}>
            <View style={localStyles.headerTopRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backButton}>
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={localStyles.headerStatusBadge}>
                <View style={localStyles.statusPulse} />
                <Text style={localStyles.headerStatusText}>NEW BENEFICIARY</Text>
              </View>
            </View>

            <View style={localStyles.titleSection}>
              <Text style={localStyles.mainTitleText}>Add Recipient</Text>
              <Text style={localStyles.subTitleText}>Securely register a new contact for top-ups</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={localStyles.mainContent}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={localStyles.scrollContent}
        >
          <Animated.View entering={FadeInDown} style={localStyles.formCard}>
            <View style={localStyles.formHeader}>
              <View style={localStyles.formIconCircle}>
                <Feather name="user-plus" size={20} color="#FF8E72" />
              </View>
              <Text style={localStyles.formHeaderText}>Personal Information</Text>
            </View>

            <View style={localStyles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                {renderInput("First Name", firstName.value, (t) => setFirstName({ value: t.replace(/[^A-Za-z\s]/g, ""), error: "" }), firstName.error, "John", "user")}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                {renderInput("Last Name", lastName.value, (t) => setLastName({ value: t.replace(/[^A-Za-z\s]/g, ""), error: "" }), lastName.error, "Doe", "user")}
              </View>
            </View>

            {renderInput("Email Address", email.value, (t) => setEmail({ value: t, error: "" }), email.error, "john@example.com", "mail", "email-address")}
            
            <View style={localStyles.divider} />

            <View style={localStyles.formHeader}>
              <View style={localStyles.formIconCircle}>
                <Feather name="phone" size={20} color="#FF8E72" />
              </View>
              <Text style={localStyles.formHeaderText}>Mobile Details</Text>
            </View>

            <View style={localStyles.operatorInfoBox}>
              <Text style={localStyles.opLabel}>Selected Network</Text>
              <Text style={localStyles.opValue}>{selectedOperator?.displayvalue || "Unknown Network"}</Text>
            </View>

            {renderInput(
              "Mobile Number", 
              mobile.value, 
              (t) => setMobile({ value: t.replace(/[^0-9]/g, ""), error: "" }), 
              mobile.error, 
              "000 000 0000", 
              "phone", 
              "number-pad",
              selectedCountry?.ISDCode ? `+${selectedCountry.ISDCode}` : ""
            )}

            {renderInput(
              "Confirm Number", 
              confirmMobile.value, 
              (t) => setConfirmMobile({ value: t.replace(/[^0-9]/g, ""), error: "" }), 
              confirmMobile.error, 
              "Repeat mobile number", 
              "check-circle", 
              "number-pad",
              selectedCountry?.ISDCode ? `+${selectedCountry.ISDCode}` : ""
            )}
          </Animated.View>
        </ScrollView>
      </View>

      {/* FOOTER ACTION */}
      <View style={localStyles.stickyFooter}>
        <View style={localStyles.footerBtnRow}>
          <TouchableOpacity 
            style={localStyles.cancelBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={localStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            disabled={loading}
            style={localStyles.saveAction} 
            onPress={handleSave}
            activeOpacity={0.9}
          >
            <LinearGradient 
              colors={["#FF8E72", "#FC6D41"]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={localStyles.saveGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={localStyles.saveLabel}>SAVE CONTACT</Text>
                  <View style={localStyles.saveIconBox}>
                    <Feather name="check" size={18} color="#FC6D41" />
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerArea: {
    backgroundColor: '#1C0D06',
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 142, 114, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8E72',
  },
  headerStatusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF8E72',
    letterSpacing: 1.2,
  },
  titleSection: {
    marginBottom: 10,
  },
  mainTitleText: {
    fontSize: RFValue(28),
    color: "#FFFFFF",
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
  },
  subTitleText: {
    fontSize: RFValue(12),
    color: "rgba(255,255,255,0.6)",
    fontFamily: FONTS.medium,
    marginTop: 6,
    lineHeight: RFValue(18),
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -32,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: "#3B2F2F",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  formIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF9F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formHeaderText: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    color: '#1A1515',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: RFValue(10),
    fontFamily: FONTS.bold,
    color: '#94A3B8',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  inputError: {
    borderColor: '#FF8E72',
    backgroundColor: '#FFF9F7',
  },
  inputIconCont: {
    marginRight: 12,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B2F2F',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FONTS.semibold,
    color: '#1A1515',
    padding: 0,
    // @ts-ignore
    outlineStyle: 'none',
  },
  errorText: {
    fontSize: 10,
    color: '#FF8E72',
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 4,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 24,
  },
  operatorInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  opLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  opValue: {
    fontSize: RFValue(13),
    fontFamily: FONTS.bold,
    color: '#FF8E72',
    marginTop: 4,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  footerBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
  },
  saveAction: {
    flex: 2,
    borderRadius: 24,
    shadowColor: "#FF8E72",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  saveGradient: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    gap: 16,
  },
  saveLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  saveIconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AirtimeTopupForm;
