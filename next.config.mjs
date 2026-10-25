/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework version via the X-Powered-By header.
  poweredByHeader: false,

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  async headers() {
    return [
      {
        // Apply baseline security headers to every route.
        source: "/(.*)",
        headers: [
          // Prevents MIME-type sniffing on responses.
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Stops the app from being framed by another origin (clickjacking).
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Limits referrer information sent to third-party origins.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Restricts access to sensitive browser APIs.
          // Adjust individual directives as new features are added.
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "interest-cohort=()",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
