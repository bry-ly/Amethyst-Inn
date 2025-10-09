import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_BASE:
       process.env.NEXT_PUBLIC_API_BASE ||
       "https://amethyst-inn-server.vercel.app",
    NEXT_PRIVATE_API_BASE:
      process.env.NEXT_PRIVATE_API_BASE || "https://amethyst-inn-server.vercel.app/api",
  },
  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
        port: "",
        pathname: "/**",
      },
       {
         protocol: "https",
         hostname: "res.cloudinary.com",
         port: "",
         pathname: "/**",
       },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.pexels.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
   async rewrites() {
     if (process.env.NODE_ENV !== "development") {
       return [];
     }
     return [
       {
         source: "/api/:path*",
         destination: "http://localhost:5000/api/:path*",
       },
     ];
   },
};

export default nextConfig;
