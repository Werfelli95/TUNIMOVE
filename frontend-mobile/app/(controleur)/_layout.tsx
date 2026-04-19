import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function ControleurLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="scanner"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
