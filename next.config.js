/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'shop-phinf.pstatic.net' },
    ],
    // 로컬 업로드 이미지는 /public/uploads/에 저장되므로 unoptimized 불필요
  },
  // PM2/자체서버에서 standalone 빌드 사용 권장
  output: 'standalone',
}

module.exports = nextConfig
