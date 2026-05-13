import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function ChatEkrani() {
  const params = useLocalSearchParams();
  const chatRoomId = params.chatRoomId || 'demo_chat';
  const chatTitle = params.title || 'Kaptan (FC Yenilmezler)';

  const [mesaj, setMesaj] = useState('');
  
  // Test için simüle edilmiş mesaj geçmişi (API bağlantısı yoksa bunlar gösterilir)
  const [mesajlar, setMesajlar] = useState([
    { id: '1', text: 'Selam Baran, başvurunu gördüm. Defans hattında eksiğimiz var.', sender: 'kaptan', time: '20:45' },
    { id: '2', text: 'Selamlar! Tam benim mevkim, maç saat kaçtaydı?', sender: 'ben', time: '20:46' },
    { id: '3', text: '22:00 - 23:00 arası. Kramponlarını al gel, kadrodasın! 🟢', sender: 'kaptan', time: '20:47' },
  ]);

  // Firestore'dan mesajları çek (gerçek zamanlı polling)
  useEffect(() => {
    const mesajlariGetir = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/messages/${chatRoomId}`);
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          const formattedMessages = data.messages.map((msg, index) => ({
            id: msg.id || index.toString(),
            text: msg.text,
            sender: msg.senderId === 'user_baran_123' ? 'ben' : 'kaptan',
            time: msg.createdAt ? new Date(msg.createdAt._seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
          }));
          setMesajlar(formattedMessages);
        }
      } catch (error) {
        // API bağlantısı yoksa simüle veriler kalır
        console.log("Mesajlar API'den çekilemedi, demo veriler kullanılıyor.");
      }
    };

    mesajlariGetir();
    // 3 saniyede bir yeni mesajları kontrol et (gerçek zamanlı etki)
    const interval = setInterval(mesajlariGetir, 3000);
    return () => clearInterval(interval);
  }, [chatRoomId]);

  const mesajGonder = async () => {
    if (mesaj.trim().length === 0) return;

    const yeniMesaj = {
      id: Date.now().toString(),
      text: mesaj,
      sender: 'ben',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic UI: Mesajı anında ekranda göster
    setMesajlar([...mesajlar, yeniMesaj]);
    setMesaj('');
    
    // Firestore'a kaydet
    try {
      await fetch(`${BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatRoomId: chatRoomId,
          senderId: 'user_baran_123',
          text: yeniMesaj.text
        })
      });
    } catch (error) {
      console.error("Mesaj sunucuya iletilemedi:", error);
    }
  };

  const renderMesaj = ({ item }) => {
    const benimMi = item.sender === 'ben';

    return (
      <View style={[styles.mesajBalonu, benimMi ? styles.benimMesajim : styles.karsiMesaj]}>
        <Text style={[styles.mesajMetni, benimMi ? styles.benimMetnim : styles.karsiMetin]}>
          {item.text}
        </Text>
        <Text style={styles.mesajSaati}>{item.time}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#39FF14" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{chatTitle}</Text>
          <Text style={styles.headerStatus}>Çevrimiçi</Text>
        </View>
      </View>

      {/* Mesaj Listesi */}
      <KeyboardAvoidingView 
        style={styles.chatArea} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={mesajlar}
          keyExtractor={(item) => item.id}
          renderItem={renderMesaj}
          contentContainerStyle={styles.mesajListesi}
          showsVerticalScrollIndicator={false}
        />

        {/* Mesaj Yazma Alanı */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor="#888"
            value={mesaj}
            onChangeText={setMesaj}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={mesajGonder}>
            <Ionicons name="send" size={20} color="#000" style={styles.sendIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginTop: Platform.OS === 'android' ? 25 : 0,
  },
  backButton: {
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerStatus: {
    color: '#39FF14',
    fontSize: 12,
  },
  chatArea: {
    flex: 1,
  },
  mesajListesi: {
    padding: 15,
  },
  mesajBalonu: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  benimMesajim: {
    alignSelf: 'flex-end',
    backgroundColor: '#39FF14', // Neon Yeşil 
    borderBottomRightRadius: 5,
  },
  karsiMesaj: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1A', // Koyu Gri
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  mesajMetni: {
    fontSize: 16,
  },
  benimMetnim: {
    color: '#000', // Neon üstüne siyah yazı
    fontWeight: '500',
  },
  karsiMetin: {
    color: '#FFF',
  },
  mesajSaati: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#222',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    backgroundColor: '#39FF14',
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 2,
  },
  sendIcon: {
    marginLeft: 4, // İkonu ortalamak için ufak bir itme
  }
});
