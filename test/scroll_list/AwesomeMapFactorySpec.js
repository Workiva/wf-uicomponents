define(function(require) {
    'use strict';

    var $ = require('jquery');
    var AwesomeMapFactory = require('wf-js-uicomponents/scroll_list/AwesomeMapFactory');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');

    describe('AwesomeMapFactory', function() {
        var $host = $('<div>').css({ position: 'absolute', top: -10000, width: 400, height: 400 });
        beforeEach(function() {
            $host.appendTo('body');
        });
        afterEach(function() {
            $host.empty().remove();
        });
        describe('list maps', function() {
            describe('when translation changes', function() {
                it('should dispatch scroll list "onScrollPositionChanged"', function() {
                    // Setup scroll list
                    var itemSizeCollection = new ItemSizeCollection({
                        maxWidth: 100,
                        maxHeight: 100,
                        items: [{ width: 100, height: 100 }]
                    });
                    var scrollList = new ScrollList($host[0], itemSizeCollection);
                    spyOn(scrollList.onScrollPositionChanged, 'dispatch');

                    // Setup list map.
                    var map = AwesomeMapFactory.createListMap(scrollList);

                    // Dispatch the translation change event from the map.
                    var args = {
                        event: {},
                        x: -100,
                        y: -100
                    };
                    map.onTranslationChanged.dispatch([map, args]);

                    // Expect the translation change to trigger a scroll position change.
                    expect(scrollList.onScrollPositionChanged.dispatch)
                        .toHaveBeenCalledWith([scrollList, {
                            event: args.event,
                            x: -args.x,
                            y: -args.y
                        }]);
                });
            });
        });
    });
});
