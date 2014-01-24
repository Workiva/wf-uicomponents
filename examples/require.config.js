requirejs.config({
    baseUrl: './',
    paths: {
        hammerjs: '../../bower_components/hammerjs/dist/hammer',
        jquery: '../../bower_components/jquery/jquery',
        lodash: '../../bower_components/lodash/dist/lodash',
        modernizr: '../../bower_components/modernizr/modernizr',
        'hammerjs.fakemultitouch': '../vendor/hammer.fakemultitouch',
        'hammerjs.showtouches': '../vendor/hammer.showtouches',
        'wf-js-common': '../../bower_components/wf-common/src/',
        'wf-js-uicomponents': '../../src/',
    },
    shim: {
        'hammerjs.fakemultitouch': {
            deps: ['hammerjs']
        },
        'hammerjs.showtouches': {
            deps: ['hammerjs']
        },
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
});