import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { saveUser } from './userSession';

const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function IndexEkrani() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [username, setUsername] = useState('');
  const [position, setPosition] = useState('');

  const [yukleniyor, setYukleniyor] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && (!username || !adSoyad))) {
      Alert.alert("Eksik Kadro", "Lütfen tüm alanları doldurun.");
      return;
    }

    setYukleniyor(true);

    try {
      if (isLogin) {
        // GİRİŞ MANTIĞI — e-posta ile kullanıcıyı bul
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok && data.user) {
          await saveUser({
            uid: data.user.UserID,
            username: data.user.Username,
            fullName: data.user.fullName || '',
            position: data.user.Position || ''
          });
          router.push('/(tabs)/home');
        } else {
          Alert.alert("Hata", data.error || "E-posta veya şifre hatalı.");
        }
      } else {
        // KAYİT MANTIĞI
        const simuleUid = "user_" + username.toLowerCase().replace(/[^a-z0-9]/g, '') + "_" + Date.now().toString().slice(-4);

        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: simuleUid,
            email: email,
            password: password,
            fullName: adSoyad,
            username: username,
            position: position || "Belirtilmedi"
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Kayıt başarılı, oturumu hemen kaydet
          await saveUser({
            uid: simuleUid,
            username: username,
            fullName: adSoyad,
            position: position || "Belirtilmedi"
          });
          Alert.alert("Hoş Geldin!", "Transfer başarıyla tamamlandı, " + adSoyad + "!");
          router.push('/(tabs)/home');
        } else {
          Alert.alert("Transfer Hatası", data.error);
        }
      }
    } catch (error) {
      console.error("Auth Hatası:", error);
      Alert.alert("Bağlantı Kesildi", "Sunucuya ulaşılamadı. İnterneti kontrol et.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Text style={styles.logo}>
            <Text style={styles.logoLight}>H</Text>S<Text style={styles.logoLight}>S</Text>
          </Text>
          <Text style={styles.slogan}>Match. Play. Dominate.</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {isLogin ? 'SAHAYA GİRİŞ' : 'YENİ TRANSFER'}
          </Text>

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ad Soyad"
                placeholderTextColor="#555"
                value={adSoyad}
                onChangeText={setAdSoyad}
              />
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Kullanıcı Adı (benzersiz olmalı)"
                placeholderTextColor="#555"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Mevkin (Örn: Kaleci)"
                placeholderTextColor="#555"
                value={position}
                onChangeText={setPosition}
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor="#555"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={yukleniyor}
          >
            {yukleniyor ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'MAÇA ÇIK' : 'KADROYA KATIL'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
            <Text style={styles.switchText}>
              {isLogin ? "Henüz lisansın yok mu? Kaydol!" : "Zaten kadrodaysan giriş yap."}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 70,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: -5,
    textShadowColor: 'rgba(57, 255, 20, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  logoLight: {
    color: '#FFFFFF',
  },
  slogan: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '300',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: -5,
  },
  formContainer: {
    backgroundColor: '#121212',
    marginHorizontal: 25,
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 2,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#1A1A1A',
    padding: 18,
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  button: {
    backgroundColor: '#39FF14',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    elevation: 8,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  switchButton: {
    marginTop: 25,
    alignItems: 'center',
  },
  switchText: {
    color: '#39FF14',
    fontSize: 14,
    fontWeight: '400',
  }
});
