import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  /* Xuat file tinh (out/) de deploy len Cloudflare Pages — toan bo site
     chi gom HTML tinh + iframe krpano nen khong can server Node. */
  output: "export",
};

export default nextConfig;
