import React, { useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Vector from "app/assets/vectors";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useRecoilState } from "recoil";
import { ProfileState } from "app/atoms";
import Toast from "react-native-toast-message";
import Spinner from "react-native-loading-spinner-overlay";
import { ValidateRegistrationParamList } from "types";
import { FONTS, SIZES } from "app/constants/Assets";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AppStatusBar from "../../components/AppStatusBar";
import { RemitterPreRegistration, ValidateOTP } from "app/http-services";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isShortDevice = SCREEN_HEIGHT < 750;
const vScale = SCREEN_HEIGHT / 812;

const ValidateRegistration = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<{ params: ValidateRegistrationParamList }, 'params'>>()
    const [email, setEmail] = useState(route.params?.email);
    const [mobile, setMobile] = useState(route.params?.mobile);
    const [password, setPassword] = useState(route.params?.password);
    const [referralId, setReferralId] = useState(route.params?.referralId);

    const { width } = useWindowDimensions();
    const [ProfileItems, setProfileItems] = useRecoilState(ProfileState);

    const [loading, setLoading] = useState(false);

    const [emailOTP, setEmailOTP] = useState({ value: '', error: '' });
    const [mobileOTP, setMobileOTP] = useState({ value: '', error: '' });



    const keyboardVerticalOffset = Platform.OS === 'ios' ? 80 : 0;

    const _onLoginPressed = async () => {
        setLoading(true)


        const postData: any = {
            email: email,
            emailOTP: "",
            mobile: mobile,
            type: 'R',
            mobileOTP: mobileOTP.value
        };

        const response = ValidateOTP(postData);
        const accountType = await AsyncStorage.getItem("accountType");
         const isPerBusType = accountType === "Business" ? "Y" : "N";
        response.then((res: any) => {
            if (res.status === 200) {
                if (res.data.StatusCode === "ER0000") {
                    const preRegistrationData: any = {
                        email: email,
                        mobileNumber: mobile,
                        password: password,
                        referralId: referralId,
                        IsPerBusType: isPerBusType

                    };
                    const response = RemitterPreRegistration(preRegistrationData);
                    response.then((res: any) => {
                        if (res.status === 200) {
                            if (res.data.StatusCode === "ER0000") {
                                Toast.show({
                                    type: 'success',
                                    text1: 'Registration',
                                    text2:  res.data.StatusMsg
                                });

                                navigation.navigate('Login');
                            } else {
                                Toast.show({
                                    type: 'error',
                                    text1: 'Registration',
                                    text2: res.data.StatusMsg
                                });
                            }
                        }
                    })
                        .catch((err: any) => {
                            Toast.show({
                                type: 'error',
                                text1: 'Registration',
                                text2: err
                            });
                        })
                        .finally(() => setLoading(false));

                } else {
                    Toast.show({
                        type: 'error',
                        text1: 'Registration',
                        text2: res.data.StatusMsg
                    });
                }
            }
        })
            .catch((err: any) => {
                Toast.show({
                    type: 'error',
                    text1: 'Validate',
                    text2: err
                });
            })
            .finally(() => setLoading(false));
    }


    return (
        <View style={[localStyles.mainContainer, { overflow: 'hidden' }]}>
            <AppStatusBar style="dark" translucent />

            {/* Background */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={require('../../assets/images/currency_financial_bg.png')}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1 }}>
                    {/* Top Header Section */}
                    <View style={[localStyles.headerSection, { height: SCREEN_HEIGHT * (isShortDevice ? 0.26 : 0.32) }]}>
                        <View style={localStyles.headerTop}>
                            <Animated.View entering={FadeInDown.duration(800)} style={localStyles.backButtonContainer}>
                                <TouchableOpacity
                                    style={localStyles.backButton}
                                    onPress={() => navigation.navigate('Onboarding')}
                                >
                                    <Vector as="ionicons" name="arrow-back" size={24} color="#1E293B" />
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View entering={FadeInDown.delay(100).duration(800)} style={localStyles.logoContainer}>
                                <Image
                                    source={require('../../assets/logos/cb_logo_new.png')}
                                    style={localStyles.appLogo}
                                    resizeMode="contain"
                                />
                            </Animated.View>
                        </View>

                        <View style={localStyles.headerTextContainer}>
                            <Animated.Text entering={FadeInDown.delay(200).duration(800)} style={localStyles.welcomeText}>
                                Enter OTP
                            </Animated.Text>
                            <Animated.Text entering={FadeInDown.delay(400).duration(800)} style={localStyles.subWelcomeText}>
                                Kindly enter the OTP sent to your mobile and email.
                            </Animated.Text>
                        </View>
                    </View>

                    {/* Form Content Card */}
                    <Animated.View
                        entering={FadeInUp.delay(600).duration(800)}
                        style={localStyles.contentCard}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#ffffff']}
                            style={localStyles.cardGradient}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                bounces={true}
                                contentContainerStyle={localStyles.scrollContent}
                            >
                                <View style={localStyles.topContentGroup}>
                                    {/* Mobile OTP */}
                                    <View style={localStyles.inputGroup}>
                                        <Text style={localStyles.fieldLabel}>MOBILE OTP</Text>
                                        <View style={[localStyles.inputWrapper, mobileOTP.error ? localStyles.inputError : null]}>
                                            <View style={localStyles.iconBox}>
                                                <Vector as="feather" name="phone" size={18} color="#1E293B" />
                                            </View>
                                            <TextInput
                                                style={localStyles.textInput}
                                                value={mobileOTP.value}
                                                onChangeText={(text: any) => setMobileOTP({ value: text, error: '' })}
                                                autoCapitalize="none"
                                                placeholder="Mobile OTP"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        {mobileOTP.error ? <Text style={localStyles.errorText}>{mobileOTP.error}</Text> : null}
                                    </View>

                                    <View style={localStyles.resendContainer}>
                                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                            <Text style={localStyles.resendText}>Resend Mobile OTP</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Email OTP */}
                                    <View style={localStyles.inputGroup}>
                                        <Text style={localStyles.fieldLabel}>EMAIL OTP</Text>
                                        <View style={[localStyles.inputWrapper, emailOTP.error ? localStyles.inputError : null]}>
                                            <View style={localStyles.iconBox}>
                                                <Vector as="feather" name="mail" size={18} color="#1E293B" />
                                            </View>
                                            <TextInput
                                                style={localStyles.textInput}
                                                value={emailOTP.value}
                                                onChangeText={(text: any) => setEmailOTP({ value: text, error: '' })}
                                                autoCapitalize="none"
                                                placeholder="Email OTP"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        {emailOTP.error ? <Text style={localStyles.errorText}>{emailOTP.error}</Text> : null}
                                    </View>

                                    <View style={localStyles.resendContainer}>
                                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                            <Text style={localStyles.resendText}>Resend Email OTP</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={localStyles.bottomActions}>
                                    <TouchableOpacity
                                        onPress={_onLoginPressed}
                                        activeOpacity={0.85}
                                        style={localStyles.confirmBtn}
                                    >
                                        <LinearGradient
                                            colors={['#3A2D27', '#2C2323']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={localStyles.btnGradient}
                                        >
                                            <Text style={localStyles.confirmBtnText}>Confirm</Text>
                                            <View style={localStyles.btnArrow}>
                                                <Vector as="ionicons" name="arrow-forward" size={18} color="#fff" />
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <View style={localStyles.loginLinkContainer}>
                                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                            <Text style={localStyles.backToRegisterText}>Back to Register</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </LinearGradient>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>

            {loading && (
                <Spinner
                    visible={true}
                    size="large"
                    animation="slide"
                />
            )}
        </View>
    );
};

const localStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F4EFEA',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 55 : 45,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  logoContainer: {
    width: 100,
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      }
    }),
  },
  appLogo: {
    width: 80,
    height: 45,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      }
    }),
  },
  headerTextContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: '#3A2D27',
    fontWeight: '800',
    textAlign: 'center',
  },
  subWelcomeText: {
    fontSize: SIZES.h4,
    fontFamily: FONTS.medium,
    color: '#6E5D54',
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  contentCard: {
    flex: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: '#ffffff',
    marginHorizontal: 30,
    marginBottom: 30,
    marginTop: -30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      }
    }),
  },
  cardGradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    borderRadius: 40,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  topContentGroup: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: '#6E5D54',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff1f2',
  },
  iconBox: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#3A2D27',
    fontFamily: FONTS.medium,
    fontWeight: '600',
    backgroundColor: 'transparent',
    // @ts-ignore
    outlineStyle: 'none',
  },
  errorText: {
    fontSize: SIZES.small,
    color: '#ef4444',
    marginTop: 8,
    marginLeft: 6,
    fontFamily: FONTS.medium,
  },
  resendContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#3A2D27',
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  bottomActions: {
    marginTop: 20,
  },
  confirmBtn: {
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#3A2D27',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      }
    }),
    marginBottom: 20,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  btnArrow: {
    position: 'absolute',
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  backToRegisterText: {
    color: '#3A2D27',
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});

export default ValidateRegistration;
