import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME': JSON.stringify('dzn51fdrx'),
  },
})
