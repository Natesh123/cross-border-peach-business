import React, { useEffect, useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, Layout, FadeInRight } from "react-native-reanimated";
import { useRecoilState, useRecoilValue } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import Spinner from "react-native-loading-spinner-overlay";
import moment from 'moment';
import DateTimePicker from "@react-native-community/datetimepicker";
import { RFValue } from "react-native-responsive-fontsize";

import { ProfileState } from "../../atoms";
import { GetNationality, GetRemitterProfile, GetCountryList, RemitterPostRegistration } from "app/http-services";
import { FONTS, SIZES, SHADOWS } from "app/constants/Assets";
import Vector from "app/assets/vectors";
import ModalPicker from "app/components/customComponents/ModalPicker";
import { TDropDown } from "types";

const PostRegistration = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { width } = useWindowDimensions();
    const [profileItems, setProfileItems] = useRecoilState(ProfileState);
    const [profile, setProfile] = useState<any>('');
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState<any>({ value: 'Mr', error: '' });
    const [firstName, setFirstName] = useState({ value: '', error: '' });
    const [lastName, setLastName] = useState({ value: '', error: '' });
    const [email, setEmail] = useState({ value: profileItems.email, error: '' });
    const [mobile, setMobile] = useState({ value: profileItems.mobileNo, error: '' });
    const [gender, setGender] = useState<any>({ value: 'M', error: '' });
    const [dateOfBirth, setDateOfBirth] = useState({ value: new Date(), error: '' });
    const [nationality, setNationality] = useState<any>({ value: '', error: '' });
    const [addressLine1, setAddressLine1] = useState({ value: '', error: '' });
    const [addressLine2, setAddressLine2] = useState({ value: '', error: '' });
    const [country, setCountry] = useState<any>({ value: '', error: '' });
    const [city, setCity] = useState({ value: '', error: '' });
    const [postCode, setPostCode] = useState({ value: '', error: '' });

    const [titleList, setTitleList] = useState<TDropDown[]>([
        { dataValue: "Mr", displayvalue: "Mr", name: "Mr", Alpha_2_Code: "", ISDCode: undefined, flag: undefined, price: undefined, description: undefined },
        { dataValue: "Mrs", displayvalue: "Mrs", name: "Mrs", Alpha_2_Code: "", ISDCode: undefined, flag: undefined, price: undefined, description: undefined },
        { dataValue: "Ms", displayvalue: "Ms", name: "Ms", Alpha_2_Code: "", ISDCode: undefined, flag: undefined, price: undefined, description: undefined }
    ]);

    const [genderList, setGenderList] = useState<TDropDown[]>([
        { dataValue: "M", displayvalue: "Male", name: "Male", Alpha_2_Code: "M", ISDCode: undefined, flag: undefined, price: undefined, description: undefined },
        { dataValue: "F", displayvalue: "Female", name: "Female", Alpha_2_Code: "F", ISDCode: undefined, flag: undefined, price: undefined, description: undefined }
    ]);

    const [nationalityList, setNationalityList] = useState<TDropDown[]>([]);
    const [countryList, setCountryList] = useState<TDropDown[]>([]);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        if (isFocused) {
            fetchInitialData();
        }
    }, [isFocused]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchNationality(profileItems.tokenId),
                fetchCountryList(profileItems.tokenId),
                fetchRemitterProfile(profileItems.tokenId)
            ]);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRemitterProfile = async (tokenId: string) => {
        try {
            const res: any = await GetRemitterProfile(tokenId);
            if (res.status === 200) {
                const sender = res?.data?.Sender;
                setProfile(sender);
                setTitle({ value: sender?.Title || 'Mr', error: '' });
                setFirstName({ value: sender?.FirstName || '', error: '' });
                setLastName({ value: sender?.LastName || '', error: '' });
                setEmail({ value: sender?.Email || profileItems.email, error: '' });
                setMobile({ value: sender?.Mobile || profileItems.mobileNo, error: '' });
                setGender({ value: sender?.Gender || 'M', error: '' });

                let dobDate = new Date();
                if (sender?.DOB) {
                    const cleanDate = String(sender.DOB).replace(/\\\//g, "/");
                    const m = moment(cleanDate, [moment.ISO_8601, "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY"]);
                    if (m.isValid()) dobDate = m.toDate();
                }
                setDateOfBirth({ value: dobDate, error: '' });
                setNationality({ value: sender?.Nationality || '', error: '' });
                setAddressLine1({ value: sender?.Address1 || '', error: '' });
                setAddressLine2({ value: sender?.Address2 || '', error: '' });
                setCountry({ value: sender?.Country || '', error: '' });
                setCity({ value: sender?.City || '', error: '' });
                setPostCode({ value: sender?.PostCode || '', error: '' });
            }
        } catch (err) {
            console.error('Fetch Remitter profile error:', err);
        }
    };

    const fetchNationality = async (tokenId: string) => {
        try {
            const res: any = await GetNationality(tokenId);
            if (res.status === 200 && res?.data?.StatusCode === 'ER0000') {
                const _NationalityList = res?.data?.Nationality.map((data: any) => ({
                    dataValue: data.Alpha_3_Code,
                    displayvalue: data.Nationalityy,
                }));
                setNationalityList(_NationalityList);
                if (!nationality.value && _NationalityList.length > 0) {
                    setNationality({ value: _NationalityList[0].dataValue, error: '' });
                }
            }
        } catch (error) {
            console.error('Error nationality:', error);
        }
    };

    const fetchCountryList = async (tokenId: string) => {
        try {
            const res: any = await GetCountryList(tokenId);
            if (res.status === 200 && res?.data?.StatusCode === 'ER0000') {
                const _CountryList = res?.data?.CountryDetail.map((data: any) => ({
                    dataValue: data.Alpha_3_Code,
                    displayvalue: data.CountryName,
                }));
                setCountryList(_CountryList);
                if (!country.value && _CountryList.length > 0) {
                    setCountry({ value: _CountryList[0].dataValue, error: '' });
                }
            }
        } catch (error) {
            console.error('Error country list:', error);
        }
    };

    const _onUpdatePressed = async () => {
        // Simple validation
        if (!firstName.value) { setFirstName({ ...firstName, error: "First name is required" }); return; }
        if (!lastName.value) { setLastName({ ...lastName, error: "Last name is required" }); return; }

        setLoading(true);
        const postData: any = {
            tokenId: profileItems.tokenId,
            remitterId: profileItems.remitterId,
            addressLine1: addressLine1.value,
            addressLine2: addressLine2.value,
            city: city.value,
            country: country.value,
            countryName: '',
            postCode: postCode.value,
            dateOfBirth: moment(dateOfBirth.value).format('YYYY-MM-DD'),
            email: email.value,
            title: title.value,
            firstName: firstName.value,
            lastName: lastName.value,
            gender: gender.value,
            mobile: mobile.value,
            nationality: nationality.value,
        };

        try {
            const res: any = await RemitterPostRegistration(postData);
            if (res.status === 200) {
                if (res.data.StatusCode === "ER0000") {
                    Toast.show({ type: 'success', text1: 'Success', text2: res.data.StatusMsg });
                    setProfileItems({
                        ...profileItems,
                        firstName: firstName.value,
                        lastName: lastName.value,
                        email: email.value,
                        mobileNo: mobile.value,
                    });
                    navigation.navigate('Root' as never);
                } else {
                    Toast.show({ type: 'error', text1: 'Update Failed', text2: res.data.StatusMsg });
                }
            }
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || "An error occurred" });
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (
        label: string, 
        value: string, 
        onChangeText: (text: string) => void, 
        error: string, 
        editable: boolean = true, 
        placeholder: string = "",
        iconName: string = "user",
        iconType: any = "feather",
        keyboardType: any = "default"
    ) => (
        <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
            <View style={[styles.inputWrapper, !editable && styles.disabledInput, error ? styles.inputError : null]}>
                <Vector as={iconType} name={iconName} size={18} color="#A19188" style={{ marginRight: 12 }} />
                <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChangeText}
                    editable={editable}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoComplete="off"
                    importantForAutofill="no"
                    textContentType="none"
                    keyboardType={keyboardType}
                />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* Background with Decorative Glows */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={require('../../assets/images/currency_financial_bg.png')}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            </View>

            <SafeAreaView style={styles.safeHeader}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backCircle}
                        activeOpacity={0.7}
                    >
                        <Vector as="ionicons" name="chevron-back" size={24} color="#3A2D27" />
                    </TouchableOpacity>
                    
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/logos/cb_logo_new.png')}
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={{ width: 44 }} />
                </View>
                
                <View style={styles.titleBox}>
                    <Text style={styles.headerTitle}>Post Registration</Text>
                    <Text style={styles.headerSub}>Complete your personal profile</Text>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarFill} />
                    </View>
                </View>
            </SafeAreaView>

            <View style={styles.body}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Animated.View entering={FadeInDown.duration(600).delay(100)}>
                        <LinearGradient
                            colors={['#FFFFFF', '#FFFDFB']}
                            style={styles.sectionCard}
                        >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>YOUR PERSONAL DETAILS</Text>
                            <View style={styles.pulseDot} />
                        </View>

                        <ModalPicker
                            label="TITLE"
                            modalTitle="Select Title"
                            placeholder="Select Title"
                            dataList={titleList}
                            style={styles.pickerStyle}
                            selectedValue={title.value}
                            onValueChange={(itemValue) => setTitle({ value: itemValue, error: '' })}
                            iconName="user"
                            iconType="feather"
                        />

                        {renderInput("First name", firstName.value, (text) => setFirstName({ value: text.replace(/[^A-Za-z\s]/g, ''), error: '' }), firstName.error, true, "", "user", "feather")}
                        {renderInput("Last name", lastName.value, (text) => setLastName({ value: text.replace(/[^A-Za-z\s]/g, ''), error: '' }), lastName.error, true, "", "user", "feather")}
                        {renderInput("Email id", email.value, () => { }, email.error, false, "", "mail", "feather")}
                        {renderInput("Mobile", mobile.value, () => { }, mobile.error, false, "", "phone", "feather")}

                        <ModalPicker
                            label="GENDER"
                            modalTitle="Select Gender"
                            placeholder="Select Gender"
                            dataList={genderList}
                            style={styles.pickerStyle}
                            selectedValue={gender.value}
                            onValueChange={(itemValue) => setGender({ value: itemValue, error: '' })}
                            iconName="users"
                            iconType="feather"
                        />

                        <View style={styles.inputContainer}>
                            <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
                            <TouchableOpacity
                                onPress={() => setShowPicker(true)}
                                style={styles.inputWrapper}
                            >
                                <Vector as="ionicons" name="calendar-outline" size={18} color="#A19188" style={{ marginRight: 12 }} />
                                <Text style={styles.dateText}>{dateOfBirth.value.toLocaleDateString()}</Text>
                            </TouchableOpacity>

                            {showPicker && (
                                <DateTimePicker
                                    value={dateOfBirth.value}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowPicker(false);
                                        if (selectedDate) {
                                            const age = moment().diff(selectedDate, 'years');
                                            if (age < 15) {
                                                setDateOfBirth({ value: selectedDate, error: 'You must be at least 15 years old' });
                                            } else {
                                                setDateOfBirth({ value: selectedDate, error: '' });
                                            }
                                        }
                                    }}
                                />
                            )}
                            {dateOfBirth.error ? <Text style={styles.errorText}>{dateOfBirth.error}</Text> : null}
                        </View>

                        <ModalPicker
                            label="NATIONALITY"
                            modalTitle="Select Nationality"
                            placeholder="Select Nationality"
                            dataList={nationalityList}
                            style={styles.pickerStyle}
                            selectedValue={nationality.value}
                            onValueChange={(itemValue) => setNationality({ value: itemValue, error: '' })}
                            iconName="globe"
                            iconType="feather"
                        />
                        </LinearGradient>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(600).delay(300)}>
                        <LinearGradient
                            colors={['#FFFFFF', '#FFFDFB']}
                            style={[styles.sectionCard, { marginTop: 24 }]}
                        >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>ADDRESS DETAILS</Text>
                            <View style={[styles.pulseDot, { backgroundColor: '#FF8E72' }]} />
                        </View>

                        {renderInput("Address line 1", addressLine1.value, (text) => setAddressLine1({ value: text, error: '' }), addressLine1.error, true, "", "map-pin", "feather")}
                        {renderInput("Address line 2", addressLine2.value, (text) => setAddressLine2({ value: text, error: '' }), addressLine2.error, true, "Optional", "map-pin", "feather")}

                        <ModalPicker
                            label="COUNTRY"
                            modalTitle="Select Country"
                            placeholder="Select Country"
                            dataList={countryList}
                            style={styles.pickerStyle}
                            selectedValue={country.value}
                            onValueChange={(itemValue) => setCountry({ value: itemValue, error: '' })}
                            iconName="flag"
                            iconType="feather"
                        />

                        {renderInput("City", city.value, (text) => setCity({ value: text.replace(/[^A-Za-z\s]/g, ''), error: '' }), city.error, true, "", "home", "feather")}
                        {renderInput("Post code", postCode.value, (text) => setPostCode({ value: text.replace(/[^0-9]/g, ''), error: '' }), postCode.error, true, "", "hash", "feather", "numeric")}
                        </LinearGradient>
                    </Animated.View>

                    <View style={{ height: 120 }} />
                </ScrollView>
            </View>

            {/* Bottom Fixed Update Button */}
            <LinearGradient
                colors={['rgba(252, 245, 241, 0)', 'rgba(252, 245, 241, 0.95)', '#FCF5F1']}
                style={styles.footer}
            >
                <TouchableOpacity
                    onPress={_onUpdatePressed}
                    activeOpacity={0.8}
                    style={styles.updateButton}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={styles.buttonContent}>
                            <Text style={styles.updateText}>Update Profile</Text>
                            <Vector as="ionicons" name="arrow-forward" size={18} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
            </LinearGradient>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FF8E72" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCF5F1',
    },
    body: {
        flex: 1,
    },
    progressBarContainer: {
        width: 100,
        height: 4,
        backgroundColor: 'rgba(255, 142, 114, 0.2)',
        borderRadius: 2,
        marginTop: 10,
        alignSelf: 'center',
    },
    progressBarFill: {
        width: '80%',
        height: '100%',
        backgroundColor: '#FF8E72',
        borderRadius: 2,
    },
    safeHeader: {
        marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingTop: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(59, 47, 47, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerLogo: {
        height: 40,
        width: 120,
    },
    titleBox: {
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 5,
    },
    headerTitle: {
        fontSize: RFValue(18),
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        color: '#3A2D27',
        fontWeight: 'bold',
    },
    headerSub: {
        fontSize: RFValue(11),
        fontFamily: FONTS.medium,
        color: '#8A7A71',
        marginTop: 4,
    },
    scrollContent: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    sectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 30,
        padding: 24,
        ...Platform.select({
            ios: { shadowColor: '#3A2D27', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
            android: { elevation: 5 },
        }),
        borderWidth: 1,
        borderColor: 'rgba(255, 142, 114, 0.2)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: RFValue(11),
        fontFamily: FONTS.bold,
        color: "#3A2D27",
        letterSpacing: 1.5,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#FF8E72",
        marginLeft: 10,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: RFValue(10),
        fontFamily: FONTS.semibold,
        color: '#6E5D54',
        marginBottom: 8,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        height: RFValue(48),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: '#E2C5BD',
        ...Platform.select({
            ios: { shadowColor: '#3A2D27', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    textInput: {
        flex: 1,
        fontSize: RFValue(11),
        color: '#3A2D27',
        fontFamily: FONTS.medium,
        fontWeight: '600',
        backgroundColor: '#FFFFFF',
        // @ts-ignore
        outlineStyle: 'none',
    },
    disabledInput: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        opacity: 0.7,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        fontSize: RFValue(9),
        color: '#ef4444',
        marginTop: 4,
        marginLeft: 4,
        fontFamily: FONTS.medium,
    },
    dateText: {
        flex: 1,
        fontSize: RFValue(11),
        fontFamily: FONTS.medium,
        color: '#3A2D27',
        fontWeight: '600',
    },
    pickerStyle: {
        width: '100%',
        marginBottom: 16,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 40,
        backgroundColor: 'transparent',
    },
    updateButton: {
        height: 56,
        borderRadius: 20,
        backgroundColor: '#FF8E72',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateText: {
        fontSize: RFValue(12),
        fontFamily: FONTS.bold,
        color: '#fff',
        fontWeight: '700',
        marginRight: 8,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(59, 47, 47, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
});

export default PostRegistration;
