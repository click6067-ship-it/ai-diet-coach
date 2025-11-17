/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 빌드할 때 ESLint 에러 때문에 실패하지 않도록
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
