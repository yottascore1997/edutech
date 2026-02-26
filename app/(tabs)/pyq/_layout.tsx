import { Stack } from 'expo-router';

export default function PyqLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[examId]" />
      <Stack.Screen name="[examId]/attempt" />
      <Stack.Screen name="[examId]/result/[attemptId]" />
    </Stack>
  );
}

