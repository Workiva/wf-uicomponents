requirejs.config({
    baseUrl: '../../src',
    paths: {
        hammerjs: '../bower_components/hammerjs/dist/hammer',
        lodash: '../bower_components/lodash/dist/lodash',
        modernizr: '../bower_components/modernizr/modernizr',
        'wf-js-common': '../bower_components/wf-common/src/',
        'wf-js-uicomponents': '.'
    },
    shim: {
        hammerjs: {
            exports: 'Hammer'
        },
        modernizr: {
            exports: 'Modernizr'
        }
    }
});