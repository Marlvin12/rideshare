const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Redirect react-native-maps to a no-op stub when bundling for web.
 * The library relies on native codegen modules that do not exist on web,
 * causing a hard bundle failure. Mobile builds are unaffected because
 * the resolver only substitutes on the 'web' platform.
 */
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: path.resolve(__dirname, 'src/mocks/react-native-maps.web.ts'),
      type: 'sourceFile',
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
