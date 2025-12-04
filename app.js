// App.js
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { auth } from "./firebase";
import ChatScreen from "./screens/ChatScreen";
import LoginScreen from "./screens/LoginScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout fallback: jika offline, stop loading setelah 3 detik
    const timeout = setTimeout(() => {
      if (loading) {
        console.log("⚠️ Auth timeout - kemungkinan offline");
        setLoading(false);
      }
    }, 3000);

    // Auto-login: Listener akan otomatis detect user yang sudah login
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      clearTimeout(timeout);
    });
    
    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // User sudah login - langsung ke Chat
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ 
              title: "Chat Room",
              headerBackVisible: false 
            }}
            initialParams={{ user }}
          />
        ) : (
          // User belum login - ke halaman Login
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ 
              title: "Login Chat",
              headerShown: false 
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
