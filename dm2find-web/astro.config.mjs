import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://dm2find.ai',
  output: 'static',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  i18n: {
    defaultLocale: 'en',
    // Declare ONLY locales with real content. Adding one here that has no
    // content generates hreflang claims that are not true.
    locales: ['en', 'fr'],
    routing: { prefixDefaultLocale: false, fallbackType: 'rewrite' },
    fallback: { fr: 'en' },
  },
});
