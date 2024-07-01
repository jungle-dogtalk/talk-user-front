import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      VITE_OPENVIDU_URL: process.env.VITE_OPENVIDU_URL || 'http://localhost:4443',
      VITE_OPENVIDU_SECRET: process.env.VITE_OPENVIDU_SECRET || 'MY_SECRET',
    }
  }
});
