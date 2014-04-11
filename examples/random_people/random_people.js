require([
    'wf-js-uicomponents/scroll_bar/ScrollBar',
], function(
        ScrollBar
    ) {
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
    var parent = document.getElementById('scroll-bar-parent');
    var scrollbarOptions = {};
    scrollbarOptions.scrollbarId = 'scrollbar';
    scrollbarOptions.scrollbarContainerId = 'scrollbar-container';
    window.scrollBar = new ScrollBar(scrollList, parent, scrollbarOptions);
});
