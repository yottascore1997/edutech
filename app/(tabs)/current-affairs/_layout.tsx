import { Stack } from 'expo-router';

export default function CurrentAffairsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[month]" />
      <Stack.Screen name="note" />
    </Stack>
  );
}
