import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function HaritaEkrani() {
  const [ilanlar, setIlanlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Backend Software Flow üzerinden aktif ilanları çekme
  useEffect(() => {
    fetch(`${BASE_URL}/api/matches/nearby`)
      .then(res => res.json())
      .then(data => {
        setIlanlar(data.matches || []);
        setYukleniyor(false);
      })
      .catch(err => {
        console.error("Harita API Hatası:", err);
        setYukleniyor(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SAHA RADARI</Text>
      </View>

      {yukleniyor ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#39FF14" />
          <Text style={styles.loadingText}>Sinyal Aranıyor...</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map}
            initialRegion={{
              latitude: 39.9207, // Ankara Merkez Koordinatları
              longitude: 32.8541,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            userInterfaceStyle="dark" // Karanlık tema desteği
          >
            {/* SDD Raporundaki OpenStreetMap Gereksinimi */}
            <UrlTile
              urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            
            {/* Sunucudan gelen ilanları haritaya basma */}
            {ilanlar.map((ilan, index) => (
              <Marker
                key={index}
                coordinate={{ 
                  latitude: parseFloat(ilan.Latitude), 
                  longitude: parseFloat(ilan.Longitude) 
                }}
                title={`Aranan Mevki: ${ilan.Required_Position}`}
                description={`Durum: ${ilan.Status} - Tıkla ve Başvur`}
                pinColor="#39FF14" // Neon Yeşil Pin
              />
            ))}
          </MapView>
        </View>
      )}

      {/* Geri Dönüş Butonu */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>KADROYA DÖN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: StatusBar.currentHeight,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#39FF14',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: 'rgba(57, 255, 20, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#39FF14',
    marginTop: 15,
    fontSize: 16,
    letterSpacing: 2,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    backgroundColor: '#121212',
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#39FF14',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  }
});