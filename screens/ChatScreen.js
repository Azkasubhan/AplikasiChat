// screens/ChatScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import {
    addDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, messagesCollection } from "../firebase";

const STORAGE_KEY = "@chat_messages_offline";

export default function ChatScreen({ route }) {
  const user = auth.currentUser;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  // Load offline messages saat app start
  useEffect(() => {
    loadOfflineMessages();
  }, []);

  // Realtime listener untuk Firestore
  useEffect(() => {
    const q = query(messagesCollection, orderBy("createdAt", "asc"));
    
    // Timeout untuk detect offline
    let onlineCheckTimeout;
    
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() || {}) });
        });
        setMessages(list);
        setIsOnline(true);
        console.log("🟢 Connected to Firestore - Online mode");
        // Simpan ke local storage
        saveMessagesToLocal(list);
        
        // Clear timeout karena berhasil connect
        clearTimeout(onlineCheckTimeout);
      },
      (err) => {
        console.error("❌ Firestore error:", err.code || err.message);
        console.log("🔴 Switched to Offline mode");
        setIsOnline(false);
      }
    );
    
    // Set timeout untuk detect offline jika tidak ada response dalam 5 detik
    onlineCheckTimeout = setTimeout(() => {
      if (isOnline === true) {
        console.log("⚠️ No Firestore response - might be offline");
        setIsOnline(false);
      }
    }, 5000);

    return () => {
      unsub();
      clearTimeout(onlineCheckTimeout);
    };
  }, []);

  const loadOfflineMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedMessages = JSON.parse(stored);
        console.log("✅ Loaded from offline storage:", parsedMessages.length, "messages");
        setMessages(parsedMessages);
      } else {
        console.log("ℹ️ No offline messages found");
      }
    } catch (e) {
      console.error("❌ Load offline messages error", e);
    }
  };

  const saveMessagesToLocal = async (msgs) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
      console.log("💾 Saved to local storage:", msgs.length, "messages");
    } catch (e) {
      console.error("❌ Save to local error", e);
    }
  };

  // Debug function - untuk test manual
  const testLocalStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const count = stored ? JSON.parse(stored).length : 0;
      const status = isOnline ? "🟢 Online" : "🔴 Offline";
      const lastMessage = stored ? JSON.parse(stored).slice(-1)[0] : null;
      
      Alert.alert(
        "📊 Local Storage Info",
        `Status Koneksi: ${status}\n\n` +
        `Total Pesan Tersimpan: ${count} pesan\n\n` +
        `Pesan Terakhir:\n${lastMessage ? (lastMessage.text || "[Gambar]") : "Belum ada pesan"}`,
        [{ text: "OK" }]
      );
    } catch (e) {
      Alert.alert("Error", "Gagal membaca local storage");
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await addDoc(messagesCollection, {
        text: message,
        user: user.email,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setMessage("");
    } catch (e) {
      console.error("sendMessage error", e);
      Alert.alert("Error", "Gagal mengirim pesan. Pastikan Anda online.");
    }
  };

  const pickImageAndSend = async () => {
    // permission untuk Android (web tidak butuh)
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Butuh izin akses galeri");
        return;
      }
    }
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.4, // compress, agar ukuran base64 lebih kecil
      });

      if (res.canceled) return;
      const asset = res.assets && res.assets[0];
      if (!asset || !asset.base64) {
        Alert.alert("Gagal mengambil base64");
        return;
      }

      const dataUri = `data:${asset.type || "image/jpeg"};base64,${asset.base64}`;

      await addDoc(messagesCollection, {
        text: "",
        image: dataUri, 
        user: user.email,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("pick image error", e);
      Alert.alert("Error", e.message || String(e));
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Apakah Anda yakin ingin keluar?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (e) {
              console.error("Logout error", e);
              Alert.alert("Error", "Gagal logout");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isMyMessage = item.userId === user.uid;
    return (
      <View
        style={[
          styles.msgBox,
          isMyMessage ? styles.myMsg : styles.otherMsg,
        ]}
      >
        <Text style={styles.sender}>{item.user}</Text>
        {item.text ? <Text>{item.text}</Text> : null}
        {item.image ? (
          <Image source={{ uri: item.image }} style={{ width: 200, height: 200, marginTop: 8, borderRadius: 8 }} />
        ) : null}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {isOnline ? "🟢 Online" : "🔴 Offline (Mode Lokal)"}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity onPress={testLocalStorage} style={styles.debugBtn}>
            <Text style={styles.debugText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item, index) => item.id || `msg-${index}`}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />
      
      <View style={styles.inputRow}>
        <TouchableOpacity onPress={pickImageAndSend} style={{ justifyContent: "center", marginRight: 8 }}>
          <Text style={{ fontSize: 22 }}>📷</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Ketik pesan..."
          value={message}
          onChangeText={setMessage}
        />
        <Button title="Kirim" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  debugBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 8,
  },
  debugText: {
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 5,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
  msgBox: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 6,
    maxWidth: "80%",
  },
  myMsg: {
    backgroundColor: "#d1f0ff",
    alignSelf: "flex-end",
  },
  otherMsg: {
    backgroundColor: "#eee",
    alignSelf: "flex-start",
  },
  sender: {
    fontWeight: "bold",
    marginBottom: 2,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    marginRight: 10,
    padding: 8,
    borderRadius: 6,
    borderColor: "#ddd",
  },
});
