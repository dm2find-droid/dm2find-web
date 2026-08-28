import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://dm2find.ai',
  output: 'static',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  /* Geen Astro-i18n-routing meer: die genereerde met `fallback` Franse URL's
     met Engelse inhoud — precies de valse hreflang-claim waar de oude comment
     voor waarschuwde. De talen komen nu uit echte routes onder /[locale]/,
     en Base.astro zet hreflang alleen voor pagina's die in elke taal bestaan. */
});
