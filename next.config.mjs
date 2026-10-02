/** @type {import('next').NextConfig} */
const nextConfig = {
     eslint: {
    // Lint warnings/errors won't block `next build`. Run `npm run lint`
    // separately if you want to see them.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
