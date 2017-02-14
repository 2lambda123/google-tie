// Karma configuration for TIE.
// Generated (and revised) on Mon Feb 13 2017 17:54:48 GMT-0800 (PST).

module.exports = function(config) {
  config.set({
    // Base path that will be used to resolve all patterns (eg. files, exclude).
    basePath: '',
    frameworks: ['jasmine'],
    // List of files / patterns to load in the browser.
    files: [
      'third_party/angular-1.6.1/angular.min.js',
      'third_party/angular-1.6.1/angular-mocks.js',
      'client/app.js',
      'client/**/*.js'
    ],
    // List of files to exclude.
    exclude: [],
    // Pre-process matching files before serving them to the browser.
    preprocessors: {},
    // Test results reporter to use. Possible values: 'dots', 'progress'.
    // Available reporters: https://npmjs.org/browse/keyword/karma-reporter.
    reporters: ['progress'],
    // Web server port.
    port: 9876,
    // Enable / disable colors in the output (reporters and logs).
    colors: true,
    // Level of logging.
    logLevel: config.LOG_INFO,
    // Enable / disable watching file and executing tests whenever any file changes.
    autoWatch: true,
    // Start these browsers.
    // Available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],
    // Continuous Integration mode.
    // If true, Karma captures browsers, runs the tests and exits.
    singleRun: false,
    // Concurrency level (how many browser should be started simultaneously).
    concurrency: Infinity
  })
}
