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

    var _ = require('lodash');
    var AwesomeMap = require('wf-js-uicomponents/awesome_map/AwesomeMap');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var MouseWheelNavigationInterceptor = require('wf-js-uicomponents/scroll_list/MouseWheelNavigationInterceptor');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');

    function createEvent(type, gestureTemplate) {
        var gesture = new Gesture(gestureTemplate);
        return new InteractionEvent(type, gesture, gesture);
    }

    describe('MouseWheelNavigationInterceptor', function() {

        var viewportDimensions;
        var listDimensions;
        var itemDimensions;

        var scrollList = ScrollList.prototype;
        var listMap = _.extend({}, AwesomeMap.prototype);
        var itemMap = _.extend({}, AwesomeMap.prototype);
        var interceptor;

        beforeEach(function() {
            listMap.onInteraction = function() {};

            viewportDimensions = { height: 200 };
            listDimensions = { height: 1000 };
            itemDimensions = { height: 200 };

            interceptor = new MouseWheelNavigationInterceptor(scrollList);
            interceptor.register(listMap);

            spyOn(scrollList, 'getCurrentItemMap').andReturn(itemMap);
            spyOn(listMap, 'getContentDimensions').andReturn(listDimensions);
            spyOn(listMap, 'getViewportDimensions').andReturn(viewportDimensions);
            spyOn(itemMap, 'getContentDimensions').andReturn(itemDimensions);
        });

        it('should be mixed with InterceptorMixin', function() {
            expect(interceptor.dispose).toBeDefined();
            expect(interceptor.register).toBeDefined();
        });

        describe('when intercepting', function() {

            it('should jump to previous item on wheels down when item top is visible', function() {
                var evt = createEvent(EventTypes.MOUSE_WHEEL, { deltaY: 10 });
                var itemState = new TransformState({ translateY: 0 });
                var result;

                spyOn(scrollList, 'scrollToItem');
                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 1 });
                spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                result = interceptor.handleInteraction(null, { event: evt });

                expect(result).toBe(false);
                expect(scrollList.scrollToItem).toHaveBeenCalledWith({ index: 0, duration: 0 });
            });

            it('should jump to next item on wheels up when item bottom is visible', function() {
                var evt = createEvent(EventTypes.MOUSE_WHEEL, { deltaY: -10 });
                var itemState = new TransformState({ translateY: -200 });
                var result;

                viewportDimensions.height = 200;
                itemDimensions.height = 400;

                spyOn(scrollList, 'scrollToItem');
                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 0 });
                spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                result = interceptor.handleInteraction(null, { event: evt });

                expect(result).toBe(false);
                expect(scrollList.scrollToItem).toHaveBeenCalledWith({ index: 1, duration: 0 });
            });

            it('should ignore on wheels down when item top is not visible', function() {
                var evt = createEvent(EventTypes.MOUSE_WHEEL, { deltaY: 10 });
                var itemState = new TransformState({ translateY: -100 });
                var result;

                spyOn(scrollList, 'scrollToItem');
                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 0});
                spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                result = interceptor.handleInteraction(null, { event: evt });

                expect(result).not.toBe(false);
                expect(scrollList.scrollToItem).not.toHaveBeenCalled();
            });

            it('should ignore on wheels up when item bottom is not visible', function() {
                var evt = createEvent(EventTypes.MOUSE_WHEEL, { deltaY: -10 });
                var itemState = new TransformState({ translateY: 0 });
                var result;

                viewportDimensions.height = 200;
                itemDimensions.height = 400;

                spyOn(scrollList, 'scrollToItem');
                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 0});
                spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                result = interceptor.handleInteraction(null, { event: evt });

                expect(result).not.toBe(false);
                expect(scrollList.scrollToItem).not.toHaveBeenCalled();
            });

            it('should ignore wheels down immediately after scrolling overflowing item to top', function() {
                var evt = createEvent(EventTypes.MOUSE_WHEEL, { deltaY: 10 });
                var itemState = new TransformState({ translateY: -10 });

                spyOn(scrollList, 'scrollToItem');
                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 0});
                spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                runs(function() {
                    expect(interceptor.handleInteraction(null, { event: evt })).not.toBe(false);

                    itemState.translateY = 0;
                    expect(interceptor.handleInteraction(null, { event: evt })).toBe(false);

                    expect(scrollList.scrollToItem.calls.length).toBe(0);
                });

                waits(100);

                runs(function() {
                    expect(interceptor.handleInteraction(null, { event: evt })).toBe(false);
                    expect(scrollList.scrollToItem.calls.length).toBe(1);
                });
            });

            it('should ignore wheels up immediately after scrolling overflowing item to bottom', function() {
                var evt = createEvent(EventTypes.MOUSE_WHEEL, { deltaY: -10 });
                var itemState = new TransformState({ translateY: -190 });

                viewportDimensions.height = 200;
                itemDimensions.height = 400;

                spyOn(scrollList, 'scrollToItem');
                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 0});
                spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                runs(function() {
                    expect(interceptor.handleInteraction(null, { event: evt })).not.toBe(false);

                    itemState.translateY = -200;
                    expect(interceptor.handleInteraction(null, { event: evt })).toBe(false);

                    expect(scrollList.scrollToItem.calls.length).toBe(0);
                });

                waits(100);

                runs(function() {
                    expect(interceptor.handleInteraction(null, { event: evt })).toBe(false);
                    expect(scrollList.scrollToItem.calls.length).toBe(1);
                });
            });

            it('should ignore wheels immediately after jump', function() {
                var evt = createEvent(EventTypes.MOUSE_WHEEL, { deltaY: -10 });
                var itemState = new TransformState();

                spyOn(scrollList, 'scrollToItem');
                spyOn(scrollList, 'getCurrentItem').andReturn({ index: 0});
                spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                runs(function() {
                    interceptor.handleInteraction(null, { event: evt });
                    interceptor.handleInteraction(null, { event: evt });
                    interceptor.handleInteraction(null, { event: evt });
                    interceptor.handleInteraction(null, { event: evt });
                    interceptor.handleInteraction(null, { event: evt });
                    interceptor.handleInteraction(null, { event: evt });

                    expect(scrollList.scrollToItem.calls.length).toBe(1);
                });

                waits(100);

                runs(function() {
                    interceptor.handleInteraction(null, { event: evt });

                    expect(scrollList.scrollToItem.calls.length).toBe(2);
                });
            });

            it('should ignore all non-mousewheel events', function() {
                var property;
                var type;
                var evt;
                var result;

                for (property in EventTypes) {
                    if (EventTypes.hasOwnProperty(property)) {
                        type = EventTypes[property];
                        if (type !== EventTypes.MOUSE_WHEEL) {
                            evt = createEvent(type);
                            result = interceptor.handleInteraction(null, { event: evt });

                            expect(result).not.toBe(false);
                        }
                    }
                }
            });
        });
    });
});
