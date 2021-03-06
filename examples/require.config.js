requirejs.config({
    baseUrl: './',
    paths: {
        bowser: '../../bower_components/bowser/bowser',
        hammerjs: '../../bower_components/hammerjs/dist/hammer.min',
        jquery: '../../bower_components/jquery/jquery.min',
        lodash: '../../bower_components/lodash/lodash.min',
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
