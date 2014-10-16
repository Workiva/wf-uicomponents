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
    var _ = require('lodash');
    var AwesomeMap = require('wf-js-uicomponents/awesome_map/AwesomeMap');
    var DOMUtil = require('wf-js-common/DOMUtil');
    var EventSynthesizer = require('wf-js-uicomponents/awesome_map/EventSynthesizer');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var InterceptorMixin = require('wf-js-uicomponents/awesome_map/InterceptorMixin');
    var InteractionSimulator = require('wf-js-uicomponents/awesome_map/InteractionSimulator');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');
    var TransformationQueue = require('wf-js-uicomponents/awesome_map/TransformationQueue');
    var TransformUtil = require('wf-js-uicomponents/awesome_map/TransformUtil');

    describe('AwesomeMap', function() {
        var awesomeMap;
        var $host = $('<div>');
        var configuration = { host: $host[0] };

        function FakeInterceptor() {}
        function FakeInterceptor2() {}
        _.assign(FakeInterceptor.prototype, InterceptorMixin);
        _.assign(FakeInterceptor2.prototype, InterceptorMixin);

        beforeEach(function() {
            spyOn(TransformUtil, 'clearTransformationOrigin');

            $host.empty().css({ position: 'absolute', top: -10000, width: 500, height: 500 }).appendTo('body');

            awesomeMap = new AwesomeMap($host[0]);
        });

        afterEach(function() {
            $host.remove();
            awesomeMap.dispose();
        });

        describe('construction', function() {

            it('should require specifying a host element', function() {
                var constructor = function() {
                    return new AwesomeMap();
                };
                expect(constructor).toThrow('AwesomeMap configuration: host is required.');
            });

            it('should require the host element to be in the DOM', function() {
                var ctor = function() {
                    return new AwesomeMap($('<div>')[0]);
                };
                expect(ctor).toThrow('AwesomeMap configuration: host is not in the DOM.');
            });

            it('should require the host element to have a width', function() {
                var ctor = function() {
                    return new AwesomeMap($host[0]);
                };

                $host.css({ width: 0 });
                expect(ctor).toThrow('AwesomeMap configuration: host does not have any size.');
            });

            it('should require the host element to have a height', function() {
                var ctor = function() {
                    return new AwesomeMap($host[0]);
                };

                $host.css({ height: 0 });
                expect(ctor).toThrow('AwesomeMap configuration: host does not have any size.');
            });

            it('should initialize HTML elements', function() {
                var host = awesomeMap._host;
                var viewport = awesomeMap._viewport;
                var transformationPlane = awesomeMap._transformationPlane;
                var hostChildren;
                var viewportChildren;

                function testElementStyle(element) {
                    expect(element).not.toBeNull();
                    expect(element.style.position).toBe('absolute');
                    expect(element.style.top).toBe('0px');
                    expect(element.style.bottom).toBe('0px');
                    expect(element.style.left).toBe('0px');
                    expect(element.style.right).toBe('0px');
                }

                // Expecting:
                // - the host is the configured host;
                // - the viewport, transformation plane and hit area are created;
                // - the viewport, transformation plane and hit area have host relative position and dimensions;
                // - the host contains the viewport; and,
                // - the viewport contains the transformation plane and hit area.

                expect(host).toBe(configuration.host);

                testElementStyle(viewport);
                expect(viewport.style.overflow).toBe('hidden');

                expect(transformationPlane).not.toBeNull();
                expect(transformationPlane.style.position).toBe('absolute');
                expect(transformationPlane.style.top).toBe('');
                expect(transformationPlane.style.bottom).toBe('');
                expect(transformationPlane.style.left).toBe('');
                expect(transformationPlane.style.right).toBe('');
                expect(TransformUtil.clearTransformationOrigin).toHaveBeenCalledWith(transformationPlane);

                hostChildren = host.childNodes;
                expect(hostChildren.length).toBe(1);
                expect(hostChildren[0]).toBe(viewport);

                viewportChildren = viewport.childNodes;
                expect(viewportChildren.length).toBe(1);
                expect(viewportChildren[0]).toBe(transformationPlane);
            });

            it('should initialize the current transform state', function() {
                expect(awesomeMap._currentTransformState).not.toBeNull();
                expect(new TransformState().equals(awesomeMap._currentTransformState)).toBe(true);
            });

            it('should initialize the event synthesizer', function() {
                expect(awesomeMap._eventSynthesizer).not.toBeNull();
                expect(awesomeMap._eventSynthesizer instanceof EventSynthesizer).toBeTruthy();
            });

            it('should initialize the interaction simulator', function() {
                expect(awesomeMap._interactionSimulator).not.toBeNull();
                expect(awesomeMap._interactionSimulator instanceof InteractionSimulator).toBeTruthy();
            });

            it('should initialize the transformation queue', function() {
                expect(awesomeMap._transformationQueue).not.toBeNull();
                expect(awesomeMap._transformationQueue instanceof TransformationQueue).toBeTruthy();
            });
        });

        describe('interceptors', function() {
            it('should add interceptors', function() {
                var interceptor = new FakeInterceptor();

                spyOn(interceptor, 'register');
                awesomeMap.addInterceptor(interceptor);

                expect(awesomeMap._interceptors.length).toBe(1);
                expect(awesomeMap._interceptors[0]).toBe(interceptor);
                expect(interceptor.register).toHaveBeenCalled();
            });

            it('should remove interceptors by Type', function() {
                awesomeMap.addInterceptor(new FakeInterceptor());
                awesomeMap.addInterceptor(new FakeInterceptor2());
                awesomeMap.removeInterceptor(FakeInterceptor);

                expect(awesomeMap.getInterceptor(FakeInterceptor)).toBeNull();
                expect(awesomeMap.getInterceptor(FakeInterceptor2)).not.toBeNull();
            });
        });

        describe('content', function() {
            function createContent(width, height) {
                return $('<div>').css({
                    width: width || 400,
                    height: height || 600
                })[0];
            }

            //---------------------------------------------------------
            // These cases are well-tested because if these assertions fail
            // we will likely have screen flickering in mobile WebKit
            // when adding/panning content very quickly.
            //---------------------------------------------------------

            describe('when appending content', function() {

                it('should append content to the transformation plane', function() {
                    var content = createContent();
                    var transformationPlaneChildren;

                    awesomeMap.appendContent(content);

                    transformationPlaneChildren = awesomeMap._transformationPlane.childNodes;
                    expect(transformationPlaneChildren.length).toBe(1);
                    expect(transformationPlaneChildren[0]).toBe(content);
                });

                it('should invalidate the content dimensions', function() {
                    var content = createContent();
                    var contentDimensions = awesomeMap.getContentDimensions();

                    expect(contentDimensions.width).toBe(0);
                    expect(contentDimensions.height).toBe(0);

                    awesomeMap.appendContent(content);

                    contentDimensions = awesomeMap.getContentDimensions();

                    expect(contentDimensions.width).toBe(parseInt(content.style.width, 10));
                    expect(contentDimensions.height).toBe(parseInt(content.style.height, 10));
                });
            });

            describe('when clearing content', function() {

                it('should clear all content from the transformation plane', function() {
                    var transformationPlane = awesomeMap.getTransformationPlane();

                    awesomeMap.appendContent(createContent());
                    awesomeMap.appendContent(createContent());
                    expect(transformationPlane.childNodes.length).toBe(2);

                    awesomeMap.clearContent();

                    expect(transformationPlane.childNodes.length).toBe(0);
                });

                it('should invalidate the content dimensions', function() {
                    var content = createContent();
                    var contentDimensions;

                    awesomeMap.appendContent(content);
                    awesomeMap.clearContent(content);

                    contentDimensions = awesomeMap.getContentDimensions();

                    expect(contentDimensions.width).toBe(0);
                    expect(contentDimensions.height).toBe(0);
                });
            });

            describe('when removing content', function() {

                it('should remove content from the transformation plane', function() {
                    var transformationPlane = awesomeMap.getTransformationPlane();

                    awesomeMap.appendContent(createContent());
                    awesomeMap.clearContent();

                    expect(transformationPlane.childNodes.length).toBe(0);
                });

                it('should invalidate the content dimensions', function() {
                    var content = createContent();
                    var contentDimensions;

                    awesomeMap.appendContent(content);
                    awesomeMap.removeContent(content);

                    contentDimensions = awesomeMap.getContentDimensions();

                    expect(contentDimensions.width).toBe(0);
                    expect(contentDimensions.height).toBe(0);
                });
            });

            it('should get total content dimensions', function() {
                // TODO: Test borders/margin/padding too.
                var content1 = createContent(200, 500);
                var content2 = createContent(300, 700);
                var contentDimensions;

                awesomeMap.appendContent(content1);
                awesomeMap.appendContent(content2);
                contentDimensions = awesomeMap.getContentDimensions();

                expect(contentDimensions.width).toBe(300);
                expect(contentDimensions.height).toBe(1200);
            });

            it('should get custom content dimensions if set', function() {
                var content1 = createContent(200, 500);
                var content2 = createContent(300, 700);
                var customDimensions = { width: 42000, height: 31000 };
                var contentDimensions;

                awesomeMap.appendContent(content1);
                awesomeMap.setContentDimensions(customDimensions);
                awesomeMap.appendContent(content2);
                contentDimensions = awesomeMap.getContentDimensions();

                expect(contentDimensions.width).toBe(customDimensions.width);
                expect(contentDimensions.height).toBe(customDimensions.height);
            });
        });

        describe('properties', function() {

            it('should get the current transform state', function() {
                var state = awesomeMap.getCurrentTransformState();

                expect(state).toBe(awesomeMap._currentTransformState);
            });

            it('should get the current scale', function() {
                var scale;

                awesomeMap.transform({ scale: 2 });
                scale = awesomeMap.getScale();

                expect(scale).toBe(2);
            });

            it('should get the current translation', function() {
                var position;

                awesomeMap.transform({ x: -100, y: -200 });
                position = awesomeMap.getTranslation();

                expect(position.x).toBe(-100);
                expect(position.y).toBe(-200);
            });

            it('should get the host element', function() {
                var host = awesomeMap.getHost();

                expect(host).toBe(awesomeMap._host);
            });

            it('should get whether the map is enabled', function() {
                expect(awesomeMap.isDisabled()).toBe(false);

                awesomeMap.disable();
                expect(awesomeMap.isDisabled()).toBe(true);

                awesomeMap.enable();
                expect(awesomeMap.isDisabled()).toBe(false);
            });

            describe('getting the viewport dimensions', function() {
                it('should make the host measure ready', function() {
                    spyOn(DOMUtil, 'makeMeasureReady');
                    awesomeMap.getViewportDimensions();
                    expect(DOMUtil.makeMeasureReady).toHaveBeenCalled();
                });
            });

            describe('setting current transform state', function() {

                it('should set the current transform state', function() {
                    var state = new TransformState({
                        scale: 2,
                        translateX: 100,
                        translateY: 200
                    });
                    awesomeMap.setCurrentTransformState(state);

                    expect(awesomeMap.getCurrentTransformState()).toEqual(state);
                });

                it('should dispatch "onScaleChanged" if scale changed', function() {
                    var state = new TransformState({ scale: 2 });
                    spyOn(awesomeMap.onScaleChanged, 'dispatch');

                    awesomeMap.setCurrentTransformState(state);

                    expect(awesomeMap.onScaleChanged.dispatch)
                        .toHaveBeenCalledWith([awesomeMap, { scale: 2 }]);
                });

                it('should dispatch "onTranslationChanged" if translation changed', function() {
                    var state = new TransformState({ translateX: 100, translateY: 200 });
                    spyOn(awesomeMap.onTranslationChanged, 'dispatch');

                    awesomeMap.setCurrentTransformState(state);

                    expect(awesomeMap.onTranslationChanged.dispatch)
                        .toHaveBeenCalledWith([awesomeMap, { x: 100, y: 200 }]);
                });
            });
        });

        describe('viewport', function() {
            it('should get viewport dimensions', function() {
                var dimensions = awesomeMap.getViewportDimensions();

                expect(dimensions.width).toBe(500);
                expect(dimensions.height).toBe(500);
            });
        });

        describe('disabling', function() {

            it('should cause map to ignore direct user interaction', function() {
                var gesture = new Gesture();
                var evt = new InteractionEvent({ simulated: false }, gesture, gesture);

                spyOn(awesomeMap._transformationQueue, 'enqueue');

                awesomeMap.disable();
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(awesomeMap._transformationQueue.enqueue).not.toHaveBeenCalled();
            });
        });

        describe('enabling', function() {

            it('should cause map to respond to direct user interaction', function() {
                var gesture = new Gesture();
                var evt = new InteractionEvent({ simulated: false }, gesture, gesture);

                spyOn(awesomeMap._transformationQueue, 'enqueue');

                awesomeMap.disable();
                awesomeMap.enable();
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(awesomeMap._transformationQueue.enqueue).toHaveBeenCalled();
            });
        });

        describe('setting touchScrollingEnabled to false', function() {
            var args = {};

            beforeEach(function() {
                awesomeMap = new AwesomeMap($host[0], { touchScrollingEnabled: false });
                var gesture = new Gesture();
                args.event = new InteractionEvent({ simulated: false }, gesture, gesture);

                spyOn(awesomeMap._transformationQueue, 'enqueue');
            });

            it('should not respond to drag events', function() {
                args.event.type = EventTypes.DRAG;
                awesomeMap.handleInteractionEvent(null, args);
                expect(awesomeMap._transformationQueue.enqueue).not.toHaveBeenCalled();
            });

            it('should not respond to swipe events', function() {
                args.event.type = EventTypes.SWIPE;
                awesomeMap.handleInteractionEvent(null, args);
                expect(awesomeMap._transformationQueue.enqueue).not.toHaveBeenCalled();
            });

            it('should not respond to dragstart events', function() {
                args.event.type = EventTypes.DRAG_START;
                awesomeMap.handleInteractionEvent(null, args);
                expect(awesomeMap._transformationQueue.enqueue).not.toHaveBeenCalled();
            });

            it('should not respond to dragend events', function() {
                args.event.type = EventTypes.DRAG_END;
                awesomeMap.handleInteractionEvent(null, args);
                expect(awesomeMap._transformationQueue.enqueue).not.toHaveBeenCalled();
            });
        });

        describe('panning', function() {
            it('should pan by relative distance', function() {
                var finished = false;
                var done = function() { finished = true; };

                runs(function() {
                    awesomeMap.panBy({ x: 100, y: 200, duration: 0, done: done });
                });

                waitsFor(function() { return finished; }, 250);

                runs(function() {
                    var state = awesomeMap.getCurrentTransformState();
                    expect(state.translateX).toBe(100);
                    expect(state.translateY).toBe(200);
                });
            });

            it('should pan to a position', function() {
                var finished = false;
                var done = function() { finished = true; };

                runs(function() {
                    awesomeMap.panTo({ x: 50, y: 75, duration: 0, done: done });
                });

                waitsFor(function() { return finished; }, 250);

                runs(function() {
                    var state = awesomeMap.getCurrentTransformState();
                    expect(state.translateX).toBe(50);
                    expect(state.translateY).toBe(75);
                });
            });
        });

        describe('swiping', function() {

            it('should simulate a swipe', function() {
                var done = function() {};
                var options = { direction: 'up', velocity: 1, duration: 1000, done: done };

                spyOn(awesomeMap._interactionSimulator, 'simulateSwipe');

                awesomeMap.swipe(options);

                expect(awesomeMap._interactionSimulator.simulateSwipe).toHaveBeenCalledWith(options);
            });
        });

        describe('transforming', function() {

            it('should apply a transform directly', function() {
                runs(function() {
                    var target = awesomeMap.getTransformationPlane();
                    var options = { x: -10, y: -20, scale: 2 };

                    spyOn(TransformUtil, 'applyTransform');
                    awesomeMap.transform(options);

                    expect(TransformUtil.applyTransform).toHaveBeenCalled();
                    var call = TransformUtil.applyTransform.calls[0];
                    var appliedTarget = call.args[0];
                    expect(appliedTarget).toBe(target);
                    var appliedState = call.args[1];
                    expect(appliedState.translateX).toBe(options.x);
                    expect(appliedState.translateY).toBe(options.y);
                    expect(appliedState.scale).toBe(options.scale);
                });
            });

            it('should set the current transform state', function() {
                spyOn(TransformUtil, 'applyTransform');
                spyOn(awesomeMap, 'setCurrentTransformState');

                var options = { x: -10, y: -20, scale: 2 };
                awesomeMap.transform(options);

                expect(awesomeMap.setCurrentTransformState).toHaveBeenCalled();
                var appliedState = awesomeMap.setCurrentTransformState.calls[0].args[0];
                expect(appliedState.translateX).toBe(options.x);
                expect(appliedState.translateY).toBe(options.y);
                expect(appliedState.scale).toBe(options.scale);
            });
        });

        describe('zooming', function() {

            it('should zoom by relative scale', function() {
                var finished = false;
                var done =  function() { finished = true; };

                runs(function() {
                    awesomeMap.zoomBy({ scale: 2, duration: 0, done: done });
                });

                waitsFor(function() { return finished; }, 250);

                runs(function() {
                    var state = awesomeMap.getCurrentTransformState();
                    expect(state.scale).toBe(2);
                });
            });

            it('should zoom to a scale', function() {
                var finished = false;
                var done = function() { finished = true; };

                runs(function() {
                    awesomeMap.zoomTo({ scale: 1.5, duration: 0, done: done });
                });

                waitsFor(function() { return finished; }, 250);

                runs(function() {
                    var state = awesomeMap.getCurrentTransformState();
                    expect(state.scale).toBe(1.5);
                });
            });
        });

        describe('handling interaction events', function() {

            function createInteractionEvent(eventType) {
                return new InteractionEvent(eventType, new Gesture(), new Gesture());
            }

            it('should not handle an event if an onInteraction subscriber returns false', function() {
                var evt = createInteractionEvent(EventTypes.RESIZE);

                spyOn(awesomeMap._transformationQueue, 'enqueue');
                spyOn(awesomeMap._transformationQueue, 'processEvents');
                awesomeMap.onInteraction(function() { return false; });
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(evt.cancelled).toBe(true);
                expect(awesomeMap._transformationQueue.enqueue).not.toHaveBeenCalled();
                expect(awesomeMap._transformationQueue.processEvents).not.toHaveBeenCalled();
            });

            it('should cancel the current transformation on touch and set the current state', function() {
                var touch = createInteractionEvent(EventTypes.TOUCH);
                var queue = awesomeMap._transformationQueue;
                var cancelledState = new TransformState();

                spyOn(queue, 'cancelCurrentTransformation').andReturn(cancelledState);
                spyOn(awesomeMap, 'setCurrentTransformState');
                awesomeMap.handleInteractionEvent(null, { event: touch });

                expect(queue.cancelCurrentTransformation).toHaveBeenCalled();
                expect(awesomeMap.setCurrentTransformState).toHaveBeenCalledWith(cancelledState);
            });

            it('should dispatch "onInteractionStarted" observable on mouse wheel start events', function() {
                var evt = createInteractionEvent(EventTypes.MOUSE_WHEEL_START);

                spyOn(awesomeMap.onInteractionStarted, 'dispatch');
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(awesomeMap.onInteractionStarted.dispatch).toHaveBeenCalledWith([awesomeMap]);
            });

            it('should dispatch "onInteractionStarted" observable on touch events', function() {
                var evt = createInteractionEvent(EventTypes.TOUCH);

                spyOn(awesomeMap.onInteractionStarted, 'dispatch');
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(awesomeMap.onInteractionStarted.dispatch).toHaveBeenCalledWith([awesomeMap]);
            });

            it('should not dispatch "onInteractionStarted" observable on touch events that interrupt transformations', function() {
                var evt = createInteractionEvent(EventTypes.TOUCH);
                var queue = awesomeMap._transformationQueue;
                var cancelledState = new TransformState();

                spyOn(queue, 'cancelCurrentTransformation').andReturn(cancelledState);
                spyOn(awesomeMap.onInteractionStarted, 'dispatch');
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(awesomeMap.onInteractionStarted.dispatch).not.toHaveBeenCalledWith([awesomeMap]);
            });

            it('should invalidate viewport dimensions on resize', function() {
                var evt = createInteractionEvent(EventTypes.RESIZE);
                var viewportDimensions = awesomeMap.getViewportDimensions();

                // Resize the element, should still have stale values
                // (haven't yet handled resize event)
                $host.css({ width: 1000, height: 1000 });
                expect(viewportDimensions.width).toBe(500);
                expect(viewportDimensions.height).toBe(500);

                // Now handle the resize event, which should invalidate the viewport dimensions.
                awesomeMap.handleInteractionEvent(null, { event: evt });
                viewportDimensions = awesomeMap.getViewportDimensions();
                expect(viewportDimensions.width).toBe(1000);
                expect(viewportDimensions.height).toBe(1000);
            });

            it('should dispatch "onInteraction" observable', function() {
                var callback = function() {};
                var evt = createInteractionEvent(null);
                var transformState = new TransformState();

                spyOn(awesomeMap.onInteraction, 'dispatch');
                spyOn(awesomeMap, 'getCurrentTransformState').andReturn(transformState);
                awesomeMap.onInteraction(callback);
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(awesomeMap.onInteraction.dispatch).toHaveBeenCalledWith([
                    awesomeMap,
                    { event: evt, currentState: transformState }
                ], jasmine.any(Function));
            });

            it('should set current state to end state of event transformation', function() {
                var evt = createInteractionEvent(EventTypes.Drag);

                spyOn(awesomeMap, 'setCurrentTransformState');
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(awesomeMap.setCurrentTransformState).toHaveBeenCalled();
            });

            it('should apply a 2d transform at the end of the interaction', function() {
                var evt = createInteractionEvent(EventTypes.MOUSE_WHEEL_END);

                spyOn(TransformUtil, 'applyTransform');
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(TransformUtil.applyTransform).toHaveBeenCalledWith(
                    awesomeMap.getTransformationPlane(),
                    awesomeMap.getCurrentTransformState(),
                    true
                );
            });

            it('should dispatch "onInteractionFinished" observable on mouse wheel end events', function() {
                var evt = createInteractionEvent(EventTypes.MOUSE_WHEEL_END);

                spyOn(awesomeMap.onInteractionFinished, 'dispatch');
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(awesomeMap.onInteractionFinished.dispatch).toHaveBeenCalledWith([awesomeMap]);
            });

            it('should dispatch "onInteractionFinished" observable on release events', function() {
                var evt = createInteractionEvent(EventTypes.RELEASE);

                spyOn(awesomeMap.onInteractionFinished, 'dispatch');
                awesomeMap.handleInteractionEvent(null, { event: evt });

                expect(awesomeMap.onInteractionFinished.dispatch).toHaveBeenCalledWith([awesomeMap]);
            });

            it('should dispatch "onInteractionStarted" observable on release events when dispatch is deferred', function() {
                var touch = createInteractionEvent(EventTypes.TOUCH);
                var release = createInteractionEvent(EventTypes.RELEASE);

                spyOn(awesomeMap._transformationQueue, 'cancelCurrentTransformation').andReturn(new TransformState());
                spyOn(awesomeMap.onInteractionStarted, 'dispatch');
                awesomeMap.handleInteractionEvent(null, { event: touch });
                awesomeMap.handleInteractionEvent(null, { event: release });

                expect(awesomeMap.onInteractionStarted.dispatch).toHaveBeenCalledWith([awesomeMap]);
            });
        });
    });
});
