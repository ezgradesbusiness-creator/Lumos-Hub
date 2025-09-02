// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import eslint from 'vite-plugin-eslint'
import { visualizer } from 'rollup-plugin-visualizer'
import checker from 'vite-plugin-checker'

export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  // Determine if we're in production
  const isProduction = mode === 'production'
  
  return {
    // Base URL for the application
    base: '/',
    
    // Server configuration
    server: {
      port: parseInt(env.VITE_DEV_SERVER_PORT) || 5173,
      host: true,
      https: env.VITE_DEV_HTTPS === 'true',
      open: true,
      cors: true,
      hmr: {
        overlay: true
      }
    },
    
    // Preview server configuration
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT) || 4173,
      host: true,
      https: env.VITE_DEV_HTTPS === 'true'
    },
    
    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@services': resolve(__dirname, 'src/services'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@context': resolve(__dirname, 'src/context'),
        '@styles': resolve(__dirname, 'src/styles'),
        '@assets': resolve(__dirname, 'src/assets')
      }
    },
    
    // Plugins
    plugins: [
      // React plugin with Fast Refresh
      react({
        include: '**/*.{jsx,tsx}',
        babel: {
          plugins: isProduction ? [] : []
        }
      }),
      
      // ESLint integration
      eslint({
        cache: false,
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        exclude: ['node_modules/**', 'dist/**']
      }),
      
      // TypeScript checker (optional)
      checker({
        typescript: true,
        overlay: !isProduction,
        enableBuild: false
      }),
      
      // PWA configuration
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'masked-icon.svg'
        ],
        manifest: {
          name: 'Lumos Hub',
          short_name: 'Lumos Hub',
          description: 'Transform your study sessions with intelligent focus tools',
          theme_color: '#647a63',
          background_color: '#fcfcf9',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheKeyWillBeUsed: async ({ request }) => {
                  return `${request.url}?v=1`
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            }
          ]
        }
      }),
      
      // Bundle analyzer (only in analyze mode)
      process.env.ANALYZE && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    
    // Build configuration
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      
      // Chunk splitting strategy
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            animations: ['framer-motion'],
            ui: ['lucide-react', 'clsx'],
            date: ['date-fns'],
            supabase: ['@supabase/supabase-js']
          },
          
          // Asset naming
          chunkFileNames: isProduction 
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          entryFileNames: isProduction
            ? 'assets/js/[name]-[hash].js' 
            : 'assets/js/[name].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`
            }
            if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          }
        }
      },
      
      // Performance budgets
      chunkSizeWarningLimit: parseInt(env.VITE_PERFORMANCE_BUDGET_JS) || 500,
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Report compressed size
      reportCompressedSize: true,
      
      // Write bundle to disk
      write: true,
      
      // Empty output directory before build
      emptyOutDir: true
    },
    
    // CSS preprocessing
    css: {
      devSourcemap: !isProduction,
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer')
        ]
      }
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'date-fns',
        'lucide-react',
        'clsx'
      ],
      exclude: [
        '@supabase/supabase-js'
      ]
    },
    
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },
    
    // ESBuild configuration
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      legalComments: 'none'
    },
    
    // Worker configuration
    worker: {
      format: 'es'
    },
    
    // JSON processing
    json: {
      namedExports: true,
      stringify: false
    },
    
    // Asset processing
    assetsInclude: ['**/*.md'],
    
    // Experimental features
    experimental: {
      renderBuiltUrl(filename) {
        return {
          relative: true
        }
      }
    }
  }
})
