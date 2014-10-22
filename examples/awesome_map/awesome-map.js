require([
    'hammerjs',
    'jquery',
    'wf-js-uicomponents/awesome_map/AwesomeMap',
    'wf-js-uicomponents/awesome_map/BoundaryInterceptor',
    'wf-js-uicomponents/awesome_map/DoubleTapZoomInterceptor',
    'wf-js-uicomponents/awesome_map/ScaleInterceptor',
    'wf-js-uicomponents/awesome_map/SwipeInterceptor',
    'wf-js-common/DeviceInfo',
    'wf-js-common/DOMUtil',
    'wf-js-common/consoleDev',
    'wf-js-common/Compatibility',
    'hammerjs.fakemultitouch',
    'hammerjs.showtouches',
], function(
    Hammer,
    $,
    AwesomeMap,
    BoundaryInterceptor,
    DoubleTapZoomInterceptor,
    ScaleInterceptor,
    SwipeInterceptor,
    DeviceInfo,
    DOMUtil,
    console
) {
    'use strict';

    //---------------------------------------------------------
    // Utilities
    //---------------------------------------------------------

    function createPage() {
        var pixelRatio = DeviceInfo.devicePixelRatio;
        var width = 400;
        var height = 400;

        var canvas = document.createElement('canvas');
        canvas.className = 'page';
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        canvas.style.height = height + 'px';
        canvas.style.width = width + 'px';

        var ctx = canvas.getContext('2d');
        ctx.scale(pixelRatio, pixelRatio);

        //Clears the canvas and sets its font
        ctx.clearRect(0, 0, 400, 400);

        // Creates the canvas checkerboard.
        var patternCanvas = document.createElement('canvas');
        patternCanvas.width = 40;
        patternCanvas.height = 40;

        var pctx = patternCanvas.getContext('2d');
        pctx.fillStyle = 'rgb(255, 255, 255)';
        pctx.fillRect(0, 0, 20, 20);
        pctx.fillRect(20, 20, 20, 20);

        // Fills in the canvas with the pattern
        var pattern = ctx.createPattern(patternCanvas, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, 400, 400);

        var container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '400px';
        container.style.position = 'absolute';
        container.style.backgroundColor = '#f00';
        container.appendChild(canvas);

        return container;
    }

    function updateCurrentState(map) {
        setTimeout(function() {
            var state = map.getCurrentTransformState();
            $('.currentState').html(
                '<strong>Current State</strong><br/>' +
                    'scale: ~' + Math.round(state.scale * 100) / 100 + '<br/>' +
                    'translateX: ' + state.translateX + '<br/>' +
                    'translateY: ' + state.translateY
            );
        }, 25);
    }

    //---------------------------------------------------------
    // Hammer touch simulation
    //---------------------------------------------------------

    Hammer.plugins.showTouches();
    Hammer.plugins.fakeMultitouch();

    //---------------------------------------------------------
    // AwesomeMap construction
    //---------------------------------------------------------

    var $host = $('#host');
    var $enableSwipes = $('#enableSwipes');
    var $enforceScaleLimits = $('#enforceScaleLimits');
    var $enforceViewportBoundaries = $('#enforceViewportBoundaries');

    function refreshInterceptors() {
        // Interceptors have to be in a certain order to work correctly.

        awesomeMap.removeInterceptor(DoubleTapZoomInterceptor);
        awesomeMap.removeInterceptor(SwipeInterceptor);
        awesomeMap.removeInterceptor(ScaleInterceptor);
        awesomeMap.removeInterceptor(BoundaryInterceptor);

        awesomeMap.addInterceptor(new DoubleTapZoomInterceptor());
        if ($enableSwipes[0].checked) {
            awesomeMap.addInterceptor(new SwipeInterceptor(swipeOptions));
        }
        if ($enforceScaleLimits[0].checked) {
            awesomeMap.addInterceptor(new ScaleInterceptor(scaleLimitOptions));
        }
        if ($enforceViewportBoundaries[0].checked) {
            awesomeMap.addInterceptor(new BoundaryInterceptor(boundaryOptions));
        }
    }

    var swipeOptions = {};
    var scaleLimitOptions = { mode: 'slow', minimum: 0.7, maximum: 3 };
    var boundaryOptions = { mode: 'stop' };

    var awesomeMap = window.awesomeMap = new AwesomeMap($host[0]);
    awesomeMap.appendContent(createPage());
    refreshInterceptors();
    awesomeMap.onTransformFinished(updateCurrentState);
    updateCurrentState(awesomeMap);

    awesomeMap.onInteraction(function(source, args) {
        var event = args.event;
        console.debug(event.type, event);
    });

    //---------------------------------------------------------
    // Control wiring
    //---------------------------------------------------------

    $(function() {
        var done = function() {
            console.debug('done');
        };

        DOMUtil.dismissIOS7VirtualKeyboardOnOrientationChange();
        DOMUtil.preventIOS7WindowScroll();

        // Panning
        $('form.pan').submit(function() {
            var elements = this.elements;
            var options = {
                x: Number(elements.x.value) || 0,
                y: Number(elements.y.value) || 0,
                duration: Number(elements.duration.value) || 0,
                done: done
            };

            if (elements.panMode[0].checked) {
                awesomeMap.panBy(options);
            }
            else {
                awesomeMap.panTo(options);
            }

            return false;
        });

        // Zooming
        $('form.zoom').submit(function() {
            var elements = this.elements;
            var options = {
                scale: Number(elements.scale.value) || 1,
                duration: Number(elements.duration.value) || 0,
                done: done
            };

            if (elements.zoomMode[0].checked) {
                awesomeMap.zoomBy(options);
            }
            else {
                awesomeMap.zoomTo(options);
            }

            return false;
        });

        // Enabling swipe event handling
        $enableSwipes.click(function() {
            if (this.checked) {
                refreshInterceptors();
            }
            else {
                awesomeMap.removeInterceptor(SwipeInterceptor);
            }
        });

        // Enforcing scale limits
        $enforceScaleLimits.click(function() {
            if (this.checked) {
                refreshInterceptors();
            }
            else {
                awesomeMap.removeInterceptor(ScaleInterceptor);
            }
        });

        // Enforcing viewport boundaries
        $enforceViewportBoundaries.click(function() {
            if (this.checked) {
                refreshInterceptors();
            }
            else {
                awesomeMap.removeInterceptor(BoundaryInterceptor);
            }
        });
    });
});
