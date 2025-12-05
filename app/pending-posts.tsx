import { StyleSheet, Text, View } from 'react-native';

export default function PendingPostsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Posts</Text>
      <Text style={styles.subtitle}>This feature is coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
});
