(function() {
    /* globals $: true */
    /* globals Mustache: true */
    /* globals wf: true */
    var personTemplate = $('#person-template').html();
    Mustache.parse(personTemplate);
    var cache = {};

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
        for (var i = 0; i < 10000; i++) {
            items.push({ width: 600, height: 300 });
        }
        return items;
    })();

    var host$ = $('#host')[0];
    var scrollList = new wf.uicomponents.ScrollList(host$, items, {
        gap: 10,
        mode: 'flow',
        fit: 'auto',
        minNumberOfVirtualItems: 50,
        padding: 10,
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
        // var el = document.createElement('img');
        // el.className = 'loading';

        // container.appendChild(el);
    });

    scrollList.render();

    // CONTROL PANEL
    var goToZoom$ = $('#goToZoom');
    var scaleLevel$ = $('#zoomLevel');
    scaleLevel$[0].value = scrollList.getScale();

    goToZoom$.on('click', function() {
        scrollList.zoomTo(scaleLevel$[0].value, 1000);
    });

    var targetIndex = 0;
    $('#scroll10').on('click', function() {
        console.debug('click');
        targetIndex += 10;
        var originalScale = scrollList.getScale();
        scrollList.zoomTo(.3, 500, function() {
            console.log('firstZoomDone'); 
        });

        setTimeout(function() {
            scrollList.scrollTo({
                index: targetIndex,
                duration: 2000,
                done: function() {
                    console.log('scrollTo done');
                }
            })
        }, 550);

        setTimeout(function() {
            console.log('scrollTo done: ' + originalScale);
            scrollList.zoomTo(originalScale, 500, function() {
                console.log('second scale done');
            });
        },2600);
    });
})();
