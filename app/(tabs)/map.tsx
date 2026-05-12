import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function RadarEkrani() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [ilanlar, setIlanlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // İlan Oluşturma State'leri
  const [modalGorunur, setModalGorunur] = useState(false);
  const [secilenSahaKonumu, setSecilenSahaKonumu] = useState(null); // Halı sahanın koordinatları
  const [arananMevki, setArananMevki] = useState('');
  const [macSaati, setMacSaati] = useState(''); // Maç saati state'i
  const [ilanYukleniyor, setIlanYukleniyor] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Hata', 'Konum izni reddedildi.');
        setYukleniyor(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setCurrentLocation(region);
      setSecilenSahaKonumu(region); // Varsayılan olarak pini merkeze koy
      ilanlariGetir();
    })();
  }, []);

  const ilanlariGetir = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/matches/nearby`);
      const data = await response.json();
      if (data.matches) setIlanlar(data.matches);
      setYukleniyor(false);
    } catch (error) {
      setYukleniyor(false);
    }
  };

  // Haritaya dokunulduğunda sahanın yerini belirle
  const sahaKonumuSec = (e) => {
    setSecilenSahaKonumu(e.nativeEvent.coordinate);
  };

  const ilanOlustur = async () => {
    if (!arananMevki || !macSaati) {
      Alert.alert('Eksik Bilgi', 'Lütfen mevki ve saat bilgilerini girin.');
      return;
    }

    setIlanYukleniyor(true);
    try {
      const response = await fetch(`${BASE_URL}/api/matches/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerId: 'user_baran_123',
          latitude: secilenSahaKonumu.latitude, // Seçilen sahanın lat değeri
          longitude: secilenSahaKonumu.longitude, // Seçilen sahanın lng değeri
          requiredPosition: arananMevki,
          matchTime: macSaati // Yeni alan: Saat
        })
      });

      if (response.ok) {
        Alert.alert('Başarılı!', 'Maç ilanı belirlenen sahaya eklendi.');
        setModalGorunur(false);
        setArananMevki('');
        setMacSaati('');
        ilanlariGetir();
      }
    } catch (error) {
      Alert.alert('Hata', 'İlan gönderilemedi.');
    } finally {
      setIlanYukleniyor(false);
    }
  };

  if (yukleniyor || !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39FF14" />
        <Text style={styles.loadingText}>Radar Taranıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        provider={PROVIDER_GOOGLE}
        initialRegion={currentLocation}
        showsUserLocation={true}
        onPress={sahaKonumuSec} // Haritaya tıklandığında konumu günceller
      >
        {/* Canlı İlanlar */}
        {ilanlar.map((ilan, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: ilan.Latitude, longitude: ilan.Longitude }}
            pinColor="#39FF14"
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{ilan.Required_Position} Aranıyor</Text>
                <Text style={styles.calloutTime}>⏰ Saat: {ilan.matchTime || 'Belirtilmedi'}</Text>
                <TouchableOpacity style={styles.applyButton}>
                  <Text style={styles.applyButtonText}>Katıl</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* YENİ: İlan Oluştururken Seçilen Sahanın Geçici Pini */}
        {modalGorunur && (
          <Marker 
            coordinate={secilenSahaKonumu} 
            draggable 
            pinColor="blue" 
            title="Maçın Yapılacağı Saha"
            description="Bu pini sahanın üzerine sürükle"
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalGorunur(true)}>
        <Ionicons name="location" size={30} color="#000" />
      </TouchableOpacity>

      {/* GELİŞTİRİLMİŞ İLAN PANELİ */}
      <Modal visible={modalGorunur} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Maç Detayları</Text>
              <TouchableOpacity onPress={() => setModalGorunur(false)}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>Mavi pini haritada sahanın üzerine taşıyın.</Text>

            <Text style={styles.label}>Aranan Mevki</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Kaleci"
              placeholderTextColor="#666"
              value={arananMevki}
              onChangeText={setArananMevki}
            />

            <Text style={styles.label}>Maç Saati</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Bugün 21:00 - 22:00"
              placeholderTextColor="#666"
              value={macSaati}
              onChangeText={setMacSaati}
            />

            <TouchableOpacity style={styles.publishButton} onPress={ilanOlustur}>
              {ilanYukleniyor ? <ActivityIndicator color="#000" /> : <Text style={styles.publishButtonText}>İLANINI RADARA SAL</Text>}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#39FF14', marginTop: 10, fontWeight: 'bold' },
  calloutContainer: { width: 160, padding: 5 },
  calloutTitle: { fontWeight: 'bold', fontSize: 14 },
  calloutTime: { fontSize: 12, color: '#666', marginVertical: 5 },
  applyButton: { backgroundColor: '#39FF14', padding: 5, borderRadius: 5, alignItems: 'center' },
  applyButtonText: { fontSize: 12, fontWeight: 'bold' },
  addButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#39FF14', width: 65, height: 65, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1A1A1A', borderRadius: 25, padding: 25, borderWith: 1, borderColor: '#333' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#39FF14', fontSize: 22, fontWeight: 'bold' },
  helperText: { color: '#888', fontSize: 12, marginBottom: 20 },
  label: { color: '#FFF', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#222', color: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 20 },
  publishButton: { backgroundColor: '#39FF14', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  publishButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});