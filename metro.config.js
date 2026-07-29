const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude specific native build artifacts and platform folders from being watched/resolved
const exclusionList = [
    /.*\/android\/.*/,
    /.*\/ios\/.*/,
    // Only exclude deep build artifacts like gradle/kotlin outputs, not package source builds
    /.*\/node_modules\/.*\/build\/classes\/.*/,
    /.*\/node_modules\/.*\/build\/generated\/.*/,
];

config.resolver.blockList = exclusionList;
// Compatibility for older metro versions if necessary
config.resolver.blacklistRE = exclusionList;

module.exports = config;
