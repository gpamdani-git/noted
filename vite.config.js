import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

// Roots that the dev server is allowed to read local media files from.
// Extend with the NOTED_MEDIA_ROOTS env variable (comma separated absolute paths).
const getMediaRoots = () => {
  const roots = [
    process.cwd(),
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), 'data')
  ]
  const extra = (process.env.NOTED_MEDIA_ROOTS || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => path.resolve(p))
  return [...new Set([...roots, ...extra])]
}

const isInsideAllowedRoot = (targetPath) => {
  const resolved = path.resolve(targetPath)
  return getMediaRoots().some((root) => resolved === root || resolved.startsWith(root + path.sep))
}

// Custom Vite plugin to safely serve local media and pasted image files from disk
function localMediaPlugin() {
  return {
    name: 'local-media-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || ''
        let targetFilePath = null

        // Handle /@local-media?path=... or /api/local-media?path=...
        if (rawUrl.startsWith('/@local-media') || rawUrl.startsWith('/api/local-media')) {
          try {
            const urlObj = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`)
            targetFilePath = urlObj.searchParams.get('path') || urlObj.searchParams.get('file')
          } catch {
            targetFilePath = null
          }
        }

        if (targetFilePath) {
          try {
            // Strip file:// if present
            let cleanPath = targetFilePath.replace(/^file:\/\//, '')
            cleanPath = decodeURIComponent(cleanPath)

            // Only files inside the allowed roots can be served
            if (!isInsideAllowedRoot(cleanPath)) {
              res.statusCode = 403
              res.end('Local media path is outside the allowed roots')
              return
            }

            if (fs.existsSync(cleanPath) && fs.statSync(cleanPath).isFile()) {
              const ext = path.extname(cleanPath).toLowerCase()
              const mimeTypes = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm'
              }

              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
              res.setHeader('Cache-Control', 'public, max-age=3600')
              fs.createReadStream(cleanPath).pipe(res)
              return
            }
          } catch (err) {
            console.error('[localMediaPlugin] Error serving file:', err)
          }
        }
        next()
      })
    }
  }
}

// Custom Vite plugin to handle local serverless API routes during development
function localApiPlugin() {
  return {
    name: 'local-api-server',
    configureServer(server) {
      // The config file itself is bundled into a temporary file, so a relative
      // import would resolve against node_modules/.vite-temp. The route is
      // resolved against the project root instead.
      const apiRoute = (name) => path.join(server.config.root, 'api', name);

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        if (rawUrl.startsWith('/api/sync') || rawUrl.startsWith('/api/status') || rawUrl.startsWith('/api/schema') || rawUrl.startsWith('/api/auth')) {
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };
          res.send = (text) => {
            res.end(text);
          };

          try {
            const urlObj = new URL(rawUrl, `http://${req.headers.host || 'localhost:5173'}`);
            req.query = Object.fromEntries(urlObj.searchParams.entries());
          } catch {
            req.query = {};
          }

          const route = rawUrl.startsWith('/api/sync')
            ? apiRoute('sync.js')
            : rawUrl.startsWith('/api/status')
              ? apiRoute('status.js')
              : rawUrl.startsWith('/api/auth')
                ? apiRoute('auth.js')
                : apiRoute('schema.js');

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', async () => {
              try {
                req.body = JSON.parse(body || '{}');
              } catch {
                req.body = {};
              }
              try {
                const { default: handler } = await import(/* @vite-ignore */ route);
                await handler(req, res);
              } catch (err) {
                res.status(500).json({ error: err.message });
              }
            });
            return;
          }

          try {
            const { default: handler } = await import(/* @vite-ignore */ route);
            await handler(req, res);
          } catch (err) {
            res.status(500).json({ error: err.message });
          }
          return;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), localMediaPlugin(), localApiPlugin()],
  server: {
    fs: {
      // Only the project directory is served - never the whole home directory.
      allow: ['.']
    },
    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, '')
      },
      '/api/lmstudio': {
        target: 'http://localhost:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lmstudio/, '')
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}']
  }
})
