const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const externalRoot = process.env.PROXIMA_ANDROID_BUILD_ROOT;
const appBuild = externalRoot?.trim()
    ? path.resolve(projectRoot, externalRoot, 'app')
    : path.join(projectRoot, 'app', 'build');

module.exports = {
    apk: path.join(appBuild, 'outputs/apk/debug/app-debug.apk'),
    testApk: path.join(appBuild, 'outputs/apk/androidTest/debug/app-debug-androidTest.apk')
};
