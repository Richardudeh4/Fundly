const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-svg-transformer enables direct .svg file imports:
//   import Logo from './logo.svg'  →  <Logo width={48} />
//
// Uncomment the block below AFTER running:
//   npx expo install react-native-svg-transformer
//
// const { transformer, resolver } = config;
// config.transformer = {
//   ...transformer,
//   babelTransformerPath: require.resolve('react-native-svg-transformer'),
// };
// config.resolver = {
//   ...resolver,
//   assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
//   sourceExts: [...resolver.sourceExts, 'svg'],
// };

module.exports = config;
