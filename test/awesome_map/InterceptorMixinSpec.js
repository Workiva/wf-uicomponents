/*
 * Copyright 2015 Workiva Inc.
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
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var InterceptorMixin = require('wf-js-uicomponents/awesome_map/InterceptorMixin');

    // Setup a fake interceptor that mixes the mixin.
    var FakeInterceptor = function() {};
    FakeInterceptor.prototype = {
        handleInteraction: function() {},
        handleTransformFinished: function() {},
        handleTransformStarted: function() {}
    };
    _.assign(FakeInterceptor.prototype, InterceptorMixin);


    describe('InterceptorMixin', function() {

        var map;

        beforeEach(function() {
            map = {
                isDisposed: function() { return false; },
                onInteraction: function() {},
                onTransformFinished: function() {},
                onTransformStarted: function() {}
            };
        });

        describe('disposal', function() {

            var interceptor;

            beforeEach(function() {
                interceptor = new FakeInterceptor();
                interceptor.register(map);

                // Replace the observable functions with spies.
                map.onInteraction = jasmine.createSpyObj('onInteraction', ['remove']);
                map.onTransformFinished = jasmine.createSpyObj('onTransformFinished', ['remove']);
                map.onTransformStarted = jasmine.createSpyObj('onTransformStarted', ['remove']);
            });

            it('should remove subscriptions to awesome map interaction events', function() {
                interceptor.dispose();

                expect(map.onInteraction.remove).toHaveBeenCalled();
            });

            it('should remove subscriptions to awesome map transform finished events', function() {
                interceptor.dispose();

                expect(map.onTransformFinished.remove).toHaveBeenCalled();
            });

            it('should remove subscriptions to awesome map transform started events', function() {
                interceptor.dispose();

                expect(map.onTransformStarted.remove).toHaveBeenCalled();
            });

            it('should destroy the instance', function() {
                spyOn(DestroyUtil, 'destroy');
                interceptor.dispose();

                expect(DestroyUtil.destroy).toHaveBeenCalledWith(interceptor);
            });

            it('should not fail if "register" has not been called', function() {
                var unregistered = new FakeInterceptor();

                expect(function() {
                    unregistered.dispose();
                }).not.toThrow();
            });
        });

        describe('registration', function() {

            beforeEach(function() {
                spyOn(map, 'onInteraction');
                spyOn(map, 'onTransformFinished');
                spyOn(map, 'onTransformStarted');
            });

            it('should subscribe to interaction events if the interceptor defines "handleInteraction"', function() {
                var interceptor = new FakeInterceptor();

                interceptor.register(map);

                expect(map.onInteraction).toHaveBeenCalled();
            });

            it('should subscribe to transform finished events if the interceptor defines "handleTransformFinished"', function() {
                var interceptor = new FakeInterceptor();

                interceptor.register(map);

                expect(map.onTransformFinished).toHaveBeenCalled();
            });

            it('should subscribe to transform started events if the interceptor defines "handleTransformStarted"', function() {
                var interceptor = new FakeInterceptor();

                interceptor.register(map);

                expect(map.onTransformStarted).toHaveBeenCalled();
            });

            it('should allow registration once', function() {
                var interceptor = new FakeInterceptor();

                interceptor.register(map);

                expect(function() {
                    interceptor.register(map);
                }).toThrow({
                    message: 'This interceptor is already registered.'
                });
            });

            it('should do nothing if the awesome map is disposed', function() {
                var interceptor = new FakeInterceptor();
                spyOn(map, 'isDisposed').andReturn(true);

                interceptor.register(map);

                expect(map.onInteraction).not.toHaveBeenCalled();
                expect(map.onTransformFinished).not.toHaveBeenCalled();
                expect(map.onTransformStarted).not.toHaveBeenCalled();
            });
        });
    });
});