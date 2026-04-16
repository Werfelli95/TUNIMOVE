import { Stack } from 'expo-router';

export default function ReceveurLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          headerShown: true, 
          title: "Tableau de bord (Receveur)",
          headerStyle: { backgroundColor: '#1a3a52' },
          headerTintColor: '#fff'
        }} 
      />
      <Stack.Screen 
        name="sell" 
        options={{ 
          headerShown: true, 
          title: "Vente de billets",
          headerStyle: { backgroundColor: '#1a3a52' },
          headerTintColor: '#fff'
        }} 
      />
      <Stack.Screen 
        name="manifeste" 
        options={{ 
          headerShown: true, 
          title: "Manifeste",
          headerStyle: { backgroundColor: '#1a3a52' },
          headerTintColor: '#fff'
        }} 
      />
      <Stack.Screen 
        name="incident" 
        options={{ 
          headerShown: true, 
          title: "Signaler un incident",
          headerStyle: { backgroundColor: '#1a3a52' },
          headerTintColor: '#fff'
        }} 
      />
      <Stack.Screen 
        name="service" 
        options={{ 
          headerShown: true, 
          title: "Gestion du service",
          headerStyle: { backgroundColor: '#1a3a52' },
          headerTintColor: '#fff'
        }} 
      />
      <Stack.Screen 
        name="vente" 
        options={{ 
          headerShown: true, 
          title: "Vente de billets",
          headerStyle: { backgroundColor: '#1a3a52' },
          headerTintColor: '#fff'
        }} 
      />
    </Stack>
  );
}
