module.exports = function(grunt) {

    require('wf-grunt').init(grunt, {
        options: {
            sauceLabs: {
                buildNumber: process.env.TRAVIS_BUILD_NUMBER,
                testName: 'wf-uicomponents unit tests',
                username: process.env.SAUCE_LABS_USERNAME,
                accessKey: process.env.SAUCE_LABS_ACCESS_KEY
            },
            requireConfig: {
                paths: {
                    hammerjs: 'bower_components/hammerjs/dist/hammer.min',
                    jquery: 'bower_components/jquery/jquery.min',
                    lodash: 'bower_components/lodash/lodash.min',
                    modernizr: 'bower_components/modernizr/modernizr',
                    'wf-js-common': 'bower_components/wf-common/src',
                    'wf-js-uicomponents': './src'
                },
                shim: {
                    hammerjs: {
                        exports: 'Hammer'
                    },
                    jquery: {
                        exports: '$'
                    },
                    modernizr: {
                        exports: 'Modernizr'
                    }
                }
            }
        },

        requirejs: {
            compile: {
                options: {
                    baseUrl: 'src',
                    name: '../node_modules/almond/almond',
                    include: 'scroll_list/ScrollList',
                    mainConfigFile: 'scripts/build/build.config.js',
                    out: 'out/build/wf-uicomponents.min.js',
                    wrap: {
                        startFile: 'scripts/build/start.frag',
                        endFile: 'scripts/build/end.frag'
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');
};
