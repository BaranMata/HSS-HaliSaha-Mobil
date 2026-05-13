import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

// Kendi sunucumuz
const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function CreateMatchEkrani() {
  const [mevki, setMevki] = useState('');
  const [tarih, setTarih] = useState('');
  const [saat, setSaat] = useState('');
  const [aciklama, setAciklama] = useState('');
  
  // Varsayılan harita konumu (Ankara Merkez)
  const [seciliKonum, setSeciliKonum] = useState({
    latitude: 39.9207,
    longitude: 32.8541,
  });

  const haritayaTiklandi = (e) => {
    setSeciliKonum(e.nativeEvent.coordinate);
  };

  const ilanVer = async () => {
    if (!mevki || !tarih || !saat) {
      Alert.alert("Eksik Bilgi", "Sahaya çıkmadan önce mevki, tarih ve saat bilgilerini girmelisin.");
      return;
    }

    // Backend Software Flow'a gönderilecek ilan verisi
    const yeniIlan = {
      Required_Position: mevki,
      Status: 'Aktif',
      Latitude: seciliKonum.latitude.toString(),
      Longitude: seciliKonum.longitude.toString(),
      Date: tarih,
      Time: saat,
      Notes: aciklama
    };

    console.log("Sunucuya Gönderilen İlan:", yeniIlan);
    
    /* Gerçek bağlantı kodu:
    await fetch(`${BASE_URL}/api/matches/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(yeniIlan)
    });
    */

    Alert.alert("Başarılı", "İlanın radara eklendi! Oyuncuların başvuruları DM kutuna düşecek.");
    router.back(); // Haritaya geri dön
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        {/* Üst Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#39FF14" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>RADARA İLAN EKLE</Text>
        </View>

        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          
          {/* Harita Seçimi */}
          <Text style={styles.label}>Saha Konumu Seç (Haritaya Dokun)</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 39.9207,
                longitude: 32.8541,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={haritayaTiklandi}
              userInterfaceStyle="dark"
            >
              <UrlTile
                urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
              />
              <Marker
                coordinate={seciliKonum}
                pinColor="#39FF14"
                title="Saha Burası"
              />
            </MapView>
          </View>

          {/* Form Alanları */}
          <Text style={styles.label}>Eksik Mevki</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Kaleci, Sağ Bek, Oyun Kurucu..."
            placeholderTextColor="#666"
            value={mevki}
            onChangeText={setMevki}
          />

          <View style={styles.row}>
            <View style={[styles.inputGroup, { marginRight: 10 }]}>
              <Text style={styles.label}>Tarih</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 15 Mayıs"
                placeholderTextColor="#666"
                value={tarih}
                onChangeText={setTarih}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Saat</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 21:00-22:00"
                placeholderTextColor="#666"
                value={saat}
                onChangeText={setSaat}
              />
            </View>
          </View>

          <Text style={styles.label}>Kaptan Notu (İsteğe Bağlı)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Örn: Halı saha ücreti 100 TL, maçtan 15 dk önce toplanıyoruz."
            placeholderTextColor="#666"
            multiline
            value={aciklama}
            onChangeText={setAciklama}
          />

          {/* Gönder Butonu */}
          <TouchableOpacity style={styles.submitButton} onPress={ilanVer}>
            <Ionicons name="radar-outline" size={24} color="#000" style={{ marginRight: 10 }} />
            <Text style={styles.submitButtonText}>İLAN VER</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} /> {/* Alttan boşluk */}
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
  label: {
    color: '#39FF14',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 15,
    letterSpacing: 1,
  },
  mapContainer: {
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: '100%',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
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
