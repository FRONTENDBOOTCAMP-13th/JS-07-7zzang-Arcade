import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: 'index.html', // 기본 index.html
        // 필요한 다른 HTML 파일을 여기에 추가
        space: 'src/pages/the-seventh-space/space.html',
        tomato: 'src/pages/tomato-box/tomato-intro.html',
      },
    },
  },
  appType: 'mpa', // fallback 사용안함
});
