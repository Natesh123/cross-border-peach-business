import React, { useState, useEffect } from "react";
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
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../core/theme";
import Button from "../../components/Button";
import Container from "../../theme/Container";
import Vector from "app/assets/vectors";
import { emailValidator, passwordValidator } from "../../core/utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { ValidatePreRegistration } from "app/http-services";
import { useRecoilState } from "recoil";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { ProfileState } from "app/atoms";
import Toast from "react-native-toast-message";
import Spinner from "react-native-loading-spinner-overlay";
import Checkbox from "app/components/Checkbox";
import { FONTS, SIZES } from "app/constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppStatusBar from "../../components/AppStatusBar";
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isShortDevice = SCREEN_HEIGHT < 750;
const vScale = SCREEN_HEIGHT / 812;

const Signup = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [ProfileItems, setProfileItems] = useRecoilState(ProfileState);
  const [loading, setLoading] = useState(false);

  // ✅ Account Type (default = personal)
  const [accountType, setAccountType] = useState("personal");

  // ✅ Form states
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [mobileNo, setMobileNo] = useState({ value: "", error: "" });
  const [countryCode, setCountryCode] = useState({ value: "91", error: "" });
  const [businessName, setBusinessName] = useState({ value: "", error: "" });
  const [gstNumber, setGstNumber] = useState({ value: "", error: "" });

  const [checkedTerms, setCheckedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(!showPassword);

  // ✅ Save selected account type
  const handleAccountTypeChange = async (type: string) => {
    setAccountType(type);
    try {
      const value = type === "personal" ? "Personal" : "Business";
      await AsyncStorage.setItem("accountType", value);
    } catch (error) {
      console.log("Error saving account type:", error);
    }
  };

  // ✅ Load stored account type
  useEffect(() => {
    const loadAccountType = async () => {
      try {
        const savedType = await AsyncStorage.getItem("accountType");
        if (savedType) {
          setAccountType(savedType.toLowerCase());
        } else {
          await AsyncStorage.setItem("accountType", "Personal");
          setAccountType("personal");
        }
      } catch (error) {
        console.log("Error loading account type:", error);
      }
    };
    loadAccountType();
  }, [isFocused]);

  const _onSignUpPressed = async () => {
    setLoading(true);

    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    const mobileError = mobileNo.value.length < 10 ? "Enter a valid mobile number" : "";

    setEmail({ ...email, error: emailError });
    setPassword({ ...password, error: passwordError });
    setMobileNo({ ...mobileNo, error: mobileError });

    if (emailError || passwordError || mobileError) {
      Toast.show({
        type: "error",
        text1: "Sign up Required",
        text2: "Please enter valid details.",
      });
      setLoading(false);
      return;
    }

    if (!checkedTerms) {
      Toast.show({
        type: "error",
        text1: "Agreement Required",
        text2: "Please agree to the Terms & Conditions.",
      });
      setLoading(false);
      return;
    }

    const postData = {
      email: email.value,
      mobileNumber: countryCode.value + "-" + mobileNo.value,
      password: password.value,
      accountType: accountType === "personal" ? "Personal" : "Business",
      businessName: businessName.value,
      gstNumber: gstNumber.value,
    };

    try {
      const res = await ValidatePreRegistration(postData);
      if (res.status === 200) {
        if (res.data.StatusCode === "ER0000") {
          Toast.show({
            type: "success",
            text1: "Registration",
            text2: "OTP has been sent to your registered mobile number",
          });

          let param = {
            email: email.value,
            mobile: countryCode.value + "-" + mobileNo.value,
            password: password.value,
          };

          navigation.navigate("ValidateRegistration", param);
        } else {
          Toast.show({
            type: "error",
            text1: "Registration",
            text2: res.data.StatusMsg,
          });
        }
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Registration",
        text2: err.toString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const toastConfig = {
    success: ({ text1, text2 }: any) => (
      <View style={localStyles.toastContainerSuccess}>
        <LinearGradient
          colors={['#f0fdf4', '#ffffff']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={localStyles.toastGradient}
        >
          <View style={localStyles.toastIconBoxSuccess}>
            <Vector as="feather" name="check-circle" size={20} color="#10b981" />
          </View>
          <View style={localStyles.toastContent}>
            <Text style={localStyles.toastTitleSuccess}>{text1}</Text>
            {text2 && <Text style={localStyles.toastMessageSuccess}>{text2}</Text>}
          </View>
        </LinearGradient>
      </View>
    ),
    error: ({ text1, text2 }: any) => (
      <View style={localStyles.toastContainerError}>
        <LinearGradient
          colors={['#fef2f2', '#ffffff']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={localStyles.toastGradient}
        >
          <View style={localStyles.toastIconBoxError}>
            <Vector as="feather" name="alert-circle" size={20} color="#ef4444" />
          </View>
          <View style={localStyles.toastContent}>
            <Text style={localStyles.toastTitleError}>{text1}</Text>
            {text2 && <Text style={localStyles.toastMessageError}>{text2}</Text>}
          </View>
        </LinearGradient>
      </View>
    ),
  };

  return (
    <View style={[localStyles.mainContainer, { overflow: 'hidden' }]}>
      <AppStatusBar style="dark" translucent />
      
      {Platform.OS === 'web' && (
        // @ts-ignore
        <style dangerouslySetInnerHTML={{__html: `
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active  {
              -webkit-box-shadow: 0 0 0 30px white inset !important;
              -webkit-text-fill-color: #3A2D27 !important;
          }
        `}} />
      )}

      {/* Background with Decorative Glows */}
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
                  onPress={() => navigation.navigate("Onboarding")}
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
                Join the Elite
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(400).duration(800)} style={localStyles.subWelcomeText}>
                Experience the next generation of global financial management.
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
                  {/* Account Type Toggle inside Card */}
                  <View style={localStyles.toggleBg}>
                    <TouchableOpacity
                      onPress={() => handleAccountTypeChange('personal')}
                      style={[localStyles.toggleBtn, accountType === 'personal' && localStyles.activeToggle]}
                    >
                      <Text style={[localStyles.toggleText, accountType === 'personal' && localStyles.activeToggleText]}>
                        Personal
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAccountTypeChange('business')}
                      style={[localStyles.toggleBtn, accountType === 'business' && localStyles.activeToggle]}
                    >
                      <Text style={[localStyles.toggleText, accountType === 'business' && localStyles.activeToggleText]}>
                        Business
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Input Fields */}
                  <View style={localStyles.inputContainer}>
                    {/* Email */}
                    <View style={localStyles.inputGroup}>
                      <Text style={localStyles.fieldLabel}>EMAIL ADDRESS</Text>
                      <View style={[localStyles.inputWrapper, email.error ? localStyles.inputError : null]}>
                        <View style={localStyles.iconBox}>
                          <Vector as="feather" name="mail" size={18} color="#1E293B" />
                        </View>
                        <TextInput
                          style={localStyles.textInput}
                          value={email.value}
                          onChangeText={(text) => setEmail({ value: text, error: "" })}
                          autoCapitalize="none"
                          placeholder="your@email.com"
                          placeholderTextColor="#94a3b8"
                          keyboardType="email-address"
                          autoComplete="off"
                          importantForAutofill="no"
                          textContentType="none"
                        />
                      </View>
                      {email.error ? <Text style={localStyles.errorText}>{email.error}</Text> : null}
                    </View>

                    {/* Mobile */}
                    <View style={localStyles.inputGroup}>
                      <Text style={localStyles.fieldLabel}>SECURE CONTACT</Text>
                      <View style={[localStyles.inputWrapper, mobileNo.error ? localStyles.inputError : null]}>
                        <View style={localStyles.iconBox}>
                          <Vector as="feather" name="phone" size={18} color="#1E293B" />
                        </View>
                        <View style={localStyles.countryCodeBox}>
                          <Text style={localStyles.countryCodeText}>+{countryCode.value}</Text>
                        </View>
                        <TextInput
                          style={localStyles.textInput}
                          value={mobileNo.value}
                          onChangeText={(text) => setMobileNo({ value: text, error: "" })}
                          placeholder="Mobile Number"
                          placeholderTextColor="#94a3b8"
                          keyboardType="numeric"
                        />
                      </View>
                      {mobileNo.error ? <Text style={localStyles.errorText}>{mobileNo.error}</Text> : null}
                    </View>

                    {/* Password */}
                    <View style={localStyles.inputGroup}>
                      <Text style={localStyles.fieldLabel}>SECURITY PASSWORD</Text>
                      <View style={[localStyles.inputWrapper, password.error ? localStyles.inputError : null]}>
                        <View style={localStyles.iconBox}>
                          <Vector as="feather" name="lock" size={18} color="#1E293B" />
                        </View>
                        <TextInput
                          style={localStyles.textInput}
                          placeholder="••••••••"
                          placeholderTextColor="#94a3b8"
                          value={password.value}
                          onChangeText={(text) => setPassword({ value: text, error: "" })}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity style={localStyles.eyeIcon} onPress={toggleShowPassword}>
                          <Vector
                            as="feather"
                            name={showPassword ? "eye" : "eye-off"}
                            size={18}
                            color="#94a3b8"
                          />
                        </TouchableOpacity>
                      </View>
                      {password.error ? <Text style={localStyles.errorText}>{password.error}</Text> : null}
                    </View>

                    {/* Business specific fields */}
                    {accountType === "business" && (
                      <Animated.View entering={FadeInDown.duration(400)}>
                        {/* <View style={localStyles.inputGroup}>
                          <Text style={localStyles.fieldLabel}>BUSINESS NAME</Text>
                          <View style={localStyles.inputWrapper}>
                            <View style={localStyles.iconBox}>
                              <Vector as="feather" name="briefcase" size={18} color="#1E293B" />
                            </View>
                            <TextInput
                              style={localStyles.textInput}
                              value={businessName.value}
                              onChangeText={(text) => setBusinessName({ value: text, error: "" })}
                              placeholder="Kashremit Ltd"
                              placeholderTextColor="#94a3b8"
                            />
                          </View>
                        </View> */}

                        {/* <View style={localStyles.inputGroup}>
                          <Text style={localStyles.fieldLabel}>GST / TAX ID</Text>
                          <View style={localStyles.inputWrapper}>
                            <View style={localStyles.iconBox}>
                              <Vector as="feather" name="file-text" size={18} color="#1E293B" />
                            </View>
                            <TextInput
                              style={localStyles.textInput}
                              value={gstNumber.value}
                              onChangeText={(text) => setGstNumber({ value: text, error: "" })}
                              placeholder="GST12345678"
                              placeholderTextColor="#94a3b8"
                            />
                          </View>
                        </View> */}
                      </Animated.View>
                    )}

                  </View>

                  {/* Terms Checkbox */}
                  <View style={localStyles.termsRow}>
                    <Checkbox
                      status={checkedTerms ? "checked" : "unchecked"}
                      onPress={() => setCheckedTerms(!checkedTerms)}
                    />
                    <Text style={localStyles.termsLabel}>I consent to the </Text>
                    <TouchableOpacity>
                      <Text style={localStyles.termsLink}>Terms & Master Agreement</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bottom Actions */}
                <View style={localStyles.bottomActions}>
                  <TouchableOpacity
                    onPress={_onSignUpPressed}
                    activeOpacity={0.85}
                    style={localStyles.signUpBtn}
                  >
                    <LinearGradient
                      colors={['#3A2D27', '#2C2323']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={localStyles.btnGradient}
                    >
                      <Text style={localStyles.signUpBtnText}>Get Started</Text>
                      <View style={localStyles.btnArrow}>
                        <Vector as="ionicons" name="arrow-forward" size={18} color="#fff" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={localStyles.loginLinkContainer}>
                    <Text style={localStyles.alreadyAccountText}>Already an elite member? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                      <Text style={localStyles.loginText}>Sign In to Account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      <Toast config={toastConfig} />

      {loading && (
        <Spinner visible={true} size="large" animation="fade" />
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
    fontSize: RFValue(28),
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
  toggleBg: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 15,
    padding: 4,
    marginBottom: 25,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeToggle: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      }
    }),
  },
  toggleText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#8A7A71',
    fontWeight: '700',
  },
  activeToggleText: {
    color: '#3A2D27',
  },
  inputContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
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
  countryCodeBox: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    marginRight: 10,
  },
  countryCodeText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#3A2D27',
    fontWeight: '700',
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
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: SIZES.small,
    color: '#ef4444',
    marginTop: 8,
    marginLeft: 6,
    fontFamily: FONTS.medium,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingLeft: 4,
  },
  termsLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONTS.medium,
    marginLeft: 8,
  },
  termsLink: {
    fontSize: 12,
    color: '#3A2D27',
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  bottomActions: {
    marginTop: 25,
  },
  signUpBtn: {
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
  signUpBtnText: {
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
  alreadyAccountText: {
    color: '#64748b',
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontWeight: '500',
  },
  loginText: {
    color: '#3A2D27',
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  // Toast Styles
  toastContainerSuccess: {
    height: 70,
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderLeftWidth: 6,
    borderLeftColor: '#10b981',
    marginTop: Platform.OS === 'ios' ? 20 : 50,
    overflow: 'hidden',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  toastContainerError: {
    height: 70,
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderLeftWidth: 6,
    borderLeftColor: '#ef4444',
    marginTop: Platform.OS === 'ios' ? 20 : 50,
    overflow: 'hidden',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  toastGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toastIconBoxSuccess: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIconBoxError: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastContent: {
    marginLeft: 12,
    flex: 1,
  },
  toastTitleSuccess: {
    fontSize: 16,
    fontWeight: '900',
    color: '#064e3b',
    fontFamily: FONTS.bold,
  },
  toastTitleError: {
    fontSize: 16,
    fontWeight: '900',
    color: '#7f1d1d',
    fontFamily: FONTS.bold,
  },
  toastMessageSuccess: {
    fontSize: 13,
    color: '#047857',
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  toastMessageError: {
    fontSize: 13,
    color: '#b91c1c',
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
});

export default Signup;
