import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUser } from '../userSession';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function ProfileEkrani() {
  const [userProfile, setUserProfile] = useState({
    name: '', username: '', position: '',
    rating: 0, matchesPlayed: 0, goals: 0, assists: 0,
  });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [videolarim, setVideolarim] = useState([]);
  const [videoYukleniyor, setVideoYukleniyor] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useFocusEffect(
    useCallback(() => {
      const hepsiniGetir = async () => {
        setYukleniyor(true);
        setVideoYukleniyor(true);

        // Oturumdan kullanıcı bilgisini al
        const user = await getUser();
        if (!user) {
          setYukleniyor(false);
          setVideoYukleniyor(false);
          return;
        }
        setCurrentUserId(user.uid);

        // Profili API'den çek
        try {
          const response = await fetch(`${BASE_URL}/api/users/${user.uid}`);
          const data = await response.json();
          if (data.user) {
            setUserProfile({
              name: data.user.fullName || data.user.Username || 'İsim Belirtilmedi',
              username: data.user.Username ? `@${data.user.Username}` : '@kullanici',
              position: data.user.Position || 'Mevki Belirtilmedi',
              rating: data.user.Skill_Rating || 0,
              matchesPlayed: data.user.matchesPlayed || 0,
              goals: data.user.goals || 0,
              assists: data.user.assists || 0,
            });
          } else {
            // API'de kullanıcı yoksa oturumdan oku
            setUserProfile({
              name: user.fullName || 'İsim Belirtilmedi',
              username: `@${user.username}`,
              position: user.position || 'Mevki Belirtilmedi',
              rating: 0, matchesPlayed: 0, goals: 0, assists: 0,
            });
          }
        } catch {
          setUserProfile({
            name: user.fullName || 'İsim Belirtilmedi',
            username: `@${user.username}`,
            position: user.position || 'Mevki Belirtilmedi',
            rating: 0, matchesPlayed: 0, goals: 0, assists: 0,
          });
        } finally {
          setYukleniyor(false);
        }

        // Kullanıcının kendi videolarını çek
        try {
          const vRes = await fetch(`${BASE_URL}/api/media/user/${user.username}`);
          const vData = await vRes.json();
          if (vData.videos) setVideolarim(vData.videos);
        } catch {
          console.log("Videolar çekilemedi.");
        } finally {
          setVideoYukleniyor(false);
        }
      };
      hepsiniGetir();
    }, [])
  );

  const videoSil = (video) => {
    Alert.alert(
      "Videoyu Sil",
      `"${video.description || 'Bu video'}" silinsin mi?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/api/media/${video.id}`, { method: 'DELETE' });
              if (response.ok) {
                setVideolarim(prev => prev.filter(v => v.id !== video.id));
                Alert.alert("Silindi", "Video başarıyla silindi.");
              }
            } catch {
              Alert.alert("Hata", "Video silinemedi.");
            }
          }
        }
      ]
    );
  };

  if (yukleniyor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39FF14" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
          <Ionicons name="settings-outline" size={20} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.editButtonText}>KARTINI GÜNCELLE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editButton, { marginTop: 12, backgroundColor: '#121212', borderWidth: 1, borderColor: '#39FF14' }]}
          onPress={() => router.push('/team')}
        >
          <Ionicons name="shield" size={20} color="#39FF14" style={{ marginRight: 8 }} />
          <Text style={[styles.editButtonText, { color: '#39FF14' }]}>TAKIMIM</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.galleryContainer}>
        <Text style={styles.sectionTitle}>VİDEOLARIM ({videolarim.length})</Text>
        {videoYukleniyor ? (
          <ActivityIndicator color="#39FF14" style={{ marginTop: 20 }} />
        ) : videolarim.length === 0 ? (
          <View style={styles.emptyVideoContainer}>
            <Ionicons name="videocam-off" size={50} color="#555" />
            <Text style={styles.emptyVideoText}>Henüz video yüklemedin</Text>
            <TouchableOpacity style={styles.uploadFirstButton} onPress={() => router.push('/upload-video')}>
              <Ionicons name="add" size={20} color="#000" style={{ marginRight: 5 }} />
              <Text style={styles.uploadFirstText}>İLK VİDEONU YÜKLE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {videolarim.map((video) => (
              <TouchableOpacity key={video.id} style={styles.gridItem} onLongPress={() => videoSil(video)}>
                <Ionicons name="play" size={40} color="rgba(255,255,255,0.7)" />
                <Text style={styles.videoDesc} numberOfLines={1}>{video.description || ''}</Text>
                <View style={styles.videoStats}>
                  <View style={styles.videoStatItem}>
                    <Ionicons name="heart" size={12} color="#39FF14" />
                    <Text style={styles.videoStatText}>{video.likes || 0}</Text>
                  </View>
                  <View style={styles.videoStatItem}>
                    <Ionicons name="chatbubble" size={12} color="#888" />
                    <Text style={styles.videoStatText}>{video.comments || 0}</Text>
                  </View>
                </View>
                <View style={styles.deleteHint}>
                  <Ionicons name="trash" size={14} color="#FF4444" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  avatarContainer: { marginBottom: 10, shadowColor: '#39FF14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  name: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1 },
  username: { fontSize: 16, color: '#888888', marginBottom: 15 },
  badge: { backgroundColor: '#121212', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#39FF14' },
  badgeText: { color: '#39FF14', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  statsContainer: { flexDirection: 'row', backgroundColor: '#121212', marginHorizontal: 20, borderRadius: 15, paddingVertical: 20, marginBottom: 25, borderWidth: 1, borderColor: '#222' },
  statBox: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderLeftColor: '#333' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#888888', textTransform: 'uppercase', letterSpacing: 1 },
  actionContainer: { paddingHorizontal: 20, marginBottom: 30 },
  editButton: { backgroundColor: '#39FF14', flexDirection: 'row', padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  editButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  galleryContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: (width - 50) / 3, height: 180, backgroundColor: '#1A1A1A', borderRadius: 10, marginBottom: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  videoDesc: { color: '#CCC', fontSize: 10, position: 'absolute', bottom: 28, left: 8, right: 8 },
  videoStats: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row' },
  videoStatItem: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  videoStatText: { color: '#FFF', fontSize: 10, marginLeft: 3 },
  deleteHint: { position: 'absolute', top: 8, right: 8, opacity: 0.5 },
  emptyVideoContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyVideoText: { color: '#888', fontSize: 14, marginTop: 10, marginBottom: 20 },
  uploadFirstButton: { flexDirection: 'row', backgroundColor: '#39FF14', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  uploadFirstText: { color: '#000', fontWeight: 'bold', fontSize: 14 }
});
