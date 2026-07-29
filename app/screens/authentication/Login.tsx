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
  LogBox,
  StyleSheet,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../core/theme";
import Button from "../../components/Button";
import Container from "../../theme/Container";
import Vector from "app/assets/vectors";
import { emailValidator, passwordValidator } from "../../core/utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRecoilState } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { ProfileState } from "app/atoms";
import Toast from "react-native-toast-message";
import Spinner from "react-native-loading-spinner-overlay";
import { loginService } from "app/services/auth.service";
import { FONTS, SIZES } from "app/constants/Assets";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppStatusBar from "../../components/AppStatusBar";
import { RFValue } from "react-native-responsive-fontsize";
import Animated, { FadeInDown, FadeInUp, FadeInRight, FadeIn } from 'react-native-reanimated';

// Ignore warning in development if needed
LogBox.ignoreLogs(["[DOM] Password field is not contained in a form"]);

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isShortDevice = SCREEN_HEIGHT < 750;
const vScale = SCREEN_HEIGHT / 812;

const Login = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { width, height } = useWindowDimensions();
  const [ProfileItems, setProfileItems] = useRecoilState(ProfileState);

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    setEmail({ value: "", error: "" });
    setPassword({ value: "", error: "" });
    setShowPassword(false);
  }, [isFocused]);

  useEffect(() => {
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (!emailError && !passwordError) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [email.value, password.value]);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const _onLoginPressed = async () => {
    setLoading(true);
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      setLoading(false);

      let errorMsg = "Please fill in all required fields";
      if (!email.value && !password.value) {
        errorMsg = "Email and Password are required";
      } else if (!email.value) {
        errorMsg = "Please enter your email address";
      } else if (!password.value) {
        errorMsg = "Please enter your password";
      } else {
        errorMsg = "Please enter a valid email and password";
      }

      Toast.show({
        type: "error",
        text1: "Login Required",
        text2: errorMsg,
      });
      return;
    }

    const postData = {
      Email: email.value,
      Password: password.value,
    };

    loginService(
      postData,
      async (user: any) => {
        setProfileItems({
          remitterId: user.RemitterID,
          firstName: user.FirstName,
          lastName: user.LastName,
          email: user.Email,
          mobileNo: user.MobileNumber,
          tokenId: user.TokenID,
        });

        if (user.Is_Doc_Upload === "Y") {
          Toast.show({
            type: "error",
            text1: "Login",
            text2: "Your KYC document has been rejected. Please re-upload.",
          });
        }

        if (user.StatusCode === "ER0000") {
          await AsyncStorage.setItem("isLoggedIn", "true");
          navigation.navigate("App");
        } else if (user.StatusCode === "ER0053") {
          navigation.navigate("PostRegistration");
        }
      },
      (error: any) => {
        if (error.StatusCode) {
          Toast.show({
            type: "error",
            text1: "Login",
            text2: error.StatusMsg,
          });
        } else {
          // Check for Axios error details
          const errorMsg = error.response?.data?.StatusMsg || 
                          error.response?.data?.message || 
                          error.message || 
                          "Something went wrong. Please try again.";
          
          Toast.show({
            type: "error",
            text1: "Login failed",
            text2: errorMsg,
          });
          console.log("Detailed Login Error:", error.response?.data || error.message);
        }
      },
      () => {
        setLoading(false);
      }
    );
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
          <View style={[localStyles.headerSection, { height: SCREEN_HEIGHT * (isShortDevice ? 0.30 : 0.38) }]}>
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
                Welcome Back
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(400).duration(800)} style={localStyles.subWelcomeText}>
                Log in to access your premium global wallet and seamless transfers.
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
              <View style={localStyles.topContentGroup}>
                <View style={localStyles.formHeader}>
                  <Text style={localStyles.loginTitle}>AUTHORIZED ACCESS</Text>
                  <View style={localStyles.accentBar} />
                </View>

                {/* Input Fields */}
                <View style={localStyles.inputContainer}>
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

                  <View style={localStyles.inputGroup}>
                    <Text style={localStyles.fieldLabel}>PASSWORD</Text>
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
                </View>
              </View>

              <View style={localStyles.bottomActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword")}
                  style={localStyles.forgotContainer}
                >
                  <Text style={localStyles.forgotText}>Forgot?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={_onLoginPressed}
                  activeOpacity={0.85}
                  style={localStyles.loginBtn}
                >
                  <LinearGradient
                    colors={['#3A2D27', '#2C2323']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={localStyles.btnGradient}
                  >
                    <Text style={localStyles.loginBtnText}>Secure Log In</Text>
                    <View style={localStyles.btnArrow}>
                      <Vector as="ionicons" name="arrow-forward" size={18} color="#fff" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={localStyles.signupLinkContainer}>
                  <Text style={localStyles.noAccountText}>New to our Elite platform? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                    <Text style={localStyles.signupText}>Create an Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    fontSize: RFValue(24),
    fontFamily: FONTS.bold,
    color: '#3A2D27',
    fontWeight: '800',
    textAlign: 'center',
  },
  subWelcomeText: {
    fontSize: RFValue(11),
    fontFamily: FONTS.medium,
    color: '#6E5D54',
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: RFValue(18),
  },
  contentCard: {
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
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    borderRadius: 40,
    overflow: 'hidden',
  },
  formHeader: {
    marginBottom: 25,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    color: '#3A2D27',
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  accentBar: {
    width: 30,
    height: 3,
    backgroundColor: '#3A2D27',
    borderRadius: 2,
    marginTop: 8,
    alignSelf: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: RFValue(48),
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
    fontSize: RFValue(12),
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
    fontSize: RFValue(9),
    color: '#ef4444',
    marginTop: 8,
    marginLeft: 6,
    fontFamily: FONTS.medium,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotText: {
    fontSize: RFValue(11),
    color: '#3A2D27',
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  loginBtn: {
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
  loginBtnText: {
    color: '#ffffff',
    fontSize: RFValue(14),
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
  signupLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  topContentGroup: {
    width: '100%',
  },
  bottomActions: {
    marginTop: 10,
  },
  noAccountText: {
    color: '#64748b',
    fontSize: RFValue(11),
    fontFamily: FONTS.regular,
    fontWeight: '500',
  },
  signupText: {
    color: '#3A2D27',
    fontSize: RFValue(11),
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      }
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      }
    }),
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
    fontSize: RFValue(13),
    fontWeight: '900',
    color: '#064e3b',
    fontFamily: FONTS.bold,
  },
  toastTitleError: {
    fontSize: RFValue(13),
    fontWeight: '900',
    color: '#7f1d1d',
    fontFamily: FONTS.bold,
  },
  toastMessageSuccess: {
    fontSize: RFValue(11),
    color: '#047857',
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  toastMessageError: {
    fontSize: RFValue(11),
    color: '#b91c1c',
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
});

export default Login;
