import { StyleSheet, Text, View } from 'react-native';

export default function HomeEkrani() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MEDYA AKIŞI (REELS)</Text>
      <Text style={styles.subtitle}>Çok yakında videolar buraya akacak...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#39FF14', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  subtitle: { color: '#888', marginTop: 10 }
});