require([
    'hammerjs',
    'jquery',
    'wf-js-uicomponents/scroll_list/ScrollList',
    'wf-js-uicomponents/awesome_map/BoundaryInterceptor',
    'wf-js-uicomponents/awesome_map/ScaleInterceptor',
    'wf-js-uicomponents/awesome_map/SwipeInterceptor',
    'wf-js-common/DeviceInfo',
    'wf-js-common/BrowserInfo',
    'wf-js-common/Url',
    'wf-js-common/DOMUtil',
    'wf-js-common/console',
    'hammerjs.fakemultitouch',
    'hammerjs.showtouches'
], function(
    Hammer,
    $,
    ScrollList,
    BoundaryInterceptor,
    ScaleInterceptor,
    SwipeInterceptor,
    DeviceInfo,
    BrowserInfo,
    Url,
    DOMUtil,
    console
) {
    'use strict';

    //---------------------------------------------------------
    // Initialize ViewerComponent
    //---------------------------------------------------------

    function generateItemMetadata(length) {
        // NOTE: Interested in retina canvas performance?
        // See: http://www.scirra.com/forum/retina-ios-performance-problem-fix-please-test_topic58742.html
        var tallItem = { height: 1022, width: 766 };
        var wideItem = { height: 766, width: 1022 };
        var result = [];
        for (var i = 0; i < length; i++) {
            var item = (i % 2 === 0) ? tallItem : wideItem;
            result.push(item);
        }

        return result;
    }

    function createPage(container, pageIndex, scale, width, height) {
        var pixelRatio = DeviceInfo.devicePixelRatio;

        // Create the canvas element.
        var canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';

        // NOTE: Account for retina displays! (Incl setting ctx.scale below.)
        canvas.height = height * pixelRatio;
        canvas.width = width * pixelRatio;
        canvas.style.height = height + 'px';
        canvas.style.width = width + 'px';

        // Initialize the drawing context.
        var ctx = canvas.getContext('2d');
        ctx.scale(pixelRatio, pixelRatio);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);

        // Render the page label.
        ctx.fillStyle = '#333';
        ctx.font = 'bold 20px sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';
        ctx.fillText('Page ' + (pageIndex + 1), width / 2, 5);

        // Render the canvas checkerboard.
        var checkerboardMargin = 30;
        var checkerboardSquareCount = 10;
        var exactCheckerboardHeight = height - checkerboardMargin * 2;
        var exactCheckerboardWidth = width - checkerboardMargin * 2;
        var excessCheckerboardHeight = exactCheckerboardHeight % checkerboardSquareCount;
        var excessCheckerboardWidth = exactCheckerboardWidth % checkerboardSquareCount;
        var squareHeight = (exactCheckerboardHeight - excessCheckerboardHeight) / checkerboardSquareCount;
        var squareWidth = (exactCheckerboardWidth - excessCheckerboardWidth) / checkerboardSquareCount;
        var patternLeft = checkerboardMargin + (excessCheckerboardWidth / 2);
        var patternTop = checkerboardMargin + (excessCheckerboardHeight / 2);
        var patternHeight = squareHeight * checkerboardSquareCount;
        var patternWidth = squareWidth * checkerboardSquareCount;

        var patternCanvas = document.createElement('canvas');
        patternCanvas.height = squareHeight * 2;
        patternCanvas.width = squareWidth * 2;

        var patternCtx = patternCanvas.getContext('2d');
        patternCtx.fillStyle = (pageIndex % 2 === 0) ? '#69c' : '#c96';
        patternCtx.fillRect(0, 0, squareWidth, squareHeight);
        patternCtx.fillRect(squareWidth, squareHeight, squareWidth, squareHeight);

        var pattern = ctx.createPattern(patternCanvas, 'repeat');
        ctx.fillStyle = pattern;
        ctx.translate(patternLeft, patternTop);
        ctx.fillRect(0, 0, patternWidth, patternHeight);

        // Append to the container.
        container.appendChild(canvas);
    }

    function updateZoomPercentage() {
        if (!scrollList) {
            return;
        }
        $('#zoomTo').val(Math.floor(scrollList.getScale() * 100));
    }

    var url = new Url(window.location);
    var urlParams = url.getParams();
    var scrollMode = urlParams.scroll || (DeviceInfo.desktop ? 'flow' : 'peek');
    var fitMode = urlParams.fit || 'auto';
    var totalPages = +urlParams.totalPages || 100;
    var minNumberOfVirtualItems = scrollMode === 'flow' ? (DeviceInfo.desktop ? 15 : 9) : (DeviceInfo.desktop ? 5 : 3);
    var items = generateItemMetadata(totalPages);

    var scrollList = window.scrollList = new ScrollList($('#document')[0], items, {
        gap: 2,
        mode: scrollMode,
        fit: fitMode,
        minNumberOfVirtualItems: minNumberOfVirtualItems,
        padding: 1,
        scaleLimits: { minimum: 0.25, maximum: 3 }
    });

    scrollList.onContentRequested(function(sender, args) {
        var itemIndex = args.itemIndex;
        console.log('content requested for', itemIndex);
        createPage(args.placeholder.contentContainer, itemIndex,
            args.scaleToFit, args.width, args.height);
    });

    scrollList.onContentRemoved(function(sender, args) {
        console.log('content removed for', args.itemIndex);
    });

    scrollList.onCurrentItemChanged(function(sender, args) {
        console.log('current item changed to', args.itemIndex);
        $('#page').val(args.itemIndex + 1);
        updateZoomPercentage();
    });

    scrollList.onInteraction(function(sender, args) {
        console.log(args.event.type, args);
    });

    scrollList.onInteractionStarted(function(/*sender*/) {
        console.log('interaction started');
    });

    scrollList.onInteractionFinished(function(/*sender*/) {
        console.log('interaction finished');
    });

    scrollList.onPlaceholderRendered(function(sender, args) {
        console.log('placeholder rendered for', args.itemIndex);
        // BEWARE: Doing big stuff here can interrupt swipe animations!
        args.placeholder.contentContainer.style.backgroundColor = '#fff';
    });

    scrollList.onScaleChanged(function(sender, args) {
        console.log('scale changed to', args.scale);
        updateZoomPercentage();
    });

    scrollList.onScrollPositionChanged(function(sender, args) {
        console.log('scroll position changed to', args.x, args.y);
    });

    scrollList.onItemsInserted(function(sender, args) {
        totalPages += args.count;
        $('#totalPages').val(totalPages);
    });

    scrollList.render();

    //---------------------------------------------------------
    // Hammer touch simulation
    //---------------------------------------------------------

    if (BrowserInfo.getBrowser() !== 'MSIE') {
        Hammer.plugins.showTouches();
        Hammer.plugins.fakeMultitouch();
    }

    //---------------------------------------------------------
    // UI control wiring
    //---------------------------------------------------------

    $(function() {

        $(window).on('resize', function() { console.log('resize'); });
        $(window).on('orientationchange', function() { console.log('orientationchange'); });
        $(window).on('scroll', function() { console.log('scroll'); });

        DOMUtil.dismissIOS7VirtualKeyboardOnOrientationChange();
        DOMUtil.preventIOS7WindowScroll();

        $('#scrollMode').val(scrollMode).change(function() {
            window.location = url.addParam('scroll', this.value).toString();
        });

        $('#fitMode').val(fitMode).change(function() {
            window.location = url.addParam('fit', this.value).toString();
        });

        $('#zoomToScale').submit(function() {
            var scale = parseInt(this.elements.zoomTo.value, 10) / 100;
            scrollList.zoomTo({ scale: scale });
            $(':focus').blur();
            return false;
        });

        $('#toggle-disabled').click(function() {
            if ($(this).is(':checked')) {
                scrollList.disable();
            }
            else {
                scrollList.enable();
            }
        });

        $('#jumpToPage').submit(function() {
            scrollList.scrollTo({
                index: this.elements.page.value - 1
            });
            $(':focus').blur();
            return false;
        });

        $('#totalPages').val(totalPages).change(function() {
            window.location = url.addParam('totalPages', this.value).toString();
        });

        // Hide iOS browser chrome
        $('body').scrollTop(0);
    });
});
