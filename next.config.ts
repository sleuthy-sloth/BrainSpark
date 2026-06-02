import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configured for Vercel server deployment
  // No static export — uses Next.js server runtime for:
  // - API routes (auth callbacks, score sync)
  // - Server-side rendering (faster initial loads)
  // - Image optimization (built-in)

  // Supabase auth callback is handled client-side via
  // /auth/callback page with code exchange
};

export default nextConfig;
