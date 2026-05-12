import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function UploadVideoEkrani() {
  const [facing, setFacing] = useState('back'); 
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  const [recording, setRecording] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null); // Çekilen videonun yolu
  const [description, setDescription] = useState(""); // Kullanıcının yazacağı açıklama
  
  const cameraRef = useRef(null);

  if (!cameraPermission || !micPermission) return <View />;
  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Kamera ve mikrofon erişimi gerekiyor.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => { requestCameraPermission(); requestMicPermission(); }}>
          <Text style={styles.permissionButtonText}>İZİNLERİ VER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- SUNUCUYA GÖNDERME MOTORU ---
  const sunucuyaYukle = async () => {
    if (!videoUri) return;
    
    setYukleniyor(true);
    console.log("Sunucuya yükleme başlatıldı...", videoUri);

    let formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      name: `yetenek_${Date.now()}.mp4`,
      type: 'video/mp4'
    } as any);

    // BURASI DEĞİŞTİ: Artık state'den gelen açıklamayı gönderiyoruz
    formData.append('username', '@baranasar');
    formData.append('description', description || 'Sahalara dönüş! ⚽');

    try {
      const response = await fetch(`${BASE_URL}/api/media/upload`, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        Alert.alert("Başarılı!", "Videon paylaşıldı.");
        router.replace('/(tabs)/home'); // Akışı yenilemek için replace kullanıyoruz
      } else {
        Alert.alert("Hata", "Video yüklenemedi.");
        setYukleniyor(false);
      }
    } catch (error) {
      console.error("Yükleme hatası:", error);
      Alert.alert("Bağlantı Hatası", "Backend'e ulaşılamıyor.");
      setYukleniyor(false);
    }
  };

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri); // Hemen yükleme, önce önizleme ekranına geç
    }
  };

  const toggleRecord = async () => {
    if (cameraRef.current) {
      if (recording) {
        setRecording(false);
        cameraRef.current.stopRecording();
      } else {
        setRecording(true);
        const data = await cameraRef.current.recordAsync({ maxDuration: 10 });
        setVideoUri(data.uri); // Kayıt bitince önizleme ekranına geç
      }
    }
  };

  // --- EKRAN DURUMLARI (STATES) ---

  // 1. Yükleme Ekranı
  if (yukleniyor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39FF14" />
        <Text style={styles.loadingText}>Yeteneklerin İşleniyor...</Text>
      </View>
    );
  }

  // 2. Paylaşım/Açıklama Ekranı (Video çekildikten sonra burası gözükür)
  if (videoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
          <ScrollView contentContainerStyle={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <TouchableOpacity onPress={() => setVideoUri(null)}>
                <Ionicons name="arrow-back" size={30} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Yeni Paylaşım</Text>
              <View style={{width: 30}} />
            </View>

            <View style={styles.videoThumbnailPlaceholder}>
               <Ionicons name="videocam" size={50} color="#39FF14" />
               <Text style={{color: '#FFF', marginTop: 10}}>Video Hazır!</Text>
            </View>

            <TextInput
              style={styles.descriptionInput}
              placeholder="Videon hakkında bir şeyler yaz..."
              placeholderTextColor="#888"
              multiline
              maxLength={150}
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.publishButton} onPress={sunucuyaYukle}>
              <Text style={styles.publishButtonText}>PAYLAŞ</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // 3. Kamera Ekranı
  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} facing={facing} mode="video" ref={cameraRef}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={35} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}>
            <Ionicons name="camera-reverse" size={35} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.iconButton} onPress={pickVideo}>
            <Ionicons name="images" size={30} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.recordButton, recording && styles.recordingActive]} onPress={toggleRecord}>
            <View style={[styles.recordInner, recording && styles.recordingInnerActive]} />
          </TouchableOpacity>

          <View style={styles.iconButton} />
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'space-between' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#39FF14', fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  previewContainer: { padding: 20, alignItems: 'center' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  videoThumbnailPlaceholder: { width: '100%', height: 200, backgroundColor: '#1A1A1A', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  descriptionInput: { width: '100%', backgroundColor: '#1A1A1A', color: '#FFF', padding: 15, borderRadius: 15, fontSize: 16, height: 120, textAlignVertical: 'top', marginBottom: 30 },
  publishButton: { backgroundColor: '#39FF14', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  publishButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 40 },
  iconButton: { width: 50, alignItems: 'center' },
  recordButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  recordingActive: { borderColor: '#39FF14' },
  recordInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF' },
  recordingInnerActive: { backgroundColor: '#39FF14', borderRadius: 10, width: 40, height: 40 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  permissionText: { color: '#FFF', marginBottom: 20 },
  permissionButton: { backgroundColor: '#39FF14', padding: 15, borderRadius: 10 },
  permissionButtonText: { fontWeight: 'bold' }
});