import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'pg-pool', '@auth/pg-adapter', '@react-pdf/renderer', 'imapflow', 'mailparser'],
};

export default config;
