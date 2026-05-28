import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function CurrentAffairsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" />
      <Stack.Screen name="[month]" />
      <Stack.Screen name="note" />
    </Stack>
  );
}
