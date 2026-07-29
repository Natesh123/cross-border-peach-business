import { FontAwesome } from "@expo/vector-icons";
import * as Font from "expo-font";

import { useEffect, useState } from "react";

export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        // Load fonts with SFProDisplay naming handles
        await Font.loadAsync({
          ...FontAwesome.font,
          "SFProDisplay-Light": require("../assets/fonts/outfit/Outfit-Light.ttf"),
          "SFProDisplay-Regular": require("../assets/fonts/outfit/Outfit-Regular.ttf"),
          "SFProDisplay-Medium": require("../assets/fonts/outfit/Outfit-Medium.ttf"),
          "SFProDisplay-SemiBold": require("../assets/fonts/outfit/Outfit-SemiBold.ttf"),
          "SFProDisplay-Bold": require("../assets/fonts/outfit/Outfit-Bold.ttf"),
        });
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
}
