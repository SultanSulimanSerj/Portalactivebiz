module.exports = {
  apps: [
    {
      name: 'manexa',
      script: 'server.js',
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: process.env.PM2_INSTANCES > 1 ? 'cluster' : 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '1G',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      autorestart: true,
    },
    {
      name: 'manexa-export-worker',
      script: 'node_modules/.bin/tsx',
      args: 'scripts/document-export-worker.ts',
      instances: parseInt(process.env.DOCUMENT_EXPORT_WORKER_INSTANCES || '1', 10),
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '1536M',
      error_file: './logs/pm2-export-worker-error.log',
      out_file: './logs/pm2-export-worker-out.log',
      merge_logs: true,
      autorestart: true,
    },
  ],
}
