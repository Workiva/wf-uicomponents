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
    var BrowserInfo = require('wf-js-common/BrowserInfo');
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var EventSynthesizer = require('wf-js-uicomponents/awesome_map/EventSynthesizer');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');

    describe('EventSynthesizer', function() {

        var $host;
        var host;
        var synthesizer;
        var handlers;
        var hammer;
        var mouseAdapter;
        var window;
        var createSynthesizer;

        function setup() {
            var dependencies = EventSynthesizer.dependencies;

            hammer = jasmine.createSpyObj('Hammer', ['on', 'off']);
            mouseAdapter = jasmine.createSpyObj('MouseAdapter', ['onMouseWheel', 'onMouseWheelStart', 'onMouseWheelEnd', 'dispose']);
            window = jasmine.createSpyObj('window', ['addEventListener', 'removeEventListener']);

            $host = $('<div>').css({ position: 'absolute', top: -10000, left: -10000 }).appendTo('body');
            host = $host[0];

            spyOn(dependencies, 'getWindow').andReturn(window);
            spyOn(dependencies, 'createHammerInstance').andReturn(hammer);
            spyOn(dependencies, 'createMouseAdapter').andReturn(mouseAdapter);
            spyOn(host, 'addEventListener');
            spyOn(host, 'removeEventListener');

            createSynthesizer = function(options) {
                options = options || {};
                synthesizer = new EventSynthesizer({
                    host: $host[0],
                    cancelMouseWheelEvents: !!options.cancelMouseWheelEvents
                });
                handlers = synthesizer.getEventHandlers();
            };

            createSynthesizer();
        }

        function teardown() {
            $host.remove();
        }

        describe('dependencies', function() {

            describe('when creating a hammer instance', function() {
                /* jshint camelcase:false */
                beforeEach(function() {
                    $host = $('<div>').css({ position: 'absolute', top: -10000, left: -10000 }).appendTo('body');
                    hammer = EventSynthesizer.dependencies.createHammerInstance($host[0]);
                });
                afterEach(function() {
                    $host.remove();
                });
                it('should set hold threshold to 10 pixels', function() {
                    expect(hammer.options.hold_threshold).toBe(10);
                });
                it('should set hold timeout to 250 ms', function() {
                    expect(hammer.options.hold_timeout).toBe(250);
                });
                it('should set transform min scale to 0.05', function() {
                    expect(hammer.options.transform_min_scale).toBe(0.05);
                });
            });
        });

        describe('construction', function() {

            beforeEach(setup);
            afterEach(teardown);

            function expectHammerHandlerRegistration(eventType) {
                var handler = handlers[eventType];

                expect(handler).toBeDefined();
                expect(hammer.on).toHaveBeenCalledWith(eventType, handler);
            }

            it('should require a configuration object', function() {
                var constructor = function() {
                    return new EventSynthesizer();
                };
                expect(constructor).toThrow({
                    message: 'EventSynthesizer configuration is required.'
                });
            });

            it('should require specifying a host element', function() {
                var constructor = function() {
                    return new EventSynthesizer({});
                };
                expect(constructor).toThrow({
                    message: 'EventSynthesizer configuration: host is required.'
                });
            });

            it('should register a contextmenu handler on the host element', function() {
                var handler = handlers[EventTypes.CONTEXT_MENU];

                expect(handler).toBeDefined();
                expect(host.addEventListener).toHaveBeenCalledWith(EventTypes.CONTEXT_MENU, handler);
            });

            it('should register a double tap handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.DOUBLE_TAP);
            });

            it('should register a drag handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.DRAG);
            });

            it('should register a drag end handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.DRAG_END);
            });

            it('should register a drag start handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.DRAG_START);
            });

            it('should register a hold handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.HOLD);
            });

            it('should register a mousemove handler against the host object', function() {
                var handler = handlers[EventTypes.MOUSE_MOVE];

                expect(handler).toBeDefined();
                expect(host.addEventListener).toHaveBeenCalledWith(EventTypes.MOUSE_MOVE, handler);
            });

            it('should register a mouse wheel handler with mouse adapter', function() {
                var handler = handlers[EventTypes.MOUSE_WHEEL];

                expect(handler).toBeDefined();
                expect(mouseAdapter.onMouseWheel).toHaveBeenCalledWith(handler);
            });

            it('should register a mouse wheel start handler with mouse adapter', function() {
                var handler = handlers[EventTypes.MOUSE_WHEEL_START];

                expect(handler).toBeDefined();
                expect(mouseAdapter.onMouseWheelStart).toHaveBeenCalledWith(handler);
            });

            it('should register a mouse wheel end handler with mouse adapter', function() {
                var handler = handlers[EventTypes.MOUSE_WHEEL_END];

                expect(handler).toBeDefined();
                expect(mouseAdapter.onMouseWheelEnd).toHaveBeenCalledWith(handler);
            });

            it('should register a release handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.RELEASE);
            });

            it('should register a resize handler against the window object', function() {
                var handler = handlers[EventTypes.RESIZE];

                expect(handler).toBeDefined();
                expect(window.addEventListener).toHaveBeenCalledWith(EventTypes.RESIZE, handler);
            });

            it('should register a swipe handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.SWIPE);
            });

            it('should register a tap handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.TAP);
            });

            it('should register a touch handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.TOUCH);
            });

            it('should register a transform handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.TRANSFORM);
            });

            it('should register a transform end handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.TRANSFORM_END);
            });

            it('should register a transform start handler with hammer', function() {
                expectHammerHandlerRegistration(EventTypes.TRANSFORM_START);
            });
        });

        describe('cordova accomodations', function() {

            beforeEach(setup);
            afterEach(teardown);

            it('should use orientationChange if Cordova is defined', function() {
                window.cordova = {};
                createSynthesizer();
                expect(synthesizer._resizeEventType).toBe('orientationchange');
                window.cordova = undefined;
            });

            it('should use "resize" if Cordova is not defined', function() {
                createSynthesizer();
                expect(synthesizer._resizeEventType).toBe('resize');
            });
        });

        describe('invalidate', function() {

            beforeEach(setup);
            afterEach(teardown);

            it('should re-measure currentHostRect', function() {
                var result = false;
                var sampleRect = { height: '10px', width: '10px' };
                synthesizer._measureHost = function() {
                    result = true;
                    return sampleRect;
                };
                synthesizer.invalidate();
                expect(result).toBeTruthy();
                expect(synthesizer._currentHostRect).toEqual(sampleRect);
            });
        });

        describe('disposal', function() {

            beforeEach(setup);
            afterEach(teardown);

            it('should dispose the onEventSynthesized observable', function() {
                var onEventSynthesized = synthesizer.onEventSynthesized;

                spyOn(onEventSynthesized, 'dispose');
                synthesizer.dispose();

                expect(onEventSynthesized.dispose).toHaveBeenCalled();
            });

            it('should remove all hammer event handlers', function() {
                var handler;

                synthesizer.dispose();

                for (var type in handlers) {
                    if (!/contextmenu|mouse|resize/.test(type)) {
                        handler = handlers[type];
                        expect(hammer.off).toHaveBeenCalledWith(type, handler);
                    }
                }
            });

            it('should remove the host mousemove handler', function() {
                var handler = handlers[EventTypes.MOUSE_MOVE];
                synthesizer.dispose();
                expect(host.removeEventListener).toHaveBeenCalledWith('mousemove', handler, false);
            });

            it('should remove the host contextmenu handler', function() {
                var handler = handlers[EventTypes.CONTEXT_MENU];
                synthesizer.dispose();
                expect(host.removeEventListener).toHaveBeenCalledWith('contextmenu', handler, false);
            });

            it('should dispose the mouse adapter', function() {
                synthesizer.dispose();

                expect(mouseAdapter.dispose).toHaveBeenCalled();
            });

            it('should remove the window resize handler', function() {
                var handler = handlers[EventTypes.RESIZE];

                synthesizer.dispose();

                expect(window.removeEventListener).toHaveBeenCalledWith('resize', handler, false);
            });

            it('should destroy the instance', function() {
                spyOn(DestroyUtil, 'destroy');
                synthesizer.dispose();

                expect(DestroyUtil.destroy).toHaveBeenCalledWith(synthesizer);
            });
        });

        describe('event handling', function() {

            var dispatchEvent;
            var gesture = {};
            var hammerEvent = { gesture: gesture };

            beforeEach(function() {
                setup();
                spyOn(synthesizer, '_dispatchEvent');
                dispatchEvent = synthesizer._dispatchEvent;
            });
            afterEach(teardown);

            it('should dispatch contextmenu events', function() {
                var eventType = EventTypes.CONTEXT_MENU;
                var event = { pageX: 10, pageY: 20, source: {} };

                handlers[eventType](event);

                expect(dispatchEvent).toHaveBeenCalled();
                expect(dispatchEvent.calls[0].args[0]).toBe(eventType);
                expect(dispatchEvent.calls[0].args[1].center.pageX).toBe(event.pageX);
                expect(dispatchEvent.calls[0].args[1].center.pageY).toBe(event.pageY);
                expect(dispatchEvent.calls[0].args[1].srcEvent).toBe(event.source);
            });

            it('should dispatch double tap events', function() {
                var eventType = EventTypes.DOUBLE_TAP;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch drag events', function() {
                var eventType = EventTypes.DRAG;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch drag end events', function() {
                var eventType = EventTypes.DRAG_END;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch drag start events', function() {
                var eventType = EventTypes.DRAG_START;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch hold events', function() {
                var eventType = EventTypes.HOLD;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch mousemove events', function() {
                var eventType = EventTypes.MOUSE_MOVE;
                var event = { pageX: 10, pageY: 20, source: {} };

                handlers[eventType](event);

                expect(dispatchEvent).toHaveBeenCalled();
                expect(dispatchEvent.calls[0].args[0]).toBe(eventType);
                expect(dispatchEvent.calls[0].args[1].center.pageX).toBe(event.pageX);
                expect(dispatchEvent.calls[0].args[1].center.pageY).toBe(event.pageY);
                expect(dispatchEvent.calls[0].args[1].srcEvent).toBe(event.source);
            });

            it('should not dispatch mousemove events if dragging', function() {
                handlers[EventTypes.DRAG_START]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.MOUSE_MOVE]({});
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.DRAG_END]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(2);

                handlers[EventTypes.MOUSE_MOVE]({});
                expect(dispatchEvent.calls.length).toBe(3);
            });

            it('should not dispatch mousemove events if transforming', function() {
                handlers[EventTypes.TRANSFORM_START]({});
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.MOUSE_MOVE]({});
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.TRANSFORM_END]({});
                expect(dispatchEvent.calls.length).toBe(2);

                handlers[EventTypes.MOUSE_MOVE]({});
                expect(dispatchEvent.calls.length).toBe(3);
            });

            it('should dispatch mouse wheel events', function() {
                var eventType = EventTypes.MOUSE_WHEEL;

                handlers[eventType]({ distance: { x: 3, y: 5 }, source: {} });

                expect(dispatchEvent).toHaveBeenCalled();
                expect(dispatchEvent.calls[0].args[0]).toBe(eventType);
                expect(dispatchEvent.calls[0].args[1].deltaX).toBe(3);
                expect(dispatchEvent.calls[0].args[1].deltaY).toBe(5);
            });

            it('should cancel mouse wheel events if configured', function() {
                var eventType = EventTypes.MOUSE_WHEEL;

                createSynthesizer({ cancelMouseWheelEvents: true });
                spyOn(BrowserInfo.Events, 'cancelEvent');

                handlers[eventType]({ distance: { x: 3, y: 5 }, source: {} });

                expect(BrowserInfo.Events.cancelEvent).toHaveBeenCalled();
            });

            it('should dispatch mouse wheel start events', function() {
                var eventType = EventTypes.MOUSE_WHEEL_START;

                handlers[eventType]({ distance: { x: 0, y: 0 }, source: {} });

                expect(dispatchEvent).toHaveBeenCalled();
                expect(dispatchEvent.calls[0].args[0]).toBe(eventType);
                expect(dispatchEvent.calls[0].args[1].deltaX).toBe(0);
                expect(dispatchEvent.calls[0].args[1].deltaY).toBe(0);
            });

            it('should dispatch mouse wheel end events', function() {
                var eventType = EventTypes.MOUSE_WHEEL_START;

                handlers[eventType]({ distance: { x: 0, y: 0 }, source: {} });

                expect(dispatchEvent).toHaveBeenCalled();
                expect(dispatchEvent.calls[0].args[0]).toBe(eventType);
                expect(dispatchEvent.calls[0].args[1].deltaX).toBe(0);
                expect(dispatchEvent.calls[0].args[1].deltaY).toBe(0);
            });

            it('should dispatch release events', function() {
                var eventType = EventTypes.RELEASE;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch resize events if host is resized', function() {
                var eventType = EventTypes.RESIZE;
                var evt = {};

                $host.css({ width: 100, height: 100 });
                handlers[eventType](evt);

                expect(dispatchEvent).toHaveBeenCalled();
                expect(dispatchEvent.calls[0].args[0]).toBe(eventType);
                expect(dispatchEvent.calls[0].args[1].srcEvent).toBe(evt);
                expect(dispatchEvent.calls[0].args[1].target).toBe($host[0]);
            });

            it('should dispatch resize events if host is resized and not visible', function() {
                var eventType = EventTypes.RESIZE;
                var evt = {};

                $host.css({ width: 100, height: 100, display: 'none' });
                handlers[eventType](evt);

                expect(dispatchEvent).toHaveBeenCalled();
                expect(dispatchEvent.calls[0].args[0]).toBe(eventType);
                expect(dispatchEvent.calls[0].args[1].srcEvent).toBe(evt);
                expect(dispatchEvent.calls[0].args[1].target).toBe($host[0]);
            });

            it('should not dispatch resize events if host is not affected', function() {
                handlers[EventTypes.RESIZE]({});

                expect(dispatchEvent).not.toHaveBeenCalled();
            });

            it('should dispatch swipe events', function() {
                var eventType = EventTypes.SWIPE;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch tap events', function() {
                var eventType = EventTypes.TAP;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch touch events', function() {
                var eventType = EventTypes.TOUCH;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch transform events', function() {
                var eventType = EventTypes.TRANSFORM;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch transform end events', function() {
                var eventType = EventTypes.TRANSFORM_END;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should dispatch transform start events', function() {
                var eventType = EventTypes.TRANSFORM_START;

                handlers[eventType](hammerEvent);

                expect(dispatchEvent).toHaveBeenCalledWith(eventType, gesture);
            });

            it('should defer dispatching drag events if transforming until after transform ends', function() {
                handlers[EventTypes.TRANSFORM_START]({});
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.DRAG_START]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.DRAG]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.DRAG_END]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.TRANSFORM_END]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(5);
                expect(dispatchEvent.calls[1].args[0]).toBe(EventTypes.TRANSFORM_END);
                expect(dispatchEvent.calls[2].args[0]).toBe(EventTypes.DRAG_START);
                expect(dispatchEvent.calls[3].args[0]).toBe(EventTypes.DRAG);
                expect(dispatchEvent.calls[4].args[0]).toBe(EventTypes.DRAG_END);
            });

            it('should defer dispatching swipe events if dragging until after drag ends', function() {
                handlers[EventTypes.DRAG_START]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.SWIPE]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.DRAG_END]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(3);
                expect(dispatchEvent.calls[1].args[0]).toBe(EventTypes.DRAG_END);
                expect(dispatchEvent.calls[2].args[0]).toBe(EventTypes.SWIPE);
            });

            it('should defer dispatching transform events if dragging until after drag ends', function() {
                handlers[EventTypes.DRAG_START]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.TRANSFORM_START]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.TRANSFORM]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.TRANSFORM_END]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(1);

                handlers[EventTypes.DRAG_END]({ gesture: {} });
                expect(dispatchEvent.calls.length).toBe(5);
                expect(dispatchEvent.calls[1].args[0]).toBe(EventTypes.DRAG_END);
                expect(dispatchEvent.calls[2].args[0]).toBe(EventTypes.TRANSFORM_START);
                expect(dispatchEvent.calls[3].args[0]).toBe(EventTypes.TRANSFORM);
                expect(dispatchEvent.calls[4].args[0]).toBe(EventTypes.TRANSFORM_END);
            });
        });

        describe('event dispatching', function() {

            beforeEach(setup);
            afterEach(teardown);

            it('should dispatch an interaction event with cumulative and iterative gestures', function() {
                var host = $host[0];
                var fromHammerGestureCallCount = 0;
                var firstGesture = new Gesture();
                var secondGesture = new Gesture();
                var iterativeGesture = new Gesture();
                var dispatchedEvent;

                function getDispatchedEvent(callIndex) {
                    return synthesizer.onEventSynthesized.dispatch.calls[callIndex].args[0][1].event;
                }

                spyOn(synthesizer.onEventSynthesized, 'dispatch');
                spyOn(Gesture, 'fromHammerGesture').andCallFake(function() {
                    if (fromHammerGestureCallCount++ === 0) {
                        return firstGesture;
                    }
                    return secondGesture;
                });

                // The first event should just pass along the original gesture.

                synthesizer._dispatchEvent('foo', {});

                expect(synthesizer.onEventSynthesized.dispatch)
                    .toHaveBeenCalledWith([synthesizer, { event: jasmine.any(InteractionEvent) }]);

                dispatchedEvent = getDispatchedEvent(0);
                expect(dispatchedEvent.type).toBe('foo');
                expect(dispatchedEvent.cumulativeGesture).toEqual(firstGesture);
                expect(dispatchedEvent.cumulativeGesture.target).toBe(host);
                expect(dispatchedEvent.iterativeGesture).toEqual(firstGesture);
                expect(dispatchedEvent.iterativeGesture.target).toBe(host);

                // The second event should calculate iterative deltas.

                spyOn(secondGesture, 'createIterativeGesture').andReturn(iterativeGesture);
                synthesizer._dispatchEvent('foo', {});

                expect(secondGesture.createIterativeGesture).toHaveBeenCalledWith(firstGesture);
                expect(synthesizer.onEventSynthesized.dispatch.calls.length).toBe(2);

                dispatchedEvent = getDispatchedEvent(1);
                expect(dispatchedEvent.cumulativeGesture).toEqual(secondGesture);
                expect(dispatchedEvent.iterativeGesture).toEqual(iterativeGesture);
            });

            it('should cancel hammer gestures after dispatching', function() {
                var gesture = jasmine.createSpyObj('hammerGesture', ['preventDefault']);

                synthesizer._dispatchEvent('foo', gesture);

                expect(gesture.preventDefault).toHaveBeenCalled();
            });
        });
    });
});
