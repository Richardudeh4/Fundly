import Constants from 'expo-constants';

// Pull the channel/release channel to decide which base URL to use.
// In development (Expo Go / local build) releaseChannel is undefined.
const channel = Constants.expoConfig?.extra?.releaseChannel ?? 'development';

const BASE_URLS: Record<string, string> = {
  development: 'http://localhost:3000/v1',
  staging: 'https://api-staging.fundly.app/v1',   // update when you have a staging URL
  production: 'https://api.fundly.app/v1',         // update when you have a production URL
};

const ENV = {
  BASE_URL: BASE_URLS[channel] ?? BASE_URLS.development,
  IS_DEV: channel === 'development',
};

export default ENV;
