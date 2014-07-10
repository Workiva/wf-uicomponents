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

        var itemSizeCollection, scrollList, scrollBar, parentEl, options, initialize;
        var $parent;

        itemSizeCollection = new ItemSizeCollection({
            maxWidth: 600,
            maxHeight: 600,
            items: [
                { width: 400, height: 600 },
                { width: 600, height: 400 }
            ]
        });

        $('<div id="scrolllist-host"></div>').css({ position: 'absolute', top: -10000, width: 500, height: 500 }).appendTo('body');
        scrollList = new ScrollList(document.getElementById('scrolllist-host'), itemSizeCollection, {
            mode: 'flow',
            fit: 'auto',
            padding: 10,
            gap: 10,
            concurrentContentLimit: 3
        });

        initialize = function() {
            options = {};
            options.scrollbarId = 'scroll-bar';
            options.scrollbarContainerId = 'scroll-bar-container';
            options.scrollbarClass = 'scroll-bar';
            options.scrollBarContainerClass = 'scroll-bar-container';

            scrollBar = new ScrollBar(scrollList, parentEl, options);
        };

        function checkScrollBarAtBottom () {
            var scrollBarEL = document.getElementById('scroll-bar');
            scrollList.scrollToPosition({ y: scrollList.getLayout().getSize().height });

            scrollBar._placeScrollBar();

            var position = scrollBarEL.style.top;
            position = parseInt(position, 10);

            expect(position).toEqual(Math.round(scrollBar._availableScrollbarHeight));
        }

        function checkForScrollPastEnd () {
            var scrollBarEl = document.getElementById('scroll-bar');
            var e1 = document.createEvent('Event');
            e1.initEvent('mousedown', true, false);
            var e2 = document.createEvent('Event');
            e2.initEvent('mousemove', true, false);
            var e3 = document.createEvent('Event');
            e3.initEvent('mouseup', true, false);
            var listMap = scrollList.getListMap();

            var visibleArea = scrollBar._layout.getVisiblePosition().bottom - scrollBar._layout.getVisiblePosition().top;

            listMap.transform({
                x: 0,
                y: (-scrollList.getLayout().getSize().height - visibleArea) * 10,
                scale: listMap.getCurrentTransformState().scale
            });

            scrollList.render();
            scrollBar._placeScrollBar();

            spyOn(listMap, 'transform');

            scrollBarEl.dispatchEvent(e1);
            scrollBarEl.dispatchEvent(e2);
            scrollBarEl.dispatchEvent(e3);

            var newY = -listMap.transform.mostRecentCall.args[0].y;
            expect(newY).toBeLessThan(scrollList._layout.getSize().height + 1);
        }

        beforeEach(function() {
            $parent = $('<div id="scroll-bar-parent"></div>');
            $parent.empty().css({ position: 'absolute', top: -10000, width: 500, height: 500 }).appendTo('body');
            parentEl = $parent[0];
        });

        afterEach(function() {
            if ($('#scroll-bar').length > 0) {
                scrollBar.dispose();
            }
            $parent.remove();
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
            var e3 = document.createEvent('Event');
            e3.initEvent('mouseup', true, false);

            var listMap = scrollList.getListMap();
            spyOn(listMap, 'transform');

            scrollBarEl.dispatchEvent(e1);
            scrollBarEl.dispatchEvent(e2);
            scrollBarEl.dispatchEvent(e3);

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

        describe('when the ScrollList is shorter than the viewport', function () {
            beforeEach(function() {
                initialize();
                var listMap = scrollList.getListMap();
                listMap.transform({
                    x: 0,
                    y: 0,
                    scale: listMap.getCurrentTransformState().scale * 0.1
                });
            });

            afterEach(function() {
                var listMap = scrollList.getListMap();
                listMap.transform({
                    x: 0,
                    y: 0,
                    scale: listMap.getCurrentTransformState().scale * 10
                });
            });

            it('should not show the scrollbar', function() {
                expect(scrollBar._scrollbarHeight).toBe(0);
            });
        });

        describe('when zoomed in', function () {
            beforeEach(function() {
                initialize();
                var listMap = scrollList.getListMap();
                listMap.transform({
                    x: 0,
                    y: 0,
                    scale: listMap.getCurrentTransformState().scale + 0.5
                });
            });

            it('should not try to scroll past the bottom of the ScrollList', function() {
                checkForScrollPastEnd();
            });

            it('should put the ScrollBar at the bottom when the ScrollList is scrolled to the end', function() {
                scrollBar._placeScrollBar();

                checkScrollBarAtBottom();
            });
        });

        describe('when zoomed out', function () {
            beforeEach(function() {
                initialize();
                var listMap = scrollList.getListMap();
                listMap.transform({
                    x: 0,
                    y: -scrollList._layout.getSize().height,
                    scale: listMap.getCurrentTransformState().scale - 0.5
                });
            });

            it('should not try to scroll past the bottom of the ScrollList', function() {
                checkForScrollPastEnd();
            });

            it('should put the ScrollBar at the bottom when the ScrollList is scrolled to the end', function() {
                checkScrollBarAtBottom();
            });
        });
    });
});
