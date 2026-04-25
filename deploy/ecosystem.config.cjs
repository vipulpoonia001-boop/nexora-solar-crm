module.exports = {
  apps: [
    {
      name: 'nexora-api',
      cwd: '/var/www/nexora/backend',
      script: 'server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        JWT_SECRET: 'replace-with-strong-secret',
        CORS_ORIGINS: 'https://yourdomain.com,https://www.yourdomain.com'
      }
    }
  ]
};
