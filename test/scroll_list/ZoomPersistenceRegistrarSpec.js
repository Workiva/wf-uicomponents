define(function(require){
    'use strict';

    var $ = require('jquery');
    var ZoomPersistenceRegistrar = require('wf-js-uicomponents/scroll_list/ZoomPersistenceRegistrar');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');
    
    describe('ZoomPersistenceRegistrar', function() {

        var $element = $('<div/>').css({
            width: 500,
            height: 500,
            position: 'absolute',
            left: -1000,
        });

        var itemSizeCollection = new ItemSizeCollection({
            maxWidth: 600,
            maxHeight: 600,
            items: [
                { width: 400, height: 600 },
                { width: 600, height: 400 },
                { width: 600, height: 400 },
                { width: 600, height: 400 },
                { width: 600, height: 400 },
                { width: 400, height: 600 }
            ]
        });

        var scrollList;

        beforeEach(function() {
            $element.appendTo(document.body);
            scrollList = new ScrollList($element[0], itemSizeCollection, {
                mode: 'peek',
                fit: 'auto',
                padding: 10,
                gap: 10,
                concurrentContentLimit: 3
            });

            ZoomPersistenceRegistrar.register(scrollList);
            scrollList.render();
            scrollList.scrollToItem({ index: 1 });
            scrollList.getCurrentItemMap().zoomTo({ scale: 3 });
        });

        afterEach(function() {
            $element.remove();
            scrollList.dispose();
        });

        it('should set the zoom on the next map', function() {
            var next = scrollList.getItemMap(2);
            expect(next.getScale()).toBe(3);
        });

        it('should set the zoom on the previous map', function() {
            var previous = scrollList.getItemMap(0);
            expect(previous.getScale()).toBe(3);
        });

        it('should set the zoom to the prior zoom when jumping pages', function() {
            scrollList.scrollToItem({ index: 4 });
            expect(scrollList.getCurrentItemMap().getScale()).toBe(3);
        });

        it('should set the zoom on the next map when jumping pages', function() {
            scrollList.scrollToItem({ index: 4 });
            var next = scrollList.getItemMap(5);
            expect(next.getScale()).toBe(3);
        });

        it('should set the zoom on the previous map when jumping pages', function() {
            scrollList.scrollToItem({ index: 4 });
            var previous = scrollList.getItemMap(3);
            expect(previous.getScale()).toBe(3);
        });
    });
});
