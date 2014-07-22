define(function(require){
    'use strict';

    var ZoomPersistanceProvider = require('wf-js-uicomponents/scroll_list/ZoomPersistanceProvider');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');
    
    describe('ZoomPersistanceProvider', function() {

        var zoomPersistanceProvider;

        document.body.style.height = '500px';
        var itemSizeCollection = new ItemSizeCollection({
            maxWidth: 600,
            maxHeight: 600,
            items: [
                { width: 400, height: 600 },
                { width: 600, height: 400 },
                { width: 600, height: 400 },
                { width: 600, height: 400 },
                { width: 600, height: 400 }
            ]
        });

        var scrollList;

        beforeEach(function() {
            scrollList = new ScrollList(document.body, itemSizeCollection, {
                mode: 'peek',
                fit: 'auto',
                padding: 10,
                gap: 10,
                concurrentContentLimit: 3
            });

            zoomPersistanceProvider = new ZoomPersistanceProvider(scrollList);
            scrollList.scrollTo({ index: 1 });
            scrollList.getCurrentItemMap().zoomTo({ scale: 3 });
        });

        afterEach(function() {
            scrollList.dispose();
        });

        it('should set the zoom on the next map', function() {
            var previous = scrollList.getItemMap(0);
            expect(previous.getScale()).toBe(3);
        });

        it('should set the zoom on the previous map', function() {
            var next = scrollList.getItemMap(2);
            expect(next.getScale()).toBe(3);
        });

        it('should set the zoom to the prior zoom when jumping pages', function() {
            scrollList.scrollTo({ index: 6 });
            expect(scrollList.getCurrentItemMap().getScale()).toBe(3);
        });
    });
});