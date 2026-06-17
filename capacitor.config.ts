const config = {
  appId: "com.homex.app",
  appName: "HOMEX",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://your-homex-vercel-url.vercel.app",
    cleartext: false
  }
};

export default config;
