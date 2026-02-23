/**
 * Azure API configuration for the React Native client.
 *
 * Set AZURE_API_BASE_URL to the base URL of your deployed Azure Functions app.
 * Locally this is `http://localhost:7071`.
 *
 * Environment-specific values can be supplied via a `.env` file and a package
 * like `react-native-dotenv`, then imported here instead of the hardcoded string.
 */

/**
 * Base URL of the Azure Functions HTTP API — no trailing slash.
 *
 * Local dev:   http://localhost:7071/api
 * Production:  https://<your-app>.azurewebsites.net/api
 */
export const AZURE_API_BASE_URL: string =
  process.env.AZURE_API_BASE_URL ?? 'https://REPLACE_WITH_FUNCTION_APP_URL/api';
