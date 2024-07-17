import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': {},
    },
    server: {
        proxy: {
            '/api': 'http://localhost:5000', // 백엔드 서버의 URL로 프록시 설정
        },
    },
});
