module.exports = {
  apps: [
    {
      name: 'rwa-manager',
      script: 'server.js',
      instances: 1, // Single instance recommended for in-memory Socket.io unless using Redis adapter
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
}
