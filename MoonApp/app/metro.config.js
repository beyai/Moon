const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;
const appDir = __dirname;
const rootDir = path.resolve(appDir, '..');
/**
 * Metro configuration
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    
    projectRoot: appDir,

    watchFolders: [rootDir],

    resolver: {
        nodeModulesPaths: [
            path.join(appDir, 'node_modules'),
            path.join(rootDir, 'node_modules'),
        ],
        assetExts: [...assetExts ],
        sourceExts: [...sourceExts ],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
};

module.exports = mergeConfig(defaultConfig, config);
