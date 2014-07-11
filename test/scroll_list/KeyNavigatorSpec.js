define(function(require){
    'use strict';
    
    var KeyNavigator = require('wf-js-uicomponents/scroll_list/KeyNavigator');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');

    describe('KeyNavigator', function() {
        var keyNavigator;

        document.body.style.height = '500px';
        var itemSizeCollection = new ItemSizeCollection({
            maxWidth: 600,
            maxHeight: 600,
            items: [
                { width: 400, height: 600 },
                { width: 600, height: 400 },
                { width: 600, height: 400 }
            ]
        });

        var scrollList;

        // Create a custom keydown event
        var createEvent = function(ctrlKey, keyCode) {
            return {ctrlKey: ctrlKey, keyCode: keyCode};
        };
        
        describe('in flow mode', function() {
            
            beforeEach(function() {
                scrollList = new ScrollList(document.body, itemSizeCollection, {
                    mode: 'flow',
                    fit: 'auto',
                    padding: 10,
                    gap: 10,
                    concurrentContentLimit: 3
                });
                
                keyNavigator = new KeyNavigator(scrollList);
                scrollList.scrollToPosition({ y: 300 });
            });

            afterEach(function() {
                scrollList.dispose();
                keyNavigator.dispose();
            });
            
            it('should scroll up on up arrow keypress', function() {
                spyOn(keyNavigator, '_moveY').andCallThrough();
                spyOn(scrollList, 'scrollToPosition');
                var current = scrollList.getLayout().getVisiblePosition().top;

                var keyboardEvent = createEvent(false, 38);
                keyNavigator._keyNavListener(keyboardEvent);

                expect(keyNavigator._moveY).toHaveBeenCalled();
                expect(scrollList.scrollToPosition).toHaveBeenCalledWith({ y: current - 40 });
                
            });
            
            it('should scroll down on down arrow keypress', function() {
                spyOn(keyNavigator, '_moveY').andCallThrough();
                spyOn(scrollList, 'scrollToPosition');
                var current = scrollList.getLayout().getVisiblePosition().top;

                var keyboardEvent = createEvent(false, 40);
                keyNavigator._keyNavListener(keyboardEvent);
                
                expect(keyNavigator._moveY).toHaveBeenCalled();
                expect(scrollList.scrollToPosition).toHaveBeenCalledWith({ y: current + 40 });
            });
            
            it('should scroll left on left arrow key presses', function() {
                spyOn(keyNavigator, '_moveX').andCallThrough();
                spyOn(scrollList, 'scrollToPosition');
                
                var currentPosition = -scrollList.getListMap().getCurrentTransformState().translateX;
                var currentScale = scrollList.getListMap().getCurrentTransformState().scale;
                var keyboardEvent = createEvent(false, 37);
                keyNavigator._keyNavListener(keyboardEvent);
                
                expect(keyNavigator._moveX).toHaveBeenCalled();
                expect(scrollList.scrollToPosition).toHaveBeenCalledWith({ x: (currentPosition / currentScale) - 40 });
            });
            
            it('should scroll right on right arrow key presses', function() {
                spyOn(keyNavigator, '_moveX').andCallThrough();
                spyOn(scrollList, 'scrollToPosition');
                
                var currentPosition = -scrollList.getListMap().getCurrentTransformState().translateX;
                var currentScale = scrollList.getListMap().getCurrentTransformState().scale;
                var keyboardEvent = createEvent(false, 39);
                keyNavigator._keyNavListener(keyboardEvent);
                
                expect(keyNavigator._moveX).toHaveBeenCalled();
                expect(scrollList.scrollToPosition).toHaveBeenCalledWith({ x: (currentPosition / currentScale) + 40 });
            });
            
            it('should go down a page on page down key presses', function() {
                spyOn(keyNavigator, '_movePage').andCallThrough();
                spyOn(scrollList, 'scrollToPosition');
                
                var currentPosition = scrollList.getLayout().getVisiblePosition();
                var visiblePortion = currentPosition.bottom - currentPosition.top;
                
                var keyboardEvent = createEvent(false, 34);
                keyNavigator._keyNavListener(keyboardEvent);
                
                expect(keyNavigator._movePage).toHaveBeenCalled();
                expect(scrollList.scrollToPosition).toHaveBeenCalledWith({ y: currentPosition.top + visiblePortion });
            });

            it('should go up a page on page up key presses', function() {
                spyOn(keyNavigator, '_movePage').andCallThrough();
                spyOn(scrollList, 'scrollToPosition');
                
                var currentPosition = scrollList.getLayout().getVisiblePosition();
                var visiblePortion = currentPosition.bottom - currentPosition.top;
                
                var keyboardEvent = createEvent(false, 33);
                keyNavigator._keyNavListener(keyboardEvent);
                
                expect(keyNavigator._movePage).toHaveBeenCalled();
                expect(scrollList.scrollToPosition).toHaveBeenCalledWith({ y: currentPosition.top - visiblePortion });
            });

            it('should go to the top of the document on ctrl-home', function() {
                spyOn(keyNavigator, '_moveCtrlHomeEnd').andCallThrough();
                spyOn(scrollList, 'scrollTo');
                
                var keyboardEvent = createEvent(true, 36);
                keyNavigator._keyNavListener(keyboardEvent);
                
                expect(keyNavigator._moveCtrlHomeEnd).toHaveBeenCalled();
                expect(scrollList.scrollTo).toHaveBeenCalledWith({ index: 0 });
            });

            it('should go to the bottom of the document on ctrl-end', function() {
                spyOn(keyNavigator, '_moveCtrlHomeEnd').andCallThrough();
                spyOn(scrollList, 'scrollTo');
                
                var items = scrollList.getItemSizeCollection()._items;
                var keyboardEvent = createEvent(true, 35);
                keyNavigator._keyNavListener(keyboardEvent);
                
                expect(keyNavigator._moveCtrlHomeEnd).toHaveBeenCalled();
                expect(scrollList.scrollTo).toHaveBeenCalledWith({ index: items.length, center: {y : items[items.length - 1].height }});
            });

            it('should go the top of the current page on home', function() {
                spyOn(keyNavigator, '_moveHomeEnd').andCallThrough();
                spyOn(scrollList, 'scrollTo');
                
                var currentPage = scrollList.getCurrentItem().index;
                
                var keyboardEvent = createEvent(false, 36);
                keyNavigator._keyNavListener(keyboardEvent);
                
                expect(keyNavigator._moveHomeEnd).toHaveBeenCalled();
                expect(scrollList.scrollTo).toHaveBeenCalledWith({ index: currentPage });
            });

            it('should go to the bottom of the current page on end', function() {
                spyOn(keyNavigator, '_moveHomeEnd').andCallThrough();
                spyOn(scrollList, 'scrollToPosition');

                var currentPage = scrollList.getCurrentItem();
                scrollList.scrollTo({ index: currentPage.index + 1});
                var currentPosition = scrollList.getLayout().getVisiblePosition();
                var viewport = currentPosition.bottom - currentPosition.top;

                var keyboardEvent = createEvent(false, 35);
                keyNavigator._keyNavListener(keyboardEvent);

                expect(keyNavigator._moveHomeEnd).toHaveBeenCalled();
                expect(scrollList.scrollToPosition).toHaveBeenCalledWith({ y: currentPosition.top - viewport });
            });

            it('should not request scrolling to a negative position', function() {
                var currentPage = scrollList.getCurrentItem();
                scrollList.scrollTo({ index: currentPage.index + 1});
                spyOn(scrollList, 'scrollToPosition');

                // Fire a horizontal arrow press and then a vertical arrow press
                var keyboardEvent = createEvent(false, 39);
                keyNavigator._keyNavListener(keyboardEvent);

                keyboardEvent = createEvent(false, 38);
                keyNavigator._keyNavListener(keyboardEvent);

                expect(scrollList.scrollToPosition.mostRecentCall.args[0].y).toBeGreaterThan(0);
            });

            it('should still be on the same page after a horizontal scroll', function() {
                var oldPage = scrollList.getCurrentItem();
                scrollList.scrollTo({ index: oldPage.index + 1});
                
                var keyboardEvent = createEvent(false, 39);
                keyNavigator._keyNavListener(keyboardEvent);

                var currentPage = scrollList.getCurrentItem();

                expect(currentPage.index).toBe(oldPage.index + 1);
            });
        });

        describe('in peek or single mode', function() {

            beforeEach(function() {
                scrollList = new ScrollList(document.body, itemSizeCollection, {
                    mode: 'peek',
                    fit: 'auto',
                    padding: 10,
                    gap: 10,
                    concurrentContentLimit: 3
                });

                keyNavigator = new KeyNavigator(scrollList);
                scrollList.scrollTo({ index: 2 });
            });
            afterEach(function() {
                scrollList.dispose();
                keyNavigator.dispose();
            });

            it('should go to the previous page on up arrow keypress', function() {
                spyOn(keyNavigator, '_movePagePrevNext').andCallThrough();
                var originalPage = scrollList.getCurrentItem().index;
            
                var keyboardEvent = createEvent(false, 38);
                keyNavigator._keyNavListener(keyboardEvent);

                expect(keyNavigator._movePagePrevNext).toHaveBeenCalled();
                expect(scrollList.getCurrentItem().index).toBe(originalPage - 1);
            });

            it('should go to the next page on down keypress', function() {
                spyOn(keyNavigator, '_movePagePrevNext').andCallThrough();
                spyOn(scrollList, 'scrollTo');
                var originalPage = scrollList.getCurrentItem().index;

                var keyboardEvent = createEvent(false, 40);
                keyNavigator._keyNavListener(keyboardEvent);

                expect(keyNavigator._movePagePrevNext).toHaveBeenCalled();
                expect(scrollList.scrollTo).toHaveBeenCalledWith({ index: originalPage + 1 });
            });

            it('should go to the previous page on PageUp keypress', function() {
                spyOn(keyNavigator, '_movePagePrevNext').andCallThrough();
                var originalPage = scrollList.getCurrentItem().index;

                var keyboardEvent = createEvent(false, 33);
                keyNavigator._keyNavListener(keyboardEvent);

                expect(keyNavigator._movePagePrevNext).toHaveBeenCalled();
                expect(scrollList.getCurrentItem().index).toBe(originalPage - 1);
            });
            
            it('should go to the next page on PageDown keypress', function() {
                spyOn(keyNavigator, '_movePagePrevNext').andCallThrough();
                spyOn(scrollList, 'scrollTo');
                var originalPage = scrollList.getCurrentItem().index;

                var keyboardEvent = createEvent(false, 34);
                keyNavigator._keyNavListener(keyboardEvent);

                expect(keyNavigator._movePagePrevNext).toHaveBeenCalled();
                expect(scrollList.scrollTo).toHaveBeenCalledWith({ index: originalPage + 1 });
            });
            
            it('should go to the top of the document on ctrl-home', function() {
                spyOn(keyNavigator, '_moveCtrlHomeEnd').andCallThrough();
                spyOn(scrollList, 'scrollTo');
                
                var keyboardEvent = createEvent(true, 36);
                keyNavigator._keyNavListener(keyboardEvent);
                
                expect(keyNavigator._moveCtrlHomeEnd).toHaveBeenCalled();
                expect(scrollList.scrollTo).toHaveBeenCalledWith({ index: 0 });
            });
            
            it('should go to the bottom of the document on ctrl-end', function() {
                spyOn(keyNavigator, '_moveCtrlHomeEnd').andCallThrough();
                spyOn(scrollList, 'scrollTo');
                
                var items = scrollList.getItemSizeCollection()._items;
                var keyboardEvent = createEvent(true, 35);
                keyNavigator._keyNavListener(keyboardEvent);
                
                expect(keyNavigator._moveCtrlHomeEnd).toHaveBeenCalled();
                expect(scrollList.scrollTo).toHaveBeenCalledWith({ index: items.length, center: {y : items[items.length - 1].height }});
            });
        });
        
    });
});