import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { getUser } from '../userSession';

const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function RadarEkrani() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [ilanlar, setIlanlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const mapRef = useRef(null);

  // İlan Oluşturma State'leri
  const [modalGorunur, setModalGorunur] = useState(false);
  const [secilenSahaKonumu, setSecilenSahaKonumu] = useState(null);
  const [arananMevkiler, setArananMevkiler] = useState('');
  const [macSaati, setMacSaati] = useState('');
  const [ilanYukleniyor, setIlanYukleniyor] = useState(false);

  // Haritadan Konum Seçme Modu
  const [konumSecimModu, setKonumSecimModu] = useState(false);

  // İlan Detay Modal State'leri
  const [detayModal, setDetayModal] = useState(false);
  const [secilenIlan, setSecilenIlan] = useState(null);

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (user) setCurrentUserId(user.uid);

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
      ilanlariGetir();
    })();
  }, []);

  const ilanlariGetir = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/matches/nearby`);
      const data = await response.json();
      if (data.matches) setIlanlar(data.matches);
      setYukleniyor(false);
    } catch {
      setYukleniyor(false);
    }
  };

  // Haritaya dokunulduğunda konum seç (konum seçim modundayken)
  const haritayaTikla = (e) => {
    if (konumSecimModu) {
      setSecilenSahaKonumu(e.nativeEvent.coordinate);
    }
  };

  // Konum seçimini onayla → İlan formunu aç
  const konumuOnayla = () => {
    if (!secilenSahaKonumu) {
      Alert.alert('Uyarı', 'Lütfen haritada bir konum seçin.');
      return;
    }
    setKonumSecimModu(false);
    setModalGorunur(true);
  };

  // Konum seçimini iptal et
  const konumuIptalEt = () => {
    setKonumSecimModu(false);
    setSecilenSahaKonumu(null);
  };

  const ilanDetayGoster = (ilan) => {
    setSecilenIlan(ilan);
    setDetayModal(true);
  };

  const mesajAt = (ilan) => {
    setDetayModal(false);
    const chatRoomId = [currentUserId, ilan.OrganizerID].sort().join('_');
    router.push({
      pathname: '/chat',
      params: { chatRoomId, title: 'İlan Sahibi' }
    });
  };

  const macaBasvur = async (ilan) => {
    try {
      const response = await fetch(`${BASE_URL}/api/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: ilan.MatchID, applicantId: currentUserId })
      });
      if (response.ok) {
        Alert.alert('Başarılı!', 'Başvurun iletildi!');
        setDetayModal(false);
      }
    } catch {
      Alert.alert('Hata', 'Başvuru gönderilemedi.');
    }
  };

  // İlan Sil / Kaldır
  const ilaniKaldir = async (ilan) => {
    Alert.alert('İlanı Kaldır', 'Bu ilanı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${BASE_URL}/api/matches/${ilan.MatchID}`, { method: 'DELETE' });
            if (response.ok) {
              setIlanlar(prev => prev.filter(i => i.MatchID !== ilan.MatchID));
              setDetayModal(false);
              Alert.alert('Silindi', 'İlan kaldırıldı.');
            }
          } catch {
            Alert.alert('Hata', 'İlan silinemedi.');
          }
        }
      }
    ]);
  };

  const ilanOlustur = async () => {
    if (!arananMevkiler || !macSaati) {
      Alert.alert('Eksik Bilgi', 'Lütfen mevki ve saat bilgilerini girin.');
      return;
    }

    const konum = secilenSahaKonumu || currentLocation;

    setIlanYukleniyor(true);
    try {
      const response = await fetch(`${BASE_URL}/api/matches/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerId: currentUserId,
          latitude: konum.latitude,
          longitude: konum.longitude,
          requiredPosition: arananMevkiler,
          matchTime: macSaati
        })
      });

      if (response.ok) {
        Alert.alert('Başarılı!', 'Maç ilanı yayımlandı.');
        setModalGorunur(false);
        setArananMevkiler('');
        setMacSaati('');
        setSecilenSahaKonumu(null);
        ilanlariGetir();
      }
    } catch {
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
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={currentLocation}
        showsUserLocation={true}
        onPress={haritayaTikla}
      >
        {/* Canlı İlanlar — kendi ilanları mavi, diğerleri yeşil */}
        {ilanlar.map((ilan, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: parseFloat(ilan.Latitude), longitude: parseFloat(ilan.Longitude) }}
            pinColor={ilan.OrganizerID === currentUserId ? '#4A90D9' : '#39FF14'}
            onPress={() => ilanDetayGoster(ilan)}
          >
            <Callout tooltip onPress={() => ilanDetayGoster(ilan)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{ilan.Required_Position} Aranıyor</Text>
                <Text style={styles.calloutTime}>⏰ {ilan.matchTime || 'Belirtilmedi'}</Text>
                {ilan.OrganizerID === currentUserId && (
                  <Text style={styles.calloutOwner}>📌 Senin ilanın</Text>
                )}
                <Text style={styles.calloutHint}>Detaylar için dokun →</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Haritadan Konum Seçim Pini */}
        {konumSecimModu && secilenSahaKonumu && (
          <Marker
            coordinate={secilenSahaKonumu}
            draggable
            pinColor="blue"
            title="Seçilen Konum"
            onDragEnd={(e) => setSecilenSahaKonumu(e.nativeEvent.coordinate)}
          />
        )}
      </MapView>

      {/* KONUM SEÇİM MODU — Üstte bilgi çubuğu */}
      {konumSecimModu && (
        <View style={styles.konumSecimOverlay}>
          <View style={styles.konumSecimBanner}>
            <Ionicons name="location" size={24} color="#39FF14" />
            <Text style={styles.konumSecimText}>Haritada maç yapılacak konuma dokunun</Text>
          </View>
          <View style={styles.konumSecimButtons}>
            <TouchableOpacity style={styles.konumIptalButton} onPress={konumuIptalEt}>
              <Text style={styles.konumIptalText}>İPTAL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.konumOnayButton} onPress={konumuOnayla}>
              <Text style={styles.konumOnayText}>KONUMU ONAYLA</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* İLAN EKLE BUTONU (Konum seçim modunda gizle) */}
      {!konumSecimModu && (
        <TouchableOpacity style={styles.addButton} onPress={() => {
          setSecilenSahaKonumu(null);
          setModalGorunur(true);
        }}>
          <Ionicons name="add" size={30} color="#000" />
        </TouchableOpacity>
      )}

      {/* === İLAN DETAY MODALI === */}
      <Modal visible={detayModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.detayContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Maç Detayları</Text>
              <TouchableOpacity onPress={() => setDetayModal(false)}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>

            {secilenIlan && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detayRow}>
                  <Ionicons name="football" size={24} color="#39FF14" />
                  <View style={styles.detayTextContainer}>
                    <Text style={styles.detayLabel}>Aranan Mevki(ler)</Text>
                    <Text style={styles.detayValue}>{secilenIlan.Required_Position}</Text>
                  </View>
                </View>

                <View style={styles.detayRow}>
                  <Ionicons name="time" size={24} color="#39FF14" />
                  <View style={styles.detayTextContainer}>
                    <Text style={styles.detayLabel}>Maç Saati</Text>
                    <Text style={styles.detayValue}>{secilenIlan.matchTime || 'Belirtilmedi'}</Text>
                  </View>
                </View>

                <View style={styles.detayRow}>
                  <Ionicons name="radio-button-on" size={24} color={secilenIlan.Status === 'Aktif' ? '#39FF14' : '#FF4444'} />
                  <View style={styles.detayTextContainer}>
                    <Text style={styles.detayLabel}>Durum</Text>
                    <Text style={styles.detayValue}>{secilenIlan.Status}</Text>
                  </View>
                </View>

                {/* Kendi ilanı mı? */}
                {secilenIlan.OrganizerID === currentUserId ? (
                  <TouchableOpacity
                    style={[styles.publishButton, { backgroundColor: '#FF4444' }]}
                    onPress={() => ilaniKaldir(secilenIlan)}
                  >
                    <Ionicons name="trash" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={[styles.publishButtonText, { color: '#FFF' }]}>İLANI KALDIR</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={styles.publishButton} onPress={() => macaBasvur(secilenIlan)}>
                      <Ionicons name="hand-left" size={20} color="#000" style={{ marginRight: 8 }} />
                      <Text style={styles.publishButtonText}>BAŞVUR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.publishButton, { backgroundColor: '#121212', borderWidth: 1, borderColor: '#39FF14', marginTop: 10 }]}
                      onPress={() => mesajAt(secilenIlan)}
                    >
                      <Ionicons name="chatbubble" size={20} color="#39FF14" style={{ marginRight: 8 }} />
                      <Text style={[styles.publishButtonText, { color: '#39FF14' }]}>MESAJ AT</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* === İLAN OLUŞTURMA MODALI === */}
      <Modal visible={modalGorunur} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni İlan</Text>
              <TouchableOpacity onPress={() => setModalGorunur(false)}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Konum Bilgisi */}
            <TouchableOpacity
              style={styles.konumSecButton}
              onPress={() => {
                setModalGorunur(false);
                setKonumSecimModu(true);
              }}
            >
              <Ionicons name="map" size={20} color="#39FF14" />
              <Text style={styles.konumSecButtonText}>
                {secilenSahaKonumu ? '📍 Konum seçildi (Değiştirmek için dokun)' : '📍 Haritadan Konum Seç'}
              </Text>
            </TouchableOpacity>

            {!secilenSahaKonumu && (
              <Text style={styles.helperText}>Konum seçmezsen mevcut konumun kullanılır.</Text>
            )}

            <Text style={styles.label}>Aranan Mevki(ler)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Kaleci, Forvet, Sol Bek"
              placeholderTextColor="#666"
              value={arananMevkiler}
              onChangeText={setArananMevkiler}
            />
            <Text style={styles.helperText}>Birden fazla mevki için virgülle ayırın.</Text>

            <Text style={styles.label}>Maç Saati</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Bugün 21:00 - 22:00"
              placeholderTextColor="#666"
              value={macSaati}
              onChangeText={setMacSaati}
            />

            <TouchableOpacity style={styles.publishButton} onPress={ilanOlustur}>
              {ilanYukleniyor ? <ActivityIndicator color="#000" /> : <Text style={styles.publishButtonText}>İLANI YAYIMLA</Text>}
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
  calloutContainer: { width: 200, padding: 10, backgroundColor: '#FFF', borderRadius: 10 },
  calloutTitle: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  calloutTime: { fontSize: 12, color: '#666', marginVertical: 4 },
  calloutOwner: { fontSize: 11, color: '#4A90D9', fontWeight: 'bold' },
  calloutHint: { fontSize: 11, color: '#39FF14', fontWeight: '600' },
  addButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#39FF14', width: 65, height: 65, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1A1A1A', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: '#333' },
  detayContent: { backgroundColor: '#1A1A1A', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: '#39FF14', maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#39FF14', fontSize: 22, fontWeight: 'bold' },
  helperText: { color: '#888', fontSize: 12, marginBottom: 15, fontStyle: 'italic' },
  label: { color: '#FFF', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#222', color: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 5 },
  publishButton: { backgroundColor: '#39FF14', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  publishButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  detayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', padding: 15, borderRadius: 12, marginBottom: 10 },
  detayTextContainer: { marginLeft: 15 },
  detayLabel: { color: '#888', fontSize: 12 },
  detayValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  // Konum Seçim Modu
  konumSecimOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 50, paddingHorizontal: 20 },
  konumSecimBanner: { backgroundColor: 'rgba(0,0,0,0.85)', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10 },
  konumSecimText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
  konumSecimButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  konumIptalButton: { flex: 1, backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center', marginRight: 5 },
  konumIptalText: { color: '#FFF', fontWeight: 'bold' },
  konumOnayButton: { flex: 2, backgroundColor: '#39FF14', padding: 15, borderRadius: 10, alignItems: 'center', marginLeft: 5 },
  konumOnayText: { color: '#000', fontWeight: 'bold' },
  konumSecButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#39FF14' },
  konumSecButtonText: { color: '#FFF', fontSize: 14, marginLeft: 10 },
});
