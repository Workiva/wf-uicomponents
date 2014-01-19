(function() {
    /* globals $: true */
    /* globals Mustache: true */
    /* globals wf: true */
    var personTemplate = $('#person-template').html();
    Mustache.parse(personTemplate);
    var cache = {};
    var TOTAL_ITEMS = 1000,
        MIN_NUMBER_OF_VIRTUAL_ITEMS = 50;



    function randomUserData(seed, onSuccess, onError) {
        if (cache[seed]){
            console.log('cache hit');
            setTimeout(function() {
                onSuccess(cache[seed]);
            }, 0);
        } else {
            $.ajax({
                url: 'http://api.randomuser.me/?seed='+seed,
                dataType: 'json',
                success: function(data){
                    cache[seed] = data;
                    onSuccess(data);
                },
                error: onError
            });
        }
    }

    var items = (function(){
        var items = [];
        for (var i = 0; i < TOTAL_ITEMS; i++) {
            items.push({ width: 600, height: 300 });
        }
        return items;
    })();

    var host$ = $('#host')[0];
    var scrollList = new wf.uicomponents.ScrollList(host$, items, {
        gap: 10,
        mode: 'flow',
        fit: 'auto',
        minNumberOfVirtualItems: MIN_NUMBER_OF_VIRTUAL_ITEMS,
        padding: 0,
        scaleLimits: { minimum: 0.25, maximum: 3 }
    });

    scrollList.onContentRequested(function(sender, args) {
        var index = args.itemIndex;
        var container = args.placeholder.contentContainer;
        var $container = $(container);
        $container.removeClass('loading');

        // Remove old child
        if (container.children.length > 0) {
            var oldChild =  container.children[0];
            container.removeChild(oldChild);
        }

        var el = document.createElement('div');
        el.textContent = 'Hi there ' + index;

        randomUserData('slide' + index, function(response) {
            el = Mustache.render(personTemplate, response.results[0].user);
            $container.html(el);
        });
    });

    scrollList.onContentRemoved(function(sender, args) {
        // Remove old child
        var container = args.placeholder.contentContainer;
        if (container.children.length > 0) {
            var oldChild = container.children[0];
            container.removeChild(oldChild);
        }
    });

    scrollList.onCurrentItemChanged(function(/*sender, args*/) {
    });

    scrollList.onInteraction(function(/*sender, args*/) {
    });

    scrollList.onPlaceholderRendered(function(sender, args) {
        var container = args.placeholder.contentContainer;
        $(container).addClass('loading');
    });

    scrollList.render();


    // POSITIONAL INFORMATION
    var pageLocation$ = $('#current-position');
    pageLocation$.text('0 / ' + TOTAL_ITEMS);
    scrollList.onCurrentItemChanged(function(sender, args) {
        pageLocation$.text(args.itemIndex + ' / ' + TOTAL_ITEMS);
    });


    // SCROLL BAR
    var scrollbarEL = document.getElementById('scroll-bar');
    var layout = scrollList.getLayout();
    var virtualHeight = layout.getSize().height,          // virtual height of the content
        viewportHeight = layout.getViewportSize().height; // This could change on window resize

    // Calculate the size of the scrollbar depending on the virtual height
    var scrollbarHeight = Math.max(16, ((viewportHeight/virtualHeight) * viewportHeight))
    scrollbarEL.style.height = scrollbarHeight + 'px';

    scrollList.getListMap().onTranslationChanged(function(/*sender, args*/) {
        if (scrollbarScrolling) {
          return;
        }
        setTimeout(function() {
            var currentPosition = layout.getVisiblePosition().top;
            var availableScrollbarHeight = viewportHeight - scrollbarHeight;
            var scrollableVirtualHeight = virtualHeight - viewportHeight;
            var translatedPosition = availableScrollbarHeight / scrollableVirtualHeight * currentPosition;
            scrollbarEL.style.top = translatedPosition + 'px';
        }, 0);
    });

    // SCROLL BAR INTERACTION
    var clickOffset;
    var scrollbarScrolling = false;

    function updateScrollBar(event) {
        // Don't go past the window bounds
        var scrollbarPos = Math.max(0, event.y - clickOffset);
        scrollbarPos = Math.min(scrollbarPos, viewportHeight - scrollbarHeight);

        scrollbarEL.style.top = scrollbarPos + 'px';

        // Use the ratio of scrollbar position inside the scrolling area to calculate
        // the current item we should be interested in.
        var positionOfInterest = (scrollbarPos / (viewportHeight - scrollbarHeight)) * (TOTAL_ITEMS - 2) + 1;

        // The whole number part is the index of the item we care about
        // The part after the decimal place will be used to calculate
        // a 'y' offset based on the height of the item.
        var indexOfItem = Math.floor(positionOfInterest);
        var remainder = positionOfInterest - indexOfItem;


        // Lazily figure out the height of the element.
        // Everything is 310px high. 300 for the actual element, and 10 for gap
        // Except the the first and last items, they also need to include the padding.
        var objHeight = 310;
        if (indexOfItem === 0 || indexOfItem === (TOTAL_ITEMS)){
          objHeight = 315;
        }

        scrollList.scrollTo({
          index: indexOfItem,
          center: {x: 0, y: objHeight * remainder}
        });
    };

    function stopUpdatingScrollbar(event) {
        clickOffset = undefined;
        scrollbarScrolling = false;
        document.removeEventListener('mousemove', updateScrollBar);
        removeDocumentEventWatching();
    };

    function removeDocumentEventWatching() {
      document.removeEventListener('mouseup', stopUpdatingScrollbar);
    };

    scrollbarEL.addEventListener('mousedown', function(event) {
        clickOffset = event.y - scrollbarEL.offsetTop;
        scrollbarScrolling = true;
        document.addEventListener('mousemove', updateScrollBar);
        document.addEventListener('mouseup', stopUpdatingScrollbar);
    });

})();
