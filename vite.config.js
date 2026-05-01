import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Sur build Vercel (VERCEL=1), sans SAMEDOMAIN : exige VITE_API_URL vers l’API distante (ex. Render), pas le domaine du front. */
function vercelProductionApiGuard() {
  return {
    name: 'vercel-production-api-guard',
    configResolved(config) {
      if (config.command !== 'build' || config.mode !== 'production') return;
      if (process.env.VERCEL !== '1') return;

      /* Même source que le bundle : .env.production + variables d’environnement du shell (tableau de bord Vercel). */
      const loaded = loadEnv(config.mode, config.envDir, '');
      const raw = loaded.VITE_API_URL || process.env.VITE_API_URL || '';
      const v = String(raw).trim().replace(/\/$/, '');
      const vercelUrl = String(process.env.VERCEL_URL || '').trim();

      if (process.env.VITE_SAMEDOMAIN_API === 'true') {
        /* Front + Express sur un seul projet Vercel → /api sur le même hôte ; pas besoin de VITE_API_URL externe. */
        return;
      }

      if (!v) {
        throw new Error(
          '[Vercel build] VITE_API_URL manquante au build. ' +
            'Dans Vercel → Project → Settings → Environment Variables, ajoute VITE_API_URL=https://TON-SERVICE.onrender.com/api ' +
            '(HTTPS, suffixe /api ; pas l’URL du site Vercel). ' +
            'Coche « All Environments » ou au moins Production + Preview. ' +
            'Sinon : fichier Frontend/.env.production dans le dépôt avec la même ligne (l’URL de l’API est publique).'
        );
      }

      if (!v.startsWith('http')) {
        throw new Error(
          `[Vercel build] VITE_API_URL doit être une URL absolue (https://.../api). Reçu : "${raw}". « /api » seul envoie les requêtes vers le domaine du front (404).`
        );
      }

      let hostname;
      try {
        hostname = new URL(v).hostname.toLowerCase();
      } catch {
        throw new Error(`[Vercel build] VITE_API_URL invalide (URL illisible) : ${v}`);
      }
      const vercelHost = vercelUrl.split('/')[0].toLowerCase();
      if (vercelHost && hostname === vercelHost) {
        throw new Error(
          `[build] VITE_API_URL utilise le même hôte que ce déploiement Vercel (${vercelHost}). ` +
            'Utilise plutôt VITE_SAMEDOMAIN_API=true (Express sur ce projet) ou une autre origine pour l’API.'
        );
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelProductionApiGuard()],
  build: {
    /** Même dossier que vercel.json (racine repo → outputDirectory Frontend/dist, ou racine Frontend → dist). */
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // Évite qu'un vieux pré-bundle Vite résolve encore html2canvas (erreur color() / parse CSS).
      html2canvas: path.resolve(__dirname, 'src/shims/stub-html2canvas.js'),
    },
  },
  optimizeDeps: {
    include: ['html-to-image'],
  },
  server: {
    headers: {
      'Cache-Control': 'no-store',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
