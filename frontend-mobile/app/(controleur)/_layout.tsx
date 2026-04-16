import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { LogOut } from 'lucide-react-native';

export default function ControleurLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen 
        name="scanner" 
        options={{ 
          headerShown: true, 
          title: "Scanner",
          headerStyle: { backgroundColor: '#1a3a52' },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.replace('/')} style={{ marginRight: 15 }}>
              <LogOut color="#fff" size={24} />
            </TouchableOpacity>
          )
        }} 
      />
    </Stack>
  );
}
