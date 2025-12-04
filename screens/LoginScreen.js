import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../firebase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Email dan password tidak boleh kosong");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login gagal";
      if (error.code === "auth/user-not-found") {
        errorMessage = "User tidak ditemukan. Silakan register terlebih dahulu.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Password salah";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email tidak valid";
      }
      Alert.alert("Login Gagal", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !username.trim()) {
      Alert.alert("Error", "Semua field harus diisi");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Sukses", "Akun berhasil dibuat!");
      // Auto login setelah register
    } catch (error) {
      console.error("Register error:", error);
      let errorMessage = "Register gagal";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email sudah terdaftar";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email tidak valid";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password terlalu lemah";
      }
      Alert.alert("Register Gagal", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegister ? "Register Akun" : "Login"}</Text>
      
      {isRegister && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" />
      ) : (
        <>
          <Button 
            title={isRegister ? "Register" : "Login"} 
            onPress={isRegister ? handleRegister : handleLogin}
          />
          
          <TouchableOpacity 
            onPress={() => setIsRegister(!isRegister)}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {isRegister ? "Sudah punya akun? Login" : "Belum punya akun? Register"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 28, textAlign: "center", marginBottom: 30, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  toggleButton: {
    marginTop: 20,
    alignItems: "center",
  },
  toggleText: {
    color: "#0066cc",
    fontSize: 16,
  },
});