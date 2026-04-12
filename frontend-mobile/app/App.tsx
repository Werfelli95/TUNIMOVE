import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ServiceProvider } from './data/ServiceContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ServiceProvider>
      <RouterProvider router={router} />
      <Toaster />
    </ServiceProvider>
  );
}
