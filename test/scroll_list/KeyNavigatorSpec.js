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
                { width: 600, height: 400 }
            ]
        });

        var scrollList = new ScrollList(document.body, itemSizeCollection, {
            mode: 'flow',
            fit: 'auto',
            padding: 10,
            gap: 10,
            concurrentContentLimit: 3
        });

        // Create a custom keydown event
        var createEvent = function(ctrlKey, keyCode) {
            return {ctrlKey: ctrlKey, keyCode: keyCode};
        };

        beforeEach(function() {
            keyNavigator = new KeyNavigator(scrollList);
            scrollList.scrollToPosition({y: 300});
        });
        
        it('should scroll up on up arrow keypress', function() {
            spyOn(keyNavigator, '_moveY').andCallThrough();
            spyOn(scrollList, 'scrollToPosition');
            var current = scrollList.getLayout().getVisiblePosition().top;

            var keyboardEvent = createEvent(false, 38);
            keyNavigator._keyNavListener(keyboardEvent);

            expect(keyNavigator._moveY).toHaveBeenCalled();
            expect(scrollList.scrollToPosition).toHaveBeenCalledWith({y: current - 40});
            
        });
        
        it('should scroll down on down arrow keypress', function() {
            spyOn(keyNavigator, '_moveY').andCallThrough();
            spyOn(scrollList, 'scrollToPosition');
            var current = scrollList.getLayout().getVisiblePosition().top;

            var keyboardEvent = createEvent(false, 40);
            keyNavigator._keyNavListener(keyboardEvent);
            
            expect(keyNavigator._moveY).toHaveBeenCalled();
            expect(scrollList.scrollToPosition).toHaveBeenCalledWith({y: current + 40});
        });
        
        it('should go down a page on page down key presses', function() {
            spyOn(keyNavigator, '_movePage').andCallThrough();
            spyOn(scrollList, 'scrollToPosition');
            
            var currentPage = scrollList.getCurrentItem();
            var currentPosition = scrollList.getLayout().getVisiblePosition();
            
            var itemHeight = scrollList.getItemSizeCollection();
            itemHeight = itemHeight._items[currentPage.index].height;
            
            var keyboardEvent = createEvent(false, 34);
            keyNavigator._keyNavListener(keyboardEvent);
            
            expect(keyNavigator._movePage).toHaveBeenCalled();
            expect(scrollList.scrollToPosition).toHaveBeenCalledWith({y: currentPosition.top + itemHeight});
        });
        
        it('should go up a page on page up key presses', function() {
            spyOn(keyNavigator, '_movePage').andCallThrough();
            spyOn(scrollList, 'scrollToPosition');
            
            var currentPage = scrollList.getCurrentItem();
            var currentPosition = scrollList.getLayout().getVisiblePosition();
            
            var itemHeight = scrollList.getItemSizeCollection();
            itemHeight = itemHeight._items[currentPage.index].height;
            
            var keyboardEvent = createEvent(false, 33);
            keyNavigator._keyNavListener(keyboardEvent);
            
            expect(keyNavigator._movePage).toHaveBeenCalled();
            expect(scrollList.scrollToPosition).toHaveBeenCalledWith({y: currentPosition.top - itemHeight});
        });
        
        it('should go to the top of the document on ctrl-home', function() {
            spyOn(keyNavigator, '_moveCtrlHomeEnd').andCallThrough();
            spyOn(scrollList, 'scrollToPosition');
            
            var keyboardEvent = createEvent(true, 36);
            keyNavigator._keyNavListener(keyboardEvent);
            
            expect(keyNavigator._moveCtrlHomeEnd).toHaveBeenCalled();
            expect(scrollList.scrollToPosition).toHaveBeenCalledWith({y: 0});
        });
        
        it('should go to the bottom of the document on ctrl-end', function() {
            spyOn(keyNavigator, '_moveCtrlHomeEnd').andCallThrough();
            spyOn(scrollList, 'scrollToPosition');
            
            var height = scrollList.getLayout().getSize().height;
            var keyboardEvent = createEvent(true, 35);
            keyNavigator._keyNavListener(keyboardEvent);
            
            expect(keyNavigator._moveCtrlHomeEnd).toHaveBeenCalled();
            expect(scrollList.scrollToPosition).toHaveBeenCalledWith({y: height});
        });
        
        it('should go the top of the current page on home', function() {
            spyOn(keyNavigator, '_moveHomeEnd').andCallThrough();
            spyOn(scrollList, 'scrollToPosition');
            
            var currentPage = scrollList.getCurrentItem();
            var items = scrollList.getItemSizeCollection()._items;
            var position = 0;
            
            // The top of the current page will be the sum of the heights of pages before the current page
            for (var i = 0; i < currentPage.index; i++ ) {
                position += items[i].height;
            }
            position = position * 1.5;
            position += ( currentPage.index * 5 );
            
            var keyboardEvent = createEvent(false, 36);
            keyNavigator._keyNavListener(keyboardEvent);
            
            expect(keyNavigator._moveHomeEnd).toHaveBeenCalled();
            expect(scrollList.scrollToPosition).toHaveBeenCalledWith({y: position});
        });
        
        it('should go to the bottom of the current page on end', function() {
            spyOn(keyNavigator, '_moveHomeEnd').andCallThrough();
            spyOn(scrollList, 'scrollToPosition');

            var currentPage = scrollList.getCurrentItem();
            var items = scrollList.getItemSizeCollection()._items;
            var position = 0;
            
            // The bottom of the current page will be the sum of the heights of all pages
            // through the current page, minus the height of the viewport
            for (var j = 0; j <= currentPage.index; j++ ) {
                position += items[j].height;
            }
            position = position * 1.5;
            position += ( currentPage.index * 5 );
            position -= (scrollList.getLayout().getVisiblePosition().bottom - scrollList.getLayout().getVisiblePosition().top);

            var keyboardEvent = createEvent(false, 35);
            keyNavigator._keyNavListener(keyboardEvent);
            expect(keyNavigator._moveHomeEnd).toHaveBeenCalled();
            expect(scrollList.scrollToPosition).toHaveBeenCalledWith({y: position});
        });
        
    });
});