import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function ProfileEkrani() {
  // Geçici Test Verisi (İleride Backend Software Flow'dan gelecek)
  const userProfile = {
    name: 'Baran Asar',
    username: '@baranasar',
    position: 'Orta Saha / Oyun Kurucu',
    rating: 9.2, // 10 üzerinden yetenek puanı
    matchesPlayed: 42,
    goals: 18,
    assists: 34,
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Üst Kısım: Profil Bilgileri */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={110} color="#39FF14" />
        </View>
        <Text style={styles.name}>{userProfile.name}</Text>
        <Text style={styles.username}>{userProfile.username}</Text>
        
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{userProfile.position}</Text>
        </View>
      </View>

      {/* İstatistik Paneli */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{userProfile.matchesPlayed}</Text>
          <Text style={styles.statLabel}>Maç</Text>
        </View>
        <View style={[styles.statBox, styles.statBorder]}>
          <Text style={styles.statValue}>{userProfile.goals}</Text>
          <Text style={styles.statLabel}>Gol</Text>
        </View>
        <View style={[styles.statBox, styles.statBorder]}>
          <Text style={styles.statValue}>{userProfile.assists}</Text>
          <Text style={styles.statLabel}>Asist</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#39FF14', textShadowColor: '#39FF14', textShadowRadius: 10 }]}>
            {userProfile.rating}
          </Text>
          <Text style={styles.statLabel}>Puan</Text>
        </View>
      </View>

      {/* Aksiyon Butonu */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push('/edit-profile')} // Yönlendirmeyi ekledik
        >
          <Ionicons name="settings-outline" size={20} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.editButtonText}>KARTINI GÜNCELLE</Text>
          </TouchableOpacity>
        </View>

      {/* Yetenek Videoları Galerisi (Reels Önizlemeleri) */}
      <View style={styles.galleryContainer}>
        <Text style={styles.sectionTitle}>VİDEOLARIM</Text>
        <View style={styles.grid}>
          {/* Test için 3 adet boş video slotu */}
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.gridItem}>
               <Ionicons name="play" size={40} color="rgba(255,255,255,0.7)" />
               <Text style={styles.viewCount}>{Math.floor(Math.random() * 10)}B İzlenme</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  avatarContainer: {
    marginBottom: 10,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  username: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 15,
  },
  badge: {
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#39FF14',
  },
  badgeText: {
    color: '#39FF14',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    marginHorizontal: 20,
    borderRadius: 15,
    paddingVertical: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#222',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#333',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  editButton: {
    backgroundColor: '#39FF14',
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  galleryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 50) / 3, // 3 sütunlu grid hesaplaması
    height: 180, // Dikey video formatı
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  viewCount: {
    color: '#FFF',
    fontSize: 10,
    position: 'absolute',
    bottom: 10,
    left: 10,
    fontWeight: 'bold',
  }
});