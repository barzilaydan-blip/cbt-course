/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Admin screens mutate data then immediately navigate to a list (e.g. create a group, then
  // view the groups sidebar) — the default 30s client router cache for dynamic routes was
  // serving pre-mutation data in that window. Disable it so navigations always refetch fresh.
  experimental: {
    staleTimes: { dynamic: 0 },
  },
};

export default nextConfig;
