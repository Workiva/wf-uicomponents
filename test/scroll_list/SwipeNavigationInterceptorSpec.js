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

    var AwesomeMap = require('wf-js-uicomponents/awesome_map/AwesomeMap');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var SwipeNavigationInterceptor = require('wf-js-uicomponents/scroll_list/SwipeNavigationInterceptor');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');

    function createSwipeEvent(direction) {
        function createGesture() {
            return new Gesture({ direction: direction });
        }

        return new InteractionEvent(EventTypes.SWIPE, createGesture(), createGesture());
    }

    describe('SwipeNavigationInterceptor', function() {

        var map = AwesomeMap.prototype;
        var scrollList = ScrollList.prototype;

        var viewportDimensions;
        var itemDimensions;
        var itemState;
        var interceptor;

        beforeEach(function() {
            map.onInteraction = function() {};

            viewportDimensions = { height: 100 };
            itemDimensions = { height: 100 };
            itemState = new TransformState();
            var itemSizeCollection = Object.create(ItemSizeCollection.prototype);

            spyOn(itemSizeCollection, 'getLength').andReturn(3);
            spyOn(scrollList, 'getItemSizeCollection').andReturn(itemSizeCollection);
            spyOn(scrollList, 'getCurrentItemMap').andReturn(map);
            spyOn(map, 'getViewportDimensions').andReturn(viewportDimensions);
            spyOn(map, 'getContentDimensions').andReturn(itemDimensions);
            spyOn(map, 'getCurrentTransformState').andReturn(itemState);

            interceptor = new SwipeNavigationInterceptor(scrollList);
            interceptor.register(map);
        });

        it('should require a scroll list in the ctor', function() {
            var ctor = function() {
                return new SwipeNavigationInterceptor();
            };

            expect(ctor).toThrow('SwipeNavigationInterceptor configuration: scrollList is required.');
        });

        it('should be mixed with InterceptorMixin', function() {
            expect(interceptor.dispose).toBeDefined();
            expect(interceptor.register).toBeDefined();
        });

        describe('when intercepting', function() {

            it('should ignore swipes "up" for last item in the list', function() {
                var evt = createSwipeEvent('up');
                var result;

                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 2 });
                spyOn(scrollList, 'scrollToItem');

                result = interceptor.handleInteraction(null, { event: evt });

                expect(scrollList.scrollToItem).not.toHaveBeenCalled();
                expect(result).toBeUndefined();
            });

            it('should ignore swipes "down" for first item in the list', function() {
                var evt = createSwipeEvent('down');
                var result;

                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 0 });
                spyOn(scrollList, 'scrollToItem');

                result = interceptor.handleInteraction(null, { event: evt });

                expect(scrollList.scrollToItem).not.toHaveBeenCalled();
                expect(result).toBeUndefined();
            });

            it('should ignore swipes "up" when the item is overflowing the viewport bottom', function() {
                var evt = createSwipeEvent('up');
                var result;

                itemDimensions.height = 200;

                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 0 });
                spyOn(scrollList, 'scrollToItem');

                result = interceptor.handleInteraction(null, { event: evt });

                expect(scrollList.scrollToItem).not.toHaveBeenCalled();
                expect(result).toBeUndefined();
            });

            it('should ignore swipes "down" when the item is overflowing the viewport top', function() {
                var evt = createSwipeEvent('down');
                var result;

                itemDimensions.height = 200;
                itemState.translateY = -100;

                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 2 });
                spyOn(scrollList, 'scrollToItem');

                result = interceptor.handleInteraction(null, { event: evt });

                expect(scrollList.scrollToItem).not.toHaveBeenCalled();
                expect(result).toBeUndefined();
            });

            it('should initiate a jump to the next item when swiping "up"', function() {
                var evt = createSwipeEvent('up');
                var result;

                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 0 });
                spyOn(scrollList, 'scrollToItem');

                result = interceptor.handleInteraction(null, { event: evt });

                expect(scrollList.scrollToItem).toHaveBeenCalledWith({ index: 1 });
                expect(result).toBe(false);
            });

            it('should initiate a jump to the previous item when swiping "down"', function() {
                var evt = createSwipeEvent('down');
                var result;

                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 2 });
                spyOn(scrollList, 'scrollToItem');

                result = interceptor.handleInteraction(null, { event: evt });

                expect(scrollList.scrollToItem).toHaveBeenCalledWith({ index: 1 });
                expect(result).toBe(false);
            });

            it('should only handle swipe events', function() {
                var property, eventType, evt, result;

                spyOn(scrollList, 'scrollToItem');

                for (property in EventTypes) {
                    if (EventTypes.hasOwnProperty(property)) {
                        eventType = EventTypes[property];
                        if (eventType !== EventTypes.SWIPE) {
                            evt = new InteractionEvent(eventType, new Gesture(), new Gesture());
                            result = interceptor.handleInteraction(null, { event: evt });

                            expect(result).toBeUndefined();
                            expect(scrollList.scrollToItem).not.toHaveBeenCalled();
                        }
                    }
                }
            });
        });
    });
});
