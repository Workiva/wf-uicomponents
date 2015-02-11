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
    var Transformation = require('wf-js-uicomponents/awesome_map/Transformation');
    var TransformationQueue = require('wf-js-uicomponents/awesome_map/TransformationQueue');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');

    function createEvent(type) {
        return new InteractionEvent(type, new Gesture(), new Gesture());
    }

    describe('TransformationQueue', function() {

        var queue;
        var target = document.createElement('div');
        var currentState = new TransformState();
        var map = AwesomeMap.prototype;

        beforeEach(function() {
            map.onTransformStarted = { dispatch: function() {} };
            map.onTransformFinished = { dispatch: function() {} };
            map.onScaleChanged = { dispatch: function() {} };
            map.onScaleChanging = { dispatch: function() {} };
            map.onTranslationChanged = { dispatch: function() {} };
            map.onTranslationChanging = { dispatch: function() {} };

            spyOn(map, 'getTransformationPlane').andReturn(target);
            spyOn(map, 'getCurrentTransformState').andReturn(currentState);

            queue = new TransformationQueue(map);
        });

        describe('cancelling the current transformation', function() {

            it('should cancel and return cancelled state if a current transformation exists', function() {
                var evt = createEvent(EventTypes.DRAG);
                var cancelledState = new TransformState();
                var transformation = Transformation.prototype;
                spyOn(transformation, 'execute');
                spyOn(transformation, 'cancel').andReturn(cancelledState);

                queue.enqueue(evt);

                spyOn(TransformationQueue.dependencies, 'createTransformation').andReturn(transformation);
                queue.processEvents();
                var result = queue.cancelCurrentTransformation();

                expect(transformation.cancel).toHaveBeenCalled();
                expect(result).toBe(cancelledState);
            });
        });

        describe('enqueueing events', function() {

            it('should queue the event and the callback together', function() {
                var evt = createEvent(EventTypes.TOUCH);
                var done = function() {};
                var items;

                items = queue.enqueue(evt, done);

                expect(items.length).toBe(1);
                expect(items[0].event).toBe(evt);
                expect(items[0].done).toBe(done);
            });

            it('should not enqueue mousemove events', function() {
                var evt = createEvent(EventTypes.MOUSE_MOVE);
                var done = function() {};

                var items = queue.enqueue(evt, done);

                expect(items.length).toBe(0);
            });
        });

        describe('processing events', function() {

            var evt;
            var targetState;
            var done = jasmine.createSpy('done');
            var transformation = Transformation.prototype;

            beforeEach(function() {
                evt = createEvent(EventTypes.TOUCH);
                targetState = new TransformState();

                spyOn(TransformState, 'fromEvent').andReturn(targetState);
                spyOn(TransformationQueue.dependencies, 'createTransformation').andReturn(transformation);

                queue.enqueue(evt, done);
            });

            it('should not process if already processing', function() {
                // Create a transformation that does not finish.
                spyOn(transformation, 'execute');

                queue.processEvents();

                expect(queue.processEvents()).toBe(false);
            });

            it('should generate the target state for the event', function() {
                spyOn(transformation, 'execute');

                queue.processEvents();

                expect(TransformState.fromEvent).toHaveBeenCalledWith(evt, currentState);
            });

            it('should dispatch "onTransformStarted" with the event and target state', function() {
                spyOn(map.onTransformStarted, 'dispatch');
                spyOn(transformation, 'execute');

                queue.processEvents();

                expect(map.onTransformStarted.dispatch).toHaveBeenCalledWith([
                    map,
                    { event: evt, targetState: targetState }
                ]);
            });

            it('should dispatch "onScaleChanging" if target scale is different from current scale', function() {
                spyOn(map.onScaleChanging, 'dispatch');
                spyOn(transformation, 'execute');
                targetState.scale = currentState.scale + 1;

                queue.processEvents();

                expect(map.onScaleChanging.dispatch).toHaveBeenCalledWith([
                    map,
                    {
                        event: evt,
                        currentScale: currentState.scale,
                        nextScale: targetState.scale
                    }
                ]);
            });

            it('should dispatch "onTranslationChanging" if target translation x is different from current translation', function() {
                spyOn(map.onTranslationChanging, 'dispatch');
                spyOn(transformation, 'execute');
                targetState.translateX += currentState.translateX + 1;

                queue.processEvents();

                expect(map.onTranslationChanging.dispatch).toHaveBeenCalledWith([
                    map,
                    {
                        event: evt,
                        currentTranslation: {
                            x: currentState.translateX,
                            y: currentState.translateY
                        },
                        nextTranslation: {
                            x: targetState.translateX,
                            y: targetState.translateY
                        }
                    }
                ]);
            });

            it('should dispatch "onTranslationChanging" if target translation y is different from current translation', function() {
                spyOn(map.onTranslationChanging, 'dispatch');
                spyOn(transformation, 'execute');
                targetState.translateY += currentState.translateY + 1;

                queue.processEvents();

                expect(map.onTranslationChanging.dispatch).toHaveBeenCalledWith([
                    map,
                    {
                        event: evt,
                        currentTranslation: {
                            x: currentState.translateX,
                            y: currentState.translateY
                        },
                        nextTranslation: {
                            x: targetState.translateX,
                            y: targetState.translateY
                        }
                    }
                ]);
            });

            it('should execute a transformation', function() {
                spyOn(transformation, 'execute');

                queue.processEvents();

                expect(TransformationQueue.dependencies.createTransformation)
                    .toHaveBeenCalledWith(target, targetState, currentState);
                expect(transformation.execute).toHaveBeenCalled();
            });

            it('should dispatch "onTransformFinished" observable', function() {
                spyOn(transformation, 'execute').andCallFake(function(done) {
                    done(targetState);
                });
                spyOn(map.onTransformFinished, 'dispatch');

                queue.processEvents();

                expect(map.onTransformFinished.dispatch).toHaveBeenCalledWith([
                    map,
                    { event: evt, finalState: targetState }
                ]);
            });

            it('should invoke the callback queued with the event', function() {
                spyOn(transformation, 'execute').andCallFake(function(done) {
                    done(targetState);
                });

                queue.processEvents();

                expect(done).toHaveBeenCalled();
            });
        });

        describe('is processing', function() {
            var evt;
            var done = jasmine.createSpy('done');

            it('should be true when the queue is processing', function() {
                evt = createEvent(EventTypes.TOUCH);
                queue.enqueue(evt, done);
                var transformation = jasmine.createSpyObj('Transformation', ['execute']);

                spyOn(TransformationQueue.dependencies, 'createTransformation').andReturn(transformation);
                queue.processEvents();

                expect(queue.isProcessing()).toBe(true);
            });

            it('should be false when the queue is done processing', function() {
                evt = createEvent(EventTypes.TOUCH);
                queue.enqueue(evt, done);
                queue.processEvents();

                expect(queue.isProcessing()).toBe(false);
            });

            it('should be false after processing an empty queue', function() {
                queue.processEvents();
                expect(queue.isProcessing()).toBe(false);
            });
        });

    });
});
