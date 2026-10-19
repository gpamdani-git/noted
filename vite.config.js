import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

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
        } else if (rawUrl.startsWith('/Users/')) {
          // Direct local file path request
          const qIdx = rawUrl.indexOf('?')
          const pathname = qIdx !== -1 ? rawUrl.substring(0, qIdx) : rawUrl
          targetFilePath = decodeURIComponent(pathname)
        }

        if (targetFilePath) {
          try {
            // Strip file:// if present
            let cleanPath = targetFilePath.replace(/^file:\/\//, '')
            cleanPath = decodeURIComponent(cleanPath)

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
              res.setHeader('Access-Control-Allow-Origin', '*')
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
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        if (rawUrl.startsWith('/api/sync') || rawUrl.startsWith('/api/status') || rawUrl.startsWith('/api/schema')) {
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
                if (rawUrl.startsWith('/api/sync')) {
                  const { default: handler } = await import('./api/sync.js');
                  await handler(req, res);
                }
              } catch (err) {
                res.status(500).json({ error: err.message });
              }
            });
            return;
          }

          try {
            if (rawUrl.startsWith('/api/sync')) {
              const { default: handler } = await import('./api/sync.js');
              await handler(req, res);
            } else if (rawUrl.startsWith('/api/status')) {
              const { default: handler } = await import('./api/status.js');
              await handler(req, res);
            } else if (rawUrl.startsWith('/api/schema')) {
              const { default: handler } = await import('./api/schema.js');
              await handler(req, res);
            }
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
  plugins: [react(), localMediaPlugin(), localApiPlugin()],
  server: {
    fs: {
      allow: ['..', '/Users/daniakbar']
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

