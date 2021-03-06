/*
 * Copyright 2015 Workiva, Inc.
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

        var itemSizeCollection, scrollList, scrollBar, parentEl, options;
        var $parent;

        itemSizeCollection = new ItemSizeCollection({
            maxWidth: 600,
            maxHeight: 600,
            items: [
                { width: 400, height: 600 },
                { width: 600, height: 400 }
            ]
        });

        function initialize(orientation, mode, trackMargin) {
            $('<div id="scrolllist-host"></div>')
            .css({ position: 'absolute', top: -10000, width: 500, height: 500 })
            .appendTo('body');

            scrollList = new ScrollList(document.getElementById('scrolllist-host'), itemSizeCollection, {
                mode: mode || 'flow',
                fit: 'auto',
                padding: 10,
                gap: 10,
                concurrentContentLimit: 3
            });

            $parent = $('<div id="scroll-bar-parent"></div>');
            $parent.empty().css({ position: 'absolute', top: -10000, width: 500, height: 500 }).appendTo('body');
            parentEl = $parent[0];

            options = {};
            options.scrollerId = 'scroll-bar';
            options.scrollTrackId = 'scroll-bar-container';
            options.scrollerClass = 'scroll-bar';
            options.scrollTrackClass = 'scroll-bar-container';
            options.orientation = orientation;
            options.scrollerZIndex = 5;
            options.scrollerThickness = 5;
            options.scrollTrackThickness = 5;
            options.trackMargin = trackMargin || 0;

            scrollBar = new ScrollBar(scrollList, parentEl, options);

            // Need to trigger a render so that the scrollbar's callbacks get registered.
            scrollList.render();
        }

        function cleanup() {
            if ($('#scroll-bar').length > 0) {
                scrollBar.dispose();
            }
            $parent.remove();
            scrollList.dispose();
            $('#scrolllist-host').remove();
        }

        describe('instantiation', function() {
            beforeEach(function() {
                initialize('vertical');
            });

            afterEach(function() {
                cleanup();
            });

            it('should throw an error if initialized without a parent element', function() {
                expect(function() { scrollBar = new ScrollBar(scrollList, null, options); }).toThrow(
                    new Error('ScrollBar#ScrollBar: parent is required.'));
            });

            it('should throw an error if initialized without a scrollList', function() {
                expect(function() { scrollBar = new ScrollBar(null, parentEl, options); }).toThrow(
                    new Error('ScrollBar#ScrollBar: scrollList is required'));
            });

            it('should set up the DOM with the scroller and scroll track with the given ids', function() {
                var scrollBarEl =  document.getElementById(options.scrollerId);
                var scrollBarContainerEl = document.getElementById(options.scrollTrackId);

                expect(scrollBarEl).not.toBe(undefined);
                expect(scrollBarContainerEl).not.toBe(undefined);
            });

            it('should set up the DOM with the scroller and scroll track with the given classes', function() {
                var scrollBarEl = document.getElementsByClassName(options.scrollerClass);
                var scrollBarContainerEl = document.getElementsByClassName(options.scrollTrackClass);

                expect(scrollBarEl).not.toBe(undefined);
                expect(scrollBarContainerEl).not.toBe(undefined);
            });

            it('should set position: absolute on the scroller and scroll track', function() {
                var scrollBarEl =  document.getElementById(options.scrollerId);
                var scrollBarContainerEl = document.getElementById(options.scrollTrackId);

                expect(scrollBarEl.style.position).toBe('absolute');
                expect(scrollBarContainerEl.style.position).toBe('absolute');
            });

            it('should set the z-index on the scroller', function() {
                var scrollBarEl =  document.getElementById(options.scrollerId);

                expect(scrollBarEl.style.zIndex + '').toBe('5');
            });

            it('should set the scroller and scroll track thickness on the scroller', function() {
                var scrollBarEl =  document.getElementById(options.scrollerId);
                var scrollBarContainerEl = document.getElementById(options.scrollTrackId);

                expect(scrollBarEl.style.width).toBe('5px');
                expect(scrollBarContainerEl.style.width).toBe('5px');
            });
        });

        function testScrollToPosition() {
            var scrollBarEl = document.getElementById('scroll-bar');
            var e1 = document.createEvent('Event');
            e1.initEvent('mousedown', true, false);
            var e2 = document.createEvent('Event');
            e2.initEvent('mousemove', true, false);
            var e3 = document.createEvent('Event');
            e3.initEvent('mouseup', true, false);

            spyOn(scrollBar._activeMap, 'panTo');

            scrollBarEl.dispatchEvent(e1);
            scrollBarEl.dispatchEvent(e2);
            scrollBarEl.dispatchEvent(e3);

            expect(scrollBar._activeMap.panTo).toHaveBeenCalled();
        }

        function testScaleChanged() {
            var OLD_SCALE = 2.0;
            var NEW_SCALE = 3.0;

            var startScale;
            var endScale;

            scrollBar._activeMap.zoomTo({ scale: OLD_SCALE });
            startScale = scrollBar._scale;
            scrollBar._activeMap.zoomTo({ scale: NEW_SCALE });

            waits(10);

            runs(function() {
                endScale = scrollBar._scale;
                expect(scrollBar._activeMap.getCurrentTransformState().scale).toEqual(NEW_SCALE);
                expect(endScale).toEqual(NEW_SCALE);
                expect(endScale).not.toEqual(startScale);
            });
        }

        function testResizedOnScaleChanged() {
            var OLD_SCALE = 2.0;
            var NEW_SCALE = 3.0;

            var startBarSize;
            var endBarSize;

            scrollBar._activeMap.zoomTo({ scale: OLD_SCALE });
            if (scrollBar.isVertical()) {
                startBarSize = parseInt(scrollBar._elements.scroller.style.height);
            } else {
                startBarSize = parseInt(scrollBar._elements.scroller.style.width);
            }
            scrollBar._activeMap.zoomTo({ scale: NEW_SCALE });

            waits(10);

            runs(function() {
                if (scrollBar.isVertical()) {
                    endBarSize = parseInt(scrollBar._elements.scroller.style.height);
                } else {
                    endBarSize = parseInt(scrollBar._elements.scroller.style.width);
                }
                expect(startBarSize).not.toEqual(endBarSize);
            });
        }

        function testResizedOnItemAdded() {
            spyOn(scrollBar, '_cacheDimensions');
            scrollList.insertItems(0, [{height: 400, width: 400}, {height: 600, width: 400}]);
            expect(scrollBar._cacheDimensions).toHaveBeenCalled();
        }

        function testHideOnShortContent() {
            var OLD_SCALE = 2.0;
            var NEW_SCALE = 0.25;

            var startBarSize;
            var endBarSize;

            scrollBar._activeMap.zoomTo({ scale: OLD_SCALE });
            if (scrollBar.isVertical()) {
                startBarSize = parseInt(scrollBar._elements.scroller.style.height);
            } else {
                startBarSize = parseInt(scrollBar._elements.scroller.style.width);
            }
            scrollBar._activeMap.zoomTo({ scale: NEW_SCALE });

            waits(10);

            runs(function() {
                if (scrollBar.isVertical()) {
                    endBarSize = parseInt(scrollBar._elements.scroller.style.height);
                } else {
                    endBarSize = parseInt(scrollBar._elements.scroller.style.width);
                }
                expect(startBarSize).not.toEqual(endBarSize);
                expect(endBarSize).toEqual(0);
            });
        }

        function testMoveOnScrollToUpperLeft() {
            var NEW_Y = 0;
            var NEW_X = 0;
            var DELTA = 10;
            var SCALE = 3.0;

            var startBarOffset;
            var endBarOffset;

            scrollBar._activeMap.zoomTo({ scale: SCALE });
            scrollBar._activeMap.panTo({ x: NEW_X - DELTA, y: NEW_Y - DELTA });
            if (scrollBar.isVertical()) {
                startBarOffset = parseInt(scrollBar._elements.scroller.style.top);
            } else {
                startBarOffset = parseInt(scrollBar._elements.scroller.style.left);
            }
            scrollBar._activeMap.panTo({ x: NEW_X, y: NEW_Y, scale: SCALE });

            waits(10);

            runs(function() {
                if (scrollBar.isVertical()) {
                    endBarOffset = parseInt(scrollBar._elements.scroller.style.top);
                } else {
                    endBarOffset = parseInt(scrollBar._elements.scroller.style.left);
                }
                expect(endBarOffset).toEqual(0);
                expect(startBarOffset).not.toEqual(endBarOffset);
            });
        }

        function testMoveOnScrollToLowerRight() {
            // Use really big numbers here to make sure we get to the lower right.
            var NEW_Y = -10000;
            var NEW_X = -10000;
            var SCALE = 3.0;

            var startBarOffset;
            var endBarOffset;

            scrollBar._activeMap.zoomTo({ scale: SCALE });
            scrollBar._activeMap.panTo({ x: 0, y: 0 });
            if (scrollBar.isVertical()) {
                startBarOffset = parseInt(scrollBar._elements.scroller.style.top);
            } else {
                startBarOffset = parseInt(scrollBar._elements.scroller.style.left);
            }
            scrollBar._activeMap.panTo({ x: NEW_X, y: NEW_Y });

            waits(10);

            runs(function() {
                var trackSize;
                var scrollBarSize;
                if (scrollBar.isVertical()) {
                    endBarOffset = parseInt(scrollBar._elements.scroller.style.top);
                    scrollBarSize = parseInt(scrollBar._elements.scroller.style.height);
                    trackSize = parseInt(scrollBar._elements.scrollTrack.style.height);
                } else {
                    endBarOffset = parseInt(scrollBar._elements.scroller.style.left);
                    scrollBarSize = parseInt(scrollBar._elements.scroller.style.width);
                    trackSize = parseInt(scrollBar._elements.scrollTrack.style.width);
                }
                // Add one to make sure this quantity is bigger, not always exact due to rounding.
                var allowedSpace = trackSize - scrollBarSize + 1;
                expect(endBarOffset).toBeLessThan(allowedSpace);
                expect(startBarOffset).not.toEqual(endBarOffset);
            });
        }

        describe('when vertical', function() {
            it('should set the scroller size when an item is added in flow mode', function() {
                initialize('vertical', 'flow');
                testResizedOnItemAdded();
                cleanup();
            });

            describe('in flow mode', function() {
                beforeEach(function() {
                    initialize('vertical', 'flow');
                });

                afterEach(function() {
                    cleanup();
                });

                it('should scroll when the scroller is moved', function() {
                    testScrollToPosition();
                });

                it('should set the scrollbar scale when the scale changes', function() {
                    testScaleChanged();
                });

                it('should set the scroller size when the scale changes', function() {
                    testResizedOnScaleChanged();
                });

                it('should move the scroller to the top on transform', function() {
                    testMoveOnScrollToUpperLeft();
                });

                it('should move the scroller to the bottom on transform', function() {
                    testMoveOnScrollToLowerRight();
                });
            });

            describe('in peek mode', function() {
                beforeEach(function() {
                    initialize('vertical', 'peek');
                });

                afterEach(function() {
                    cleanup();
                });

                it('should scroll when the scroller is moved', function() {
                    testScrollToPosition();
                });

                it('should set the scrollbar scale when the scale changes', function() {
                    testScaleChanged();
                });

                it('should set the scroller size when the scale changes', function() {
                    testResizedOnScaleChanged();
                });

                it('should move the scroller to the top on transform', function() {
                    testMoveOnScrollToUpperLeft();
                });

                it('should move the scroller to the bottom on transform', function() {
                    testMoveOnScrollToLowerRight();
                });

                it('should hide the scrollbar when all content visible', function() {
                    testHideOnShortContent();
                });
            });

            describe('in single mode', function() {
                beforeEach(function() {
                    initialize('vertical', 'single');
                });

                afterEach(function() {
                    cleanup();
                });

                it('should scroll when the scroller is moved', function() {
                    testScrollToPosition();
                });

                it('should set the scrollbar scale when the scale changes', function() {
                    testScaleChanged();
                });

                it('should set the scroller size when the scale changes', function() {
                    testResizedOnScaleChanged();
                });

                it('should move the scroller to the top on transform', function() {
                    testMoveOnScrollToUpperLeft();
                });

                it('should move the scroller to the bottom on transform', function() {
                    testMoveOnScrollToLowerRight();
                });

                it('should hide the scrollbar when all content visible', function() {
                    testHideOnShortContent();
                });
            });
        });

        describe('when horizontal', function() {
            describe('in flow mode', function() {
                beforeEach(function() {
                    initialize('horizontal', 'flow');
                });

                afterEach(function() {
                    cleanup();
                });

                it('should scroll when the scroller is moved', function() {
                    testScrollToPosition();
                });

                it('should set the scrollbar scale when the scale changes', function() {
                    testScaleChanged();
                });

                it('should set the scroller size when the scale changes', function() {
                    testResizedOnScaleChanged();
                });

                it('should move the scroller to the left on transform', function() {
                    testMoveOnScrollToUpperLeft();
                });

                it('should move the scroller to the right on transform', function() {
                    testMoveOnScrollToLowerRight();
                });

                it('should hide the scrollbar when all content visible', function() {
                    testHideOnShortContent();
                });
            });

            describe('in peek mode', function() {
                beforeEach(function() {
                    initialize('horizontal', 'peek');
                });

                afterEach(function() {
                    cleanup();
                });

                it('should scroll when the scroller is moved', function() {
                    testScrollToPosition();
                });

                it('should set the scrollbar scale when the scale changes', function() {
                    testScaleChanged();
                });

                it('should set the scroller size when the scale changes', function() {
                    testResizedOnScaleChanged();
                });

                it('should move the scroller to the left on transform', function() {
                    testMoveOnScrollToUpperLeft();
                });

                it('should move the scroller to the right on transform', function() {
                    testMoveOnScrollToLowerRight();
                });

                it('should hide the scrollbar when all content visible', function() {
                    testHideOnShortContent();
                });
            });

            describe('in single mode', function() {
                beforeEach(function() {
                    initialize('horizontal', 'single');
                });

                afterEach(function() {
                    cleanup();
                });

                it('should scroll when the scroller is moved', function() {
                    testScrollToPosition();
                });

                it('should set the scrollbar scale when the scale changes', function() {
                    testScaleChanged();
                });

                it('should set the scroller size when the scale changes', function() {
                    testResizedOnScaleChanged();
                });

                it('should move the scroller to the left on transform', function() {
                    testMoveOnScrollToUpperLeft();
                });

                it('should move the scroller to the right on transform', function() {
                    testMoveOnScrollToLowerRight();
                });

                it('should hide the scrollbar when all content visible', function() {
                    testHideOnShortContent();
                });
            });
        });

        describe('refreshing', function() {
            beforeEach(function() {
                initialize('vertical' /* doesn't matter for this suite */);
            });
            afterEach(function() {
                cleanup();
            });
            it('cache the current dimensions calculations', function() {
                spyOn(scrollBar, '_cacheDimensions');
                scrollBar.refresh();
                expect(scrollBar._cacheDimensions).toHaveBeenCalled();
            });
            it('should place the scroller', function() {
                spyOn(scrollBar, '_placeScroller');
                scrollBar.refresh();
                expect(scrollBar._placeScroller).toHaveBeenCalled();
            });
        });
    });
});
