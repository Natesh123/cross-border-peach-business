import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import Toast from "react-native-toast-message";
import Spinner from "react-native-loading-spinner-overlay";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ModalPicker from "app/components/customComponents/ModalPicker";
import { MetaService } from "app/services/meta.service";
import { SendMoneyService } from "app/services/sendMoney.service";
import { GetReceiverInfoList, GetReferDetails, DeleteBeneficiary, authenticate, GetCountryList, GetNationality, GetRemitterProfile, RemitterPostRegistration, AddReceiverInfo, EditBeneficiary, GetAgentDetails, getBranchDetail } from "app/http-services";
import { FONTS } from "app/constants/Assets";
import COLORS from "app/constants/Colors";
import { RFValue } from "react-native-responsive-fontsize";

interface BranchDetail {
  BranchName: string;
  BankName?: string;
  BranchCode?: string;
}

const AddRecipients = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [bankList, setBankList] = useState<{ dataValue: string; displayvalue: string }[]>([]);
  const [bank, setBank] = useState({ value: '', error: '' });
  const [IFSCCode, setIFSCCode] = useState({ value: '', error: '' });
  const [accountNumber, setAccountNumber] = useState({ value: '', error: '' });
  const [mobileWalletNumber, setMobileWalletNumber] = useState({ value: '', error: '' });
  const [ReceiverID, setReceiverID] = useState({ value: '', error: '' });
  const [accountName, setAccountName] = useState({ value: '', error: '' });
  const [PayoutCity, setPayoutCity] = useState<{ value: string, error: string }>({ value: '', error: '' });
  const [payoutPostcode, setPayoutPostcode] = useState<{ value: string, error: string }>({ value: '', error: '' });
  const [payoutSearch, setPayoutSearch] = useState<{ value: string, error: string }>({ value: '', error: '' });
  const [firstName, setFirstName] = useState({ value: '', error: '' });
  const [lastName, setLastName] = useState({ value: '', error: '' });
  const [email, setEmail] = useState({ value: '', error: '' });
  const [country, setCountry] = useState<any>({ value: '', error: '' });
  const [mobile, setMobile] = useState({ value: '', error: '' });
  const [isdCode, setIsdCode] = useState({ value: '', error: '' });

  const [city, setCity] = useState({ value: '', error: '' });
  const [relationship, setRelationship] = useState({ value: '', error: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [countryList, setCountryList] = useState<any[]>([]);
  const [selectedMode, setSelectedMode] = useState("Bank deposit");
  const [sheetIndex, setSheetIndex] = useState(-1);
  const [branchList, setBranchList] = useState<BranchDetail[]>([]);
  const [selectedBranch, setSelectedBranch] = useState({ value: '', error: '' });
  const [branchCode, setBranchCode] = useState({ value: '', error: '' });

  const [receivingModeField, setReceivingModeField] = useState<any>();
  const [receivingModeTab, setReceivingModeTab] = useState(0);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [agentList, setAgentList] = useState<{ label: string; value: string }[]>([]);
  const [agent, setAgent] = useState({ value: '', error: '' });
  const [agentCode, setAgentCode] = useState({ value: '', error: '' });
  const [agentName, setAgentName] = useState({ value: '', error: '' });

  const bottomSheetRef = useRef<BottomSheet>(null);
  const currentToken = useRecoilValue(ProfileState);
  const snapPoints = useMemo(() => ['75%'], []);
  const [NewUser, setNewUser] = useState(false);

  const handleExpandPress = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const route = useRoute();
  const editData = (route.params && 'editData' in route.params)
    ? (route.params as { editData: any }).editData
    : null;

  useEffect(() => {
    if (editData) {
      setNewUser(false);
      if (editData.MobileNumber) {
        const parts = editData.MobileNumber.split('-');
        setIsdCode({ value: parts[0] || '', error: '' });
        setMobile({ value: parts[1] || '', error: '' });
      } else {
        setIsdCode({ value: '', error: '' });
        setMobile({ value: '', error: '' });
      }
      if (editData?.BranchCode) {
        setSelectedBranch({ value: String(editData.BranchCode), error: '' });
      }

      setFirstName({ value: editData.FirstName || '', error: '' });
      setLastName({ value: editData.LastName || '', error: '' });
      setEmail({ value: editData.Email || '', error: '' });
      setCity({ value: editData.City || '', error: '' });
      setCountry({ value: editData.CountryCode || '', error: '' });
      setRelationship({ value: editData.Relationship || '', error: '' });
      setReceiverID({ value: editData.ReceiverID || '', error: '' });

      setIFSCCode({ value: editData.IFSC_IBAN || '', error: '' });
      setAccountNumber({ value: editData.AccountNumber || '', error: '' });
      setAccountName({ value: editData.AccountName || '', error: '' });
      setBank({ value: editData.BankName || '', error: '' });
      setSelectedBranch({ value: editData.BankCode || '', error: '' });
      setBranchCode({ value: editData.BranchCode ?? '', error: '' });

      setPayoutCity({ value: editData.City || '', error: '' });
      setPayoutPostcode({ value: editData.PostCode || '', error: '' });
      setPayoutSearch({ value: editData.State || '', error: '' });
      setAgentCode({ value: editData.AgentCode ?? '', error: '' });
      setAgent({ value: editData.AgentName, error: '' });
      setAgentName({ value: editData.AgentName, error: '' });

      setMobileWalletNumber({ value: editData.MobileWalletNumber || '', error: '' });

      if (editData.CountryCode) {
        onCountryChangeEdit(editData.CountryCode);
      }
    } else {
      setNewUser(true);
      setIsdCode({ value: '', error: '' });
      setMobile({ value: '', error: '' });
      setFirstName({ value: '', error: '' });
      setLastName({ value: '', error: '' });
      setEmail({ value: '', error: '' });
      setCity({ value: '', error: '' });
      setCountry({ value: '', error: '' });
      setPayoutPostcode({ value: '', error: '' });
      setPayoutSearch({ value: '', error: '' });
      setAccountNumber({ value: '', error: '' });
      setAccountName({ value: '', error: '' });
      setRelationship({ value: '', error: '' });
      setPayoutCity({ value: '', error: '' });

      setIFSCCode({ value: '', error: '' });
      setSelectedBranch({ value: '', error: '' });
      setMobileWalletNumber({ value: '', error: '' });
    }
  }, [editData]);

  const onCountryChangeEdit = async (value: any) => {
    setCountry({ value: value, error: '' });
    fetchTransferTypeField(value);
    fetchTransferType(value);
  };

  const onCountryChange = async (value: any) => {
    setCountry({ value: value, error: '' });
    const selectedCountry = countryList.find((c: any) => c.dataValue === value);
    setIsdCode({ value: selectedCountry?.ISDCode || '', error: '' });
    setMobile({ value: '', error: '' });
    fetchTransferTypeField(value);
    fetchTransferType(value);
  };

  const onbranchChange = (selected: BranchDetail | undefined) => {
    if (selected) {
      setSelectedBranch({ value: selected.BranchCode ?? '', error: '' });
      setIFSCCode({ value: selected.BranchCode ?? '', error: '' });
      setBranchCode({ value: selected.BranchCode ?? '', error: '' });
    } else {
      setSelectedBranch({ value: '', error: 'Please select a valid branch' });
    }
  };

  const onBankChange = async (bankObject: any) => {
    try {
      const response = await getBranchDetail(bankObject);
      if (response && response.data?.Bank?.length > 0) {
        setBranchList(response.data.Bank);
      } else {
        setBranchList([]);
      }
    } catch (error) {
      setBranchList([]);
    }
  };

  const onAgentChange = (selected: any) => {
    if (selected) {
      setAgentName({ value: selected.label ?? '', error: '' });
      setAgentCode({ value: selected.value ?? '', error: '' });
    } else {
      setAgent({ value: '', error: 'Please select a valid agent' });
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (Array.isArray(receivingModeField)) {
      const firstItem = receivingModeField[0];
      if (firstItem && firstItem.receivingModeOptions) {
        const mappedBankList = firstItem.receivingModeOptions.map((bank: any) => ({
          dataValue: bank.value,
          displayvalue: bank.label,
          CountryCode: bank?.CountryCode,
          BankName: bank?.BankName,
          BankCode: bank?.BankCode,
          SessionCode: bank?.SessionCode,
          City: bank?.City,
          State: bank?.State,
          SearchText: bank?.SearchText,
          StartFrom: bank?.StartFrom,
          EndWith: bank?.EndWith,
        }));
        setBankList(mappedBankList);
      }
    }
  }, [receivingModeField]);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      MetaService.fetchCountryMetas(false, true, false,
        (countries: any[]) => {
          const countryMetas = countries.map((country: any) => ({
            dataValue: country.Alpha_3_Code,
            displayvalue: country.CountryName,
            ISDCode: country.ISDCode,
            flag: country.Alpha_2_Code ? `https://flagcdn.com/w320/${country.Alpha_2_Code.toLowerCase()}.png` : null,
          }));
          setCountryList(countryMetas);
          setLoading(false);
        },
        (error: Error) => {
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchTransferType = async (toCountry: any) => {
    try {
      setLoading(true);
      SendMoneyService.getTransferTypes({ FromCountry: 'GBR', ToCountry: toCountry },
        (TransferDetails: any[]) => {
          setLoading(false);
        },
        (error: Error) => {
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchTransferTypeField = async (toCountry: any) => {
    try {
      setLoading(true);
      SendMoneyService.getTransferTypeField(toCountry, '',
        (responseFields: any, branchRequired: any) => {
          setReceivingModeField(responseFields);
          setLoading(false);
        },
        (error: Error) => {
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    } catch (error) {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    if (!firstName.value) {
      setFirstName({ ...firstName, error: 'First Name is required' });
      isValid = false;
    }
    if (!lastName.value) {
      setLastName({ ...lastName, error: 'Last Name is required' });
      isValid = false;
    }
    if (!email.value) {
      setEmail({ ...email, error: 'Email is required' });
      isValid = false;
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email.value)) {
        setEmail({ ...email, error: 'Please enter a valid email address' });
        isValid = false;
      }
    }
    if (!mobile.value) {
      setMobile({ ...mobile, error: 'Mobile number is required' });
      isValid = false;
    } else {
      // Country-based length validation
      const countryLengthMap: { [key: string]: number } = {
        'IND': 10,
        'GBR': 10,
        'USA': 10,
        'CAN': 10,
        'NGA': 10,
        'GHA': 10,
        'KEN': 9,
        'PHL': 10,
        'ARE': 9,
      };
      
      const expectedLength = countryLengthMap[country.value] || 10; // Default to 10 if not in map
      
      if (mobile.value.length !== expectedLength) {
        setMobile({ ...mobile, error: `Please enter a valid ${expectedLength}-digit mobile number` });
        isValid = false;
      }
    }
    return isValid;
  };

  const _onUpdatePressed = async () => {
    if (!validateForm()) return;
    setLoading(true);

    const postData: any = {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      mobile: mobile.value,
      city: city.value,
      country: country.value,
      relationship: relationship.value,
      bankName: bank.value,
      ifscCode: IFSCCode.value,
      accountNumber: accountNumber.value,
      accountName: accountName.value,
      ReceiverID: ReceiverID.value || '',
    };

    const savedData: any = {
      IFSC_IBAN: IFSCCode.value || '',
      DialCode: isdCode.value || '',
      FirstName: firstName.value,
      LastName: lastName.value || '',
      MiddleName: '',
      Email: email.value,
      MobileNumber: mobile.value,
      City: city.value || '',
      Country: country.value || '',
      CountryCode: country.value || '',
      Relationship: relationship.value || '',
      AccountNumber: accountNumber.value || '',
      AccountName: accountName.value || '',
      BranchName: selectedBranch.value || '',
      remitterId: currentToken.remitterId || '',
      tokenId: currentToken.tokenId || '',
      payoutPostcode: payoutPostcode.value || '',
      State: payoutSearch.value || '',
      MobileWalletNumber: mobileWalletNumber.value || '',
      ReceiverID: ReceiverID.value || '',
    };

    try {
      const isUpdate = !!editData?.ReceiverID;
      const response = isUpdate
        ? await EditBeneficiary(savedData)
        : await RemitterPostRegistration(postData);

      if (response && response.status === 200 && response.data) {
        const { StatusCode, StatusMsg } = response.data;
        if (StatusCode === "ER0000" || StatusCode === "ER0082") {
          Toast.show({
            type: 'success',
            text1: StatusCode === "ER0082" ? 'Updated successfully.' : 'Post registration',
            text2: StatusMsg || 'Operation completed successfully.',
          });
          navigation.navigate('Root');
        } else if (StatusCode === "ER0062") {
          Toast.show({
            type: 'error',
            text1: 'Duplicate beneficiary',
            text2: StatusMsg || 'This beneficiary already exists.',
          });
          return;
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: StatusMsg || 'Operation failed.',
          });
        }
      } else {
        throw new Error('Invalid response or missing data.');
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchLocation = async () => {
    const cityVal = PayoutCity.value.trim();
    const zipCode = payoutPostcode.value.trim();
    const state = payoutSearch.value.trim();

    let hasError = false;
    if (!cityVal) {
      setPayoutCity((prev) => ({ ...prev, error: "Enter city" }));
      hasError = true;
    }
    if (!zipCode) {
      setPayoutPostcode((prev) => ({ ...prev, error: "Enter postal code" }));
      hasError = true;
    }
    if (!state) {
      setPayoutSearch((prev) => ({ ...prev, error: "Enter state" }));
      hasError = true;
    }
    if (hasError) return;

    try {
      setLoading(true);
      const locationData = {
        City: cityVal.toUpperCase(),
        State: state,
        ZipCode: zipCode,
        remitterId: currentToken.remitterId,
        CountryCode: country.value,
      };

      const response = await GetAgentDetails(locationData);
      if (response && response.status === 200 && response.data) {
        const { StatusCode, StatusMsg, Agent } = response.data;
        if (StatusCode === "ER0000") {
          const agents = Agent || [];
          const formattedAgentList = agents.map((agent: any) => ({
            label: agent.AgentName,
            value: agent.AgentName || '',
          }));
          setAgentList(formattedAgentList);
          setSearchCompleted(true);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Search failed',
            text2: StatusMsg || 'Unexpected error occurred',
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Network error',
        text2: 'Could not fetch agent details.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPremiumInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    error: string,
    icon: string,
    placeholder: string,
    required: boolean = false,
    keyboardType: any = "default",
    editable: boolean = true,
    rightElement?: React.ReactNode
  ) => (
    <View style={localStyles.premiumInputGroup}>
      <View style={[localStyles.premiumInputWrapper, !!error && { borderColor: '#ef4444' }]}>
        <View style={localStyles.premiumIconBox}>
          <Feather name={icon as any} size={20} color="#8E7F77" />
        </View>
        <View style={localStyles.premiumInputContent}>
          <Text style={localStyles.premiumLabel}>
            {label.toUpperCase()} {required && <Text style={{ color: '#ef4444' }}>*</Text>}
          </Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#D2C5BD"
            keyboardType={keyboardType}
            editable={editable}
            style={[localStyles.premiumTextInput, Platform.select({ web: { outlineStyle: 'none' } }) as any]}
          />
        </View>
        {rightElement}
      </View>
      {error ? <Text style={localStyles.premiumErrorText}>{error}</Text> : null}
    </View>
  );

  const validateBankDeposit = () => {
    let err = false;
    if (!bank.value) { setBank((prev) => ({ ...prev, error: "Please select a bank" })); err = true; }
    if (!IFSCCode.value) { setIFSCCode((prev) => ({ ...prev, error: "Enter IFSC code" })); err = true; }
    if (!accountNumber.value) { setAccountNumber((prev) => ({ ...prev, error: "Enter account number" })); err = true; }
    if (!accountName.value) { setAccountName((prev) => ({ ...prev, error: "Enter account name" })); err = true; }
    return !err;
  };

  const validateCashPickup = () => {
    let err = false;
    if (!PayoutCity.value) { setPayoutCity((prev) => ({ ...prev, error: "Enter payout city" })); err = true; }
    if (!payoutPostcode.value) { setPayoutPostcode((prev) => ({ ...prev, error: "Enter payout postal code" })); err = true; }
    if (!payoutSearch.value) { setPayoutSearch((prev) => ({ ...prev, error: "Enter payout location" })); err = true; }
    return !err;
  };

  const validateMobileWallet = () => {
    let err = false;
    if (!mobileWalletNumber.value) { setMobileWalletNumber((prev) => ({ ...prev, error: "Enter wallet number" })); err = true; }
    return !err;
  };

  const handleBankDepositSave = async () => { if (validateBankDeposit()) await commonSaveHandler("Bank deposit"); };
  const handleCashPickupSave = async () => { if (validateCashPickup()) await commonSaveHandler("Cash pickup"); };
  const handleMobileWalletSave = async () => { if (validateMobileWallet()) await commonSaveHandler("Mobile wallet"); };

  const commonSaveHandler = async (mode: string) => {
    setLoading(true);
    let savedData: any = {
      mode: mode,
      IFSC_IBAN: IFSCCode.value || '',
      DialCode: isdCode.value || '',
      FirstName: firstName.value,
      LastName: lastName.value || '',
      MiddleName: '',
      Email: email.value,
      MobileNumber: mobile.value,
      City: city.value || '',
      Country: country.value || '',
      CountryCode: country.value || '',
      Relationship: relationship.value || '',
      AccountNumber: accountNumber.value || '',
      AccountName: accountName.value || '',
      BranchName: selectedBranch.value || '',
      remitterId: currentToken.remitterId || '',
      tokenId: currentToken.tokenId || '',
      payoutPostcode: payoutPostcode.value || '',
      State: payoutSearch.value || '',
      MobileWalletNumber: mobileWalletNumber.value || '',
      ReceiverID: ReceiverID.value || '',
      BankName: bank.value || '',
      BankCode: bank.value || '',
    };

    if (mode === "Cash pickup" || mode === "Mobile wallet") {
      savedData.AgentName = agentName.value || '';
      savedData.AgentCode = agentCode.value || '';
    }

    const isUpdate = !!editData?.ReceiverID;
    if (isUpdate) savedData.ReceiverID = editData.ReceiverID;

    try {
      const response = isUpdate ? await EditBeneficiary(savedData) : await AddReceiverInfo(savedData);
      if (response?.status === 200 && (response.data?.StatusCode === "ER0000" || response.data?.StatusCode === "ER0082")) {
        Toast.show({
          type: 'success',
          text1: response.data.StatusCode === "ER0082" ? 'Updated successfully.' : 'Registration completed successfully.',
          text2: response.data.StatusMsg,
        });
        setFirstName({ value: '', error: '' });
        setLastName({ value: '', error: '' });
        setEmail({ value: '', error: '' });
        setMobile({ value: '', error: '' });
        setIsdCode({ value: '', error: '' });
        setCity({ value: '', error: '' });
        setCountry({ value: '', error: '' });
        setPayoutPostcode({ value: '', error: '' });
        setPayoutSearch({ value: '', error: '' });
        setAccountNumber({ value: '', error: '' });
        setAccountName({ value: '', error: '' });
        setRelationship({ value: '', error: '' });
        setSelectedBranch({ value: '', error: '' });
        setAgentName({ value: '', error: '' });
        setAgentCode({ value: '', error: '' });
        setMobileWalletNumber({ value: '', error: '' });
        setReceiverID({ value: '', error: '' });
        navigation.navigate('Root');
      } else {
        throw new Error(response?.data?.StatusMsg || 'Unknown error');
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'An error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={localStyles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Spinner visible={loading} textStyle={{ color: '#FFF' }} />

        {/* CURVED DARK BROWN HEADER */}
        <View style={localStyles.curvedHeader}>
          <SafeAreaView edges={['top']}>
            <View style={localStyles.headerContent}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backCircle}>
                <Ionicons name="chevron-back" size={24} color="#FCF5F1" />
              </TouchableOpacity>
              <View style={localStyles.titleBox}>
                <Text style={localStyles.headerTitle}>{NewUser ? "Enroll Recipient" : "Edit Recipient"}</Text>
                <View style={localStyles.subtitleRow}>
                  <View style={localStyles.greenDot} />
                  <Text style={localStyles.headerSub}>QUANTUM ENCRYPTION ACTIVE</Text>
                </View>
              </View>
              <View style={localStyles.headerRightIcon}>
                <Feather name="user-plus" size={24} color="#FCF5F1" />
              </View>
            </View>
          </SafeAreaView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={localStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section: Identity */}
          <View style={localStyles.formSection}>
            <View style={localStyles.sectionTitleRow}>
              <Feather name="shield" size={18} color="#FF8A7A" style={{ marginRight: 10 }} />
              <Text style={localStyles.sectionTitle}>Recipient Credentials</Text>
            </View>

            {renderPremiumInput("First Name", firstName.value, (v) => setFirstName({ value: v.replace(/[^A-Za-z]/g, ''), error: "" }), firstName.error, "user", "Given", true)}
            {renderPremiumInput("Last Name", lastName.value, (v) => setLastName({ value: v.replace(/[^A-Za-z]/g, ''), error: "" }), lastName.error, "user", "Family", true)}

            {renderPremiumInput("Email Address", email.value, (v) => setEmail({ value: v, error: "" }), email.error, "mail", "Email", true, "email-address")}

            <View style={localStyles.premiumInputGroup}>
              <View style={localStyles.premiumInputWrapper}>
                <View style={localStyles.premiumIconBox}>
                  <Feather name="globe" size={20} color="#8E7F77" />
                </View>
                <View style={localStyles.premiumInputContent}>
                  <Text style={localStyles.premiumLabel}>RESIDENT COUNTRY</Text>
                  <Text style={localStyles.premiumValueText}>
                    {country.value ? (countryList.find(c => c.dataValue === country.value)?.displayvalue || "Select Country") : "Select Country"}
                  </Text>
                </View>
                <Feather name="chevron-down" size={20} color="#8E7F77" />
                <ModalPicker
                  dataList={countryList}
                  onValueChange={(val) => onCountryChange(val)}
                  selectedValue={country.value}
                  placeholder="Select Country"
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
                />
              </View>
            </View>

            <View style={localStyles.premiumInputGroup}>
              <View style={[localStyles.premiumInputWrapper, !!mobile.error && { borderColor: '#ef4444' }]}>
                <View style={localStyles.premiumIconBox}>
                  {isdCode.value ? (
                    <Text style={localStyles.premiumIsdText}>{isdCode.value}</Text>
                  ) : (
                    <Feather name="smartphone" size={20} color="#8E7F77" />
                  )}
                </View>
                <View style={localStyles.premiumInputContent}>
                  <Text style={localStyles.premiumLabel}>
                    CONTACT NUMBER <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={mobile.value}
                    onChangeText={(v) => setMobile({ value: v.replace(/[^0-9]/g, ''), error: "" })}
                    placeholder="Mobile"
                    placeholderTextColor="#D2C5BD"
                    keyboardType="phone-pad"
                    style={[localStyles.premiumTextInput, Platform.select({ web: { outlineStyle: 'none' } }) as any]}
                  />
                </View>
              </View>
              {mobile.error ? <Text style={localStyles.premiumErrorText}>{mobile.error}</Text> : null}
            </View>
          </View>

          {/* Section: Additional */}
          <View style={localStyles.formSection}>
            <View style={localStyles.sectionTitleRow}>
              <Feather name="map-pin" size={18} color="#FF8A7A" style={{ marginRight: 10 }} />
              <Text style={localStyles.sectionTitle}>Location Data</Text>
            </View>

            {renderPremiumInput("Current City", city.value, (v) => setCity({ value: v.replace(/[^A-Za-z\s]/g, ''), error: "" }), city.error, "map", "City")}
            {renderPremiumInput("Relationship", relationship.value, (v) => setRelationship({ value: v.replace(/[^A-Za-z\s]/g, ''), error: "" }), relationship.error, "users", "e.g. Friend")}
          </View>

          {/* Section: Receiving Mode Trigger */}
          {country.value ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleExpandPress}
              style={localStyles.addModeBtn}
            >
              <LinearGradient
                colors={['#FFFFFF', '#FCF5F1']}
                style={localStyles.addModeGradient}
              >
                <View style={localStyles.addModeIconBox}>
                  <Feather name="plus-circle" size={24} color="#1C0D06" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={localStyles.addModeTitle}>Receiving Mode</Text>
                  <Text style={localStyles.addModeSub}>Configure how they receive money</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#1C0D06" />
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {/* Footer Actions */}
          <View style={localStyles.footerActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={localStyles.cancelBtn}
            >
              <Text style={localStyles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={_onUpdatePressed}
              style={localStyles.saveBtn}
            >
              <LinearGradient colors={['#FF8A7A', '#FF6B6B']} style={localStyles.saveGradient}>
                <Text style={localStyles.saveText}>{NewUser ? "PROCESS SAVING" : "UPDATE DETAILS"}</Text>
                <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* BOTTOM SHEET FOR MODES */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={['85%']}
          enablePanDownToClose
          onChange={(index) => setSheetIndex(index)}
          backdropComponent={(props) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={sheetIndex > -1 ? 0.5 : 0} />
          )}
          backgroundStyle={{ backgroundColor: '#FCF5F1', borderRadius: 32 }}
          handleIndicatorStyle={{ backgroundColor: '#FF8A7A', width: 40 }}
        >
          <View style={localStyles.sheetContent}>
            <View style={localStyles.sheetHeaderClean}>
              <Text style={localStyles.sheetHeaderTitleDark}>Receiving Method</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={localStyles.secureLineBadge}>
                  <View style={localStyles.secureDot} />
                  <Text style={localStyles.secureLineText}>SECURE LINE</Text>
                </View>
                <TouchableOpacity onPress={() => bottomSheetRef.current?.close()} style={localStyles.sheetCloseBtnDark}>
                  <Feather name="x" size={20} color="#1C0D06" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={localStyles.tabWrapperClean}>
              <View style={localStyles.tabContainerClean}>
                {['Bank deposit', 'Cash pickup', 'Mobile wallet'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setSelectedMode(mode)}
                    style={[localStyles.tabItemClean, selectedMode === mode && localStyles.activeTabClean]}
                  >
                    <Text style={[localStyles.tabTextClean, selectedMode === mode && localStyles.activeTabTextClean]}>
                      {mode === 'Bank deposit' ? 'BANK' : mode === 'Cash pickup' ? 'CASH' : 'WALLET'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={localStyles.modeCardWrapper}>
              {selectedMode === "Bank deposit" && (
                <View>
                  {/* Section 1: Bank Institution */}
                  <View style={localStyles.sheetCardWhite}>
                    <View style={localStyles.sheetCardHeader}>
                      <View style={localStyles.sheetCardIconBox}>
                        <Feather name="home" size={16} color="#FFF" />
                      </View>
                      <Text style={localStyles.sheetCardSectionTitle}>BANK INSTITUTION</Text>
                    </View>
                    <View style={localStyles.premiumInputWrapper}>
                      <View style={localStyles.premiumInputContent}>
                        <Text style={localStyles.premiumValueText}>
                          {bank.value ? (bankList.find(b => b.dataValue === bank.value)?.displayvalue || "Select Option") : "Select Option"}
                        </Text>
                      </View>
                      <Feather name="chevron-down" size={20} color="#8E7F77" />
                      <ModalPicker
                        dataList={bankList}
                        onValueChange={(v) => {
                          const selected = bankList.find(b => b.dataValue === v);
                          setBank({ value: selected?.dataValue ?? '', error: '' });
                          onBankChange(selected);
                        }}
                        selectedValue={bank.value}
                        placeholder="Select Option"
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
                      />
                    </View>
                    {bank.error ? <Text style={localStyles.premiumErrorText}>{bank.error}</Text> : null}
                  </View>

                  {/* Section 2: Account Security */}
                  <View style={localStyles.sheetCardWhite}>
                    <View style={localStyles.sheetCardHeader}>
                      <Feather name="shield" size={16} color="#FF8A7A" style={{ marginRight: 8 }} />
                      <Text style={localStyles.sheetCardSectionTitle}>ACCOUNT SECURITY</Text>
                    </View>
                    {renderPremiumInput("IFSC Code", IFSCCode.value, (v) => setIFSCCode({ value: v, error: "" }), IFSCCode.error, "hash", "Required", false)}
                    {renderPremiumInput("Account Number", accountNumber.value, (v) => setAccountNumber({ value: v.replace(/[^0-9]/g, ''), error: "" }), accountNumber.error, "credit-card", "Required", false, "numeric")}
                    {renderPremiumInput("Account Name", accountName.value, (v) => setAccountName({ value: v.replace(/[^A-Za-z\s]/g, ''), error: "" }), accountName.error, "user", "Full Legal Name", false)}

                    {branchList.length > 0 && (
                      <View style={localStyles.premiumInputGroup}>
                        <View style={localStyles.premiumInputWrapper}>
                          <View style={localStyles.premiumIconBox}>
                            <Feather name="map-pin" size={20} color="#8E7F77" />
                          </View>
                          <View style={localStyles.premiumInputContent}>
                            <Text style={localStyles.premiumLabel}>SELECT BRANCH</Text>
                            <Text style={localStyles.premiumValueText}>
                              {selectedBranch.value ? (branchList.find(b => String(b.BranchCode) === selectedBranch.value)?.BranchName || "Select Branch") : "Select Branch"}
                            </Text>
                          </View>
                          <Feather name="chevron-down" size={20} color="#8E7F77" />
                          <ModalPicker
                            dataList={branchList.map(b => ({
                              dataValue: String(b.BranchCode ?? ''),
                              displayvalue: `${b.BranchName} (${b.BranchCode ?? ''})`
                            }))}
                            selectedValue={String(selectedBranch.value)}
                            onValueChange={(v) => {
                              const s = branchList.find(b => String(b.BranchCode) === v);
                              if (s) onbranchChange(s);
                            }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
                          />
                        </View>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity activeOpacity={0.8} style={localStyles.sheetSaveBtnOuter} onPress={handleBankDepositSave}>
                    <LinearGradient colors={['#FF8A7A', '#FF6B6B']} style={localStyles.sheetSaveBtn}>
                      <Text style={localStyles.sheetSaveText}>Confirm Bank</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {selectedMode === "Cash pickup" && (
                <View>
                  <View style={localStyles.sheetCardWhite}>
                    <View style={localStyles.sheetCardHeader}>
                      <Feather name="map-pin" size={16} color="#FF8A7A" style={{ marginRight: 8 }} />
                      <Text style={localStyles.sheetCardSectionTitle}>LOCATION DETAILS</Text>
                    </View>
                    {renderPremiumInput("Payout City", PayoutCity.value, (v) => setPayoutCity({ value: v.replace(/[^A-Za-z\s]/g, ''), error: "" }), PayoutCity.error, "map-pin", "City")}
                    {renderPremiumInput("Postal Code", payoutPostcode.value, (v) => setPayoutPostcode({ value: v.replace(/[^0-9]/g, ''), error: "" }), payoutPostcode.error, "package", "Zip Code", false, "numeric")}
                    {renderPremiumInput("Search Location", payoutSearch.value, (v) => setPayoutSearch({ value: v.replace(/[^A-Za-z\s]/g, ''), error: "" }), payoutSearch.error, "search", "State", false, "default", true,
                      <TouchableOpacity onPress={handleSearchLocation} style={localStyles.inlineSearchBtn}>
                        <Text style={localStyles.inlineSearchText}>Search</Text>
                      </TouchableOpacity>
                    )}
                    
                    {searchCompleted && (
                      <View style={localStyles.premiumInputGroup}>
                        <View style={localStyles.premiumInputWrapper}>
                          <View style={localStyles.premiumIconBox}>
                            <Feather name="home" size={20} color="#8E7F77" />
                          </View>
                          <View style={localStyles.premiumInputContent}>
                            <Text style={localStyles.premiumLabel}>COLLECTION POINT</Text>
                            <Text style={localStyles.premiumValueText}>
                              {agent.value ? (agentList.find(a => a.value === agent.value)?.label || "Select Point") : "Select Point"}
                            </Text>
                          </View>
                          <Feather name="chevron-down" size={20} color="#8E7F77" />
                          <ModalPicker
                            dataList={agentList.map(a => ({ dataValue: a.value, displayvalue: a.label }))}
                            selectedValue={agent.value}
                            onValueChange={(v) => {
                              const s = agentList.find(a => a.value === v);
                              if (s) {
                                setAgent({ value: s.value, error: '' });
                                onAgentChange(s);
                              }
                            }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
                          />
                        </View>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity activeOpacity={0.8} style={localStyles.sheetSaveBtnOuter} onPress={handleCashPickupSave}>
                    <LinearGradient colors={['#FF8A7A', '#FF6B6B']} style={localStyles.sheetSaveBtn}>
                      <Text style={localStyles.sheetSaveText}>Confirm Pickup</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {selectedMode === "Mobile wallet" && (
                <View>
                  <View style={localStyles.sheetCardWhite}>
                    <View style={localStyles.sheetCardHeader}>
                      <Feather name="smartphone" size={16} color="#FF8A7A" style={{ marginRight: 8 }} />
                      <Text style={localStyles.sheetCardSectionTitle}>WALLET DETAILS</Text>
                    </View>
                    {renderPremiumInput("Wallet Number", mobileWalletNumber.value, (v) => setMobileWalletNumber({ value: v.replace(/[^0-9]/g, ''), error: "" }), mobileWalletNumber.error, "phone", "e.g. 9912345678", false, "numeric")}
                  </View>

                  <TouchableOpacity activeOpacity={0.8} style={localStyles.sheetSaveBtnOuter} onPress={handleMobileWalletSave}>
                    <LinearGradient colors={['#FF8A7A', '#FF6B6B']} style={localStyles.sheetSaveBtn}>
                      <Text style={localStyles.sheetSaveText}>Confirm Wallet</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF5F1",
  },
  curvedHeader: {
    backgroundColor: '#1C0D06',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 25,
    shadowColor: "#1C0D06",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBox: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#FCF5F1',
    fontWeight: '800',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  headerSub: {
    fontSize: 10,
    color: 'rgba(252, 245, 241, 0.6)',
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  headerRightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#1C0D06",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  premiumInputGroup: {
    marginBottom: 16,
  },
  premiumInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 72,
  },
  premiumIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: "#1C0D06",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  premiumInputContent: {
    flex: 1,
  },
  premiumLabel: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  premiumTextInput: {
    fontSize: 16,
    fontFamily: FONTS.semibold || FONTS.bold,
    color: '#1C0D06',
    padding: 0,
  },
  premiumValueText: {
    fontSize: 16,
    fontFamily: FONTS.semibold || FONTS.bold,
    color: '#1C0D06',
  },
  premiumIsdText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#1C0D06',
  },
  premiumErrorText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 16,
  },
  row: {
    flexDirection: 'row',
  },
  addModeBtn: {
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.05)',
    shadowColor: "#1C0D06",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2,
  },
  addModeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  addModeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addModeTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#1C0D06',
    fontWeight: '700',
  },
  addModeSub: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#8E7F77',
    marginTop: 2,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
    marginBottom: 30,
  },
  cancelBtn: {
    width: 100,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.1)',
  },
  cancelText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    letterSpacing: 1,
  },
  saveBtn: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  saveGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#fff',
    letterSpacing: 1,
    fontWeight: '700',
  },
  sheetContent: {
    flex: 1,
  },
  sheetHeaderGradient: {
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetHeaderTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#FCF5F1',
  },
  sheetHeaderSub: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: 'rgba(252, 245, 241, 0.8)',
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabWrapper: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  tabContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 6,
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: "#1C0D06",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#8E7F77',
  },
  activeTabText: {
    color: '#1C0D06',
    fontWeight: '700',
  },
  modeCardWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: "#1C0D06",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  sheetSaveBtnOuter: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sheetSaveBtn: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetSaveText: {
    color: '#FCF5F1',
    fontFamily: FONTS.bold,
    fontSize: 15,
    letterSpacing: 1,
  },
  inlineSearchBtn: {
    backgroundColor: '#1C0D06',
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
  },
  inlineSearchText: {
    color: '#FCF5F1',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  sheetHeaderClean: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetHeaderTitleDark: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#1C0D06',
  },
  secureLineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  secureLineText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#10B981',
    letterSpacing: 1,
  },
  tabWrapperClean: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabContainerClean: {
    backgroundColor: '#F3ECE7',
    borderRadius: 24,
    padding: 6,
    flexDirection: 'row',
  },
  tabItemClean: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTabClean: {
    backgroundColor: '#FFFFFF',
    shadowColor: "#1C0D06",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tabTextClean: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    letterSpacing: 0.5,
  },
  activeTabTextClean: {
    color: '#1C0D06',
    fontWeight: '700',
  },
  sheetCardWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#1C0D06",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  sheetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetCardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FF8A7A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sheetCardSectionTitle: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    letterSpacing: 1,
  },
  sheetCloseBtnDark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 13, 6, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddRecipients;
