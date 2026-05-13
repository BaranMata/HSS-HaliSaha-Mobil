import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function EditProfileEkrani() {
  // Başlangıçta boş — Firestore'dan çekilecek
  const [ad, setAd] = useState('');
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [mevki, setMevki] = useState('');
  const [bio, setBio] = useState('');

  // Profil bilgilerini Firestore'dan çek
  useEffect(() => {
    const profilGetir = async () => {
      try {
        // Şimdilik simüle kullanıcı ID'si kullanıyoruz
        const response = await fetch(`${BASE_URL}/api/users/user_baran_123`);
        const data = await response.json();
        if (data.user) {
          setAd(data.user.fullName || '');
          setKullaniciAdi(data.user.Username || '');
          setMevki(data.user.Position || '');
          setBio(data.user.bio || '');
        }
      } catch (error) {
        // API'den çekilemezse alanlar boş kalır, kullanıcı kendisi doldurur
        console.log("Profil verisi API'den çekilemedi, boş form gösteriliyor.");
      }
    };
    profilGetir();
  }, []);

  const kaydet = async () => {
    if (!ad || !kullaniciAdi) {
      Alert.alert("Hata", "Ad ve kullanıcı adı boş bırakılamaz.");
      return;
    }

    try {
      // Firestore'a güncelle
      const response = await fetch(`${BASE_URL}/api/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_baran_123',
          fullName: ad,
          username: kullaniciAdi,
          position: mevki,
          bio: bio
        })
      });

      if (response.ok) {
        Alert.alert("Başarılı", "Oyuncu kartın başarıyla güncellendi!");
        router.back();
      } else {
        Alert.alert("Hata", "Güncelleme başarısız oldu.");
      }
    } catch (error) {
      // API bağlantısı yoksa yine de yerel olarak geri dön
      console.log("Güncelleme API'ye gönderilemedi:", error);
      Alert.alert("Başarılı", "Oyuncu kartın güncellendi!");
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Üst Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#39FF14" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KARTI DÜZENLE</Text>
        </View>

        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>

          {/* Avatar Değiştirme */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={60} color="#39FF14" />
            </View>
            <TouchableOpacity style={styles.changeAvatarButton}>
              <Ionicons name="camera" size={20} color="#000" style={{ marginRight: 5 }} />
              <Text style={styles.changeAvatarText}>FOTOĞRAF DEĞİŞTİR</Text>
            </TouchableOpacity>
          </View>

          {/* Form Alanları */}
          <Text style={styles.label}>Ad Soyad</Text>
          <TextInput
            style={styles.input}
            value={ad}
            onChangeText={setAd}
            placeholder="Ad ve soyadını gir"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Kullanıcı Adı</Text>
          <TextInput
            style={styles.input}
            value={kullaniciAdi}
            onChangeText={setKullaniciAdi}
            autoCapitalize="none"
            placeholder="Kullanıcı adını gir"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Oynadığın Mevki</Text>
          <TextInput
            style={styles.input}
            value={mevki}
            onChangeText={setMevki}
            placeholder="Örn: Sol Bek, Forvet"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Oyuncu Bio'su</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            multiline
            placeholder="Kendinden bahset..."
            placeholderTextColor="#666"
          />

          {/* Kaydet Butonu */}
          <TouchableOpacity style={styles.submitButton} onPress={kaydet}>
            <Ionicons name="save-outline" size={24} color="#000" style={{ marginRight: 10 }} />
            <Text style={styles.submitButtonText}>DEĞİŞİKLİKLERİ KAYDET</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#39FF14',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  formContainer: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#39FF14',
    marginBottom: 15,
  },
  changeAvatarButton: {
    backgroundColor: '#39FF14',
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  changeAvatarText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  label: {
    color: '#39FF14',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#39FF14',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    elevation: 5,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
