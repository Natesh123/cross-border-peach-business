import 'react-native-gesture-handler';
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RecoilRoot } from "recoil";
import useCachedResources from "./app/hooks/useCachedResources";
import Navigation from "./app/navigation";
import Toast from "react-native-toast-message";
import { MenuProvider } from "react-native-popup-menu";

import AnimatedSplashScreen from "./app/components/AnimatedSplashScreen";



export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const [splashComplete, setSplashComplete] = useState(false);

  return (
    <RecoilRoot>
      <SafeAreaProvider>
        <MenuProvider>
          {(!isLoadingComplete || !splashComplete) ? (
            <AnimatedSplashScreen onAnimationComplete={() => setSplashComplete(true)} />
          ) : (
            <>
              {Platform.OS === 'web' && (
                <style dangerouslySetInnerHTML={{ __html: `
                  input:-webkit-autofill,
                  input:-webkit-autofill:hover, 
                  input:-webkit-autofill:focus, 
                  input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px white inset !important;
                    -webkit-text-fill-color: #1A1515 !important;
                  }
                  input {
                    outline: none !important;
                  }
                `}} />
              )}
              <Navigation colorScheme={colorScheme} />
              <StatusBar hidden={true} />
              <Toast />
            </>
          )}
        </MenuProvider>
      </SafeAreaProvider>
    </RecoilRoot>
  );
}
