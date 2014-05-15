/*
 * Copyright 2014 WebFilings, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(function(require) {
    'use strict';

    var $ = require('jquery');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var ScrollBar = require('wf-js-uicomponents/scroll_bar/ScrollBar');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');

    describe('ScrollBar', function() {

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

        var scrollBar;
        var parentEl;

        var $parent = $('<div id="scroll-bar-parent"></div>');
        $('body').append($parent);

        var options = {};
        options.scrollbarId = 'scroll-bar';
        options.scrollbarContainerId = 'scroll-bar-container';
        options.scrollbarClass = 'scroll-bar';
        options.scrollBarContainerClass = 'scroll-bar-container';

        parentEl = document.getElementById('scroll-bar-parent');

        var initialize = function() {
            scrollBar = new ScrollBar(scrollList, parentEl, options);
        };

        function checkScrollBarAtBottom () {
            scrollList.scrollToPosition({y: Number.POSITIVE_INFINITY});
            scrollBar._placeScrollBar();

            var scrollBarEL = document.getElementById('scroll-bar');
            var position = scrollBarEL.style.top;
            position = parseInt(position, 10);

            expect(position).toEqual(Math.floor(scrollBar._availableScrollbarHeight));
        }

        function checkForScrollPastEnd () {
            var scrollBarEl = document.getElementById('scroll-bar');
            var e1 = document.createEvent('Event');
            e1.initEvent('mousedown', true, false);
            var e2 = document.createEvent('Event');
            e2.initEvent('mousemove', true, false);

            var listMap = scrollList.getListMap();
            var visibleArea = scrollBar._layout.getVisiblePosition().bottom - scrollBar._layout.getVisiblePosition().top;

            listMap.transform({
                x: 0,
                y: -scrollList.getLayout().getSize().height - visibleArea,
                scale: listMap.getCurrentTransformState().scale
            });

            scrollList.render();
            scrollBar._placeScrollBar();

            spyOn(listMap, 'transform');

            scrollBarEl.dispatchEvent(e1);
            scrollBarEl.dispatchEvent(e2);

            var newY = -listMap.transform.mostRecentCall.args[0].y;
            expect(newY).toBeLessThan(scrollList._layout.getSize().height + 1);
        }

        afterEach(function() {
            $parent.empty();
        });

        it('should initialize the ScrollBar with the given parameters', function() {
            initialize();
            expect(scrollBar._parent).toEqual(parentEl);
            expect(scrollBar._scrollList).toEqual(scrollList);
            expect(scrollBar._options).toEqual(options);
        });
        
        it('should throw an error if initialized without a parent element', function() {
            expect(function() { scrollBar = new ScrollBar(scrollList, null, options); }).toThrow(
                new Error('ScrollBar#ScrollBar: parent is required.'));
        });
        
        it('should throw an error if initialized without a scrollList', function() {
            expect(function() { scrollBar = new ScrollBar(null, parentEl, options); }).toThrow(
                new Error('ScrollBar#ScrollBar: scrollList is required'));
        });

        it('should set up the DOM with the scrollbar and container with the given ids', function() {
            initialize();
            var scrollBarEl =  document.getElementById(options.scrollbarId);
            var scrollBarContainerEl = document.getElementById(options.scrollbarContainerId);

            expect(scrollBarEl).not.toBe(undefined);
            expect(scrollBarContainerEl).not.toBe(undefined);
        });
        
        it('should set up the DOM with the scrollbar and container with the given classes', function() {
            initialize();
            var scrollBarEl = document.getElementsByClassName(options.scrollbarClass);
            var scrollBarContainerEl = document.getElementsByClassName(options.scrollBarContainerClass);
 
            expect(scrollBarEl).not.toBe(undefined);
            expect(scrollBarContainerEl).not.toBe(undefined);
        });

        it('should scroll to position when the scrollBar is moved', function() {
            initialize();
            var scrollBarEl = document.getElementById('scroll-bar');
            var e1 = document.createEvent('Event');
            e1.initEvent('mousedown', true, false);
            var e2 = document.createEvent('Event');
            e2.initEvent('mousemove', true, false);
            
            var listMap = scrollList.getListMap();
            spyOn(listMap, 'transform');

            scrollBarEl.dispatchEvent(e1);
            scrollBarEl.dispatchEvent(e2);

            expect(listMap.transform).toHaveBeenCalled();
        });

        it('should adjust the position of the scrollbar when the scrollList translation changes', function() {
            initialize();
            spyOn(scrollBar, '_placeScrollBar');
            runs(function() {
                scrollList.scrollToPosition({y: 400});
            });
            waits(16 + 1);
            runs(function() {
                expect(scrollBar._placeScrollBar).toHaveBeenCalled();
            });
        });

        it('should adjust the scrollbar size and the scale variables when the scale changes', function() {
            initialize();
            spyOn(scrollBar, '_adjustScale');
            scrollList.zoomTo({scale: 1.2});
            expect(scrollBar._adjustScale).toHaveBeenCalled();
        });

        it('should adjust the scrollbar size and position when new items are inserted into the scrollList', function () {
            initialize();
            spyOn(scrollBar, '_adjustScale');
            spyOn(scrollBar, '_placeScrollBar');
            scrollList.insertItems(0, [{height: 400, width: 400}, {height: 600, width: 400}]);
            expect(scrollBar._adjustScale).toHaveBeenCalled();
            expect(scrollBar._placeScrollBar).toHaveBeenCalled();
        });

        describe('when zoomed in', function () {
            beforeEach(function() {
                var listMap = scrollList.getListMap();
                listMap.transform({
                    x: 0,
                    y: -scrollList._layout.getSize().height,
                    scale: listMap.getCurrentTransformState().scale + 0.5
                });
            });

            it('should not try to scroll past the bottom of the ScrollList', function() {
                initialize();

                checkForScrollPastEnd();
            });

            it('should put the ScrollBar at the bottom when the ScrollList is scrolled to the end', function() {
                initialize();

                checkScrollBarAtBottom();
            });
        });

        describe('when zoomed out', function () {
            beforeEach(function() {
                var listMap = scrollList.getListMap();
                listMap.transform({
                    x: 0,
                    y: -scrollList.getLayout().getSize().height,
                    scale: listMap.getCurrentTransformState().scale - 0.5
                });
            });

            it('should not try to scroll past the bottom of the ScrollList', function() {
                initialize();

                checkForScrollPastEnd();
            });

            it('should put the ScrollBar at the bottom when the ScrollList is scrolled to the end', function() {
                initialize();

                checkScrollBarAtBottom();
            });
        });
    });
});
