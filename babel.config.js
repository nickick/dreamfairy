module.exports = function (api) {
  api.cache(true);
  
  // Determine which env file to use based on NODE_ENV
  const envPath = process.env.NODE_ENV === 'development' 
    ? '.env.development.local' 
    : '.env.local';
  
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: envPath,
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true,
          verbose: false,
        },
      ],
    ],
  };
};
