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
    var DoubleTapZoomInterceptor = require('wf-js-uicomponents/awesome_map/DoubleTapZoomInterceptor');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');

    function createEvent(type, gesture) {
        gesture = gesture || new Gesture({ source: { type: 'touch' }});
        return new InteractionEvent(type, gesture, gesture);
    }

    describe('DoubleTapZoomInterceptor', function() {

        var map = AwesomeMap.prototype;
        var interceptor;

        beforeEach(function() {
            map.onInteraction = function() {};
            map.onTransformStarted = function() {};

            initializeInterceptor();
        });

        function initializeInterceptor(options) {
            interceptor = new DoubleTapZoomInterceptor(options);
            interceptor.register(map);
        }

        function simulateDoubleTap(originalScale, expectedScale, callback) {
            var state = new TransformState({ scale: originalScale });
            var gesture = new Gesture({ source: { type: 'touch' }});
            var position = { x: 100, y: 50 };
            var doubletap;
            var release;

            spyOn(gesture, 'getPosition').andReturn(position);

            doubletap = createEvent(EventTypes.DOUBLE_TAP, gesture);
            release = createEvent(EventTypes.RELEASE, gesture);

            spyOn(state, 'zoomBy');

            interceptor.handleInteraction(null, { event: doubletap, currentState: state });
            interceptor.handleTransformStarted(null, { event: release, targetState: state });

            expect(state.zoomBy).toHaveBeenCalledWith(expectedScale, 0, 0, position.x, position.y);

            if (callback) {
                callback(state);
            }
        }

        it('should be mixed with InterceptorMixin', function() {
            expect(interceptor.dispose).toBeDefined();
            expect(interceptor.register).toBeDefined();
        });

        describe('options', function() {

            it('should use a 500ms animation duration by default', function() {
                simulateDoubleTap(1, 2, function(state) {
                    expect(state.duration).toBe(500);
                });
            });

            it('should use a custom animation duration', function() {
                initializeInterceptor({
                    animationDuration: 10000
                });
                simulateDoubleTap(1, 2, function(state) {
                    expect(state.duration).toBe(10000);
                });
            });
        });

        describe('behavior', function() {

            it('should zoom to 2x on double tap and release if currently scaled at 1x', function() {
                simulateDoubleTap(1, 2);
            });

            it('should zoom to 1x on double tap and release if currently scaled at other than 1x', function() {
                var scale = 1.2345;
                simulateDoubleTap(scale, 1 / scale);
            });
        });
    });
});
