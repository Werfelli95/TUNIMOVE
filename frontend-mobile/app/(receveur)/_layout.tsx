import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

const HEADER = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: Colors.white,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 16 },
  headerBackTitleVisible: false,
};

export default function ReceveurLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="dashboard"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="service"
        options={{ ...HEADER, title: 'Gestion du service' }}
      />
      <Stack.Screen
        name="vente"
        options={{ ...HEADER, title: 'Émettre un billet' }}
      />
      <Stack.Screen
        name="manifeste"
        options={{ ...HEADER, title: 'Manifeste du service' }}
      />
      <Stack.Screen
        name="incident"
        options={{ ...HEADER, title: 'Signaler un incident' }}
      />
      <Stack.Screen
        name="sell"
        options={{ ...HEADER, title: 'Vente de billets' }}
      />
    </Stack>
  );
}
