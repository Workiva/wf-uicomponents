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
    var RenderingHooksInterceptor = require('wf-js-uicomponents/scroll_list/RenderingHooksInterceptor');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');

    function createEvent(type, gesture) {
        gesture = gesture || new Gesture();
        return new InteractionEvent(type, gesture, gesture);
    }

    describe('RenderingHooksInterceptor', function() {

        describe('on transform started', function() {

            describe('mouse wheel', function() {
                var scrollList;
                var layout;
                var interceptor;
                var map;

                beforeEach(function () {
                    scrollList = _.extend({}, ScrollList.prototype);
                    layout = _.extend({}, VerticalLayout.prototype);
                    interceptor = new RenderingHooksInterceptor(scrollList);
                    map = _.extend({}, AwesomeMap.prototype);

                    spyOn(scrollList, 'getOptions').andReturn({ mode: ScrollModes.FLOW });
                    spyOn(scrollList, 'getLayout').andReturn(layout);
                    spyOn(layout, 'render');
                });

                it('should render the layout when scrolling vertically', function() {
                    // any value different from original Y
                    spyOn(map, 'getTranslation').andReturn({ x: 0, y: 0 });
                    var targetState = new TransformState({ translateY: 10 });

                    interceptor.handleTransformStarted(map, {
                        event: createEvent(EventTypes.MOUSE_WHEEL),
                        targetState: targetState
                    });

                    expect(layout.render).toHaveBeenCalledWith(null);
                });

                it('should render the layout when scrolling horizontally', function() {
                    // any value different from original X
                    spyOn(map, 'getTranslation').andReturn({ x: 0, y: 0 });
                    var targetState = new TransformState({ translateX: 10 });

                    interceptor.handleTransformStarted(map, {
                        event: createEvent(EventTypes.MOUSE_WHEEL),
                        targetState: targetState
                    });

                    expect(layout.render).toHaveBeenCalledWith(null);
                });

                it('should not render if position does not change', function () {
                    var yValue = 0;
                    var xValue = 0;
                    spyOn(map, 'getTranslation').andReturn({ x: xValue, y: yValue });

                    var targetState = new TransformState({
                        translateX: xValue,
                        translateY: yValue
                    });
                    interceptor.handleTransformStarted(map, {
                        event: createEvent(EventTypes.MOUSE_WHEEL),
                        targetState: targetState
                    });

                    expect(layout.render).not.toHaveBeenCalled();
                });
            });
        });

        describe('on transform finished', function() {

            describe('mouse wheel', function() {
                var scrollList;
                var layout;
                var interceptor;
                var map;

                beforeEach(function () {
                    scrollList = _.extend({}, ScrollList.prototype);
                    layout = _.extend({}, VerticalLayout.prototype);
                    map = _.extend({}, AwesomeMap.prototype);

                    spyOn(scrollList, 'getOptions').andReturn({ mode: ScrollModes.FLOW });
                    spyOn(scrollList, 'getLayout').andReturn(layout);
                    spyOn(layout, 'render');
                    spyOn(layout, 'loadContent');

                    interceptor = new RenderingHooksInterceptor(scrollList);
                });

                it('should load content when position has changed', function() {
                    // any values different from start x and y should work
                    spyOn(map, 'getTranslation').andReturn({ x: 0, y: 0 });
                    var targetState = new TransformState({
                        translateX: 1,
                        translateY: 1
                    });

                    var evt = createEvent(EventTypes.MOUSE_WHEEL);
                    interceptor.handleTransformStarted(map, {
                        event: evt,
                        targetState: targetState
                    });

                    interceptor.handleTransformFinished(map, {
                        event: evt
                    });

                    waits(100); // 100 is debounce interval
                    runs(function() {
                        expect(layout.loadContent).toHaveBeenCalled();
                    });
                });

                it('should not load content when position has not changed', function() {
                    spyOn(map, 'getTranslation').andReturn({ x: 0, y: 0 });
                    var targetState = new TransformState({
                        translateX: 0,
                        translateY: 0
                    });

                    var evt = createEvent(EventTypes.MOUSE_WHEEL);
                    interceptor.handleTransformStarted(map, {
                        event: evt,
                        targetState: targetState
                    });

                    interceptor.handleTransformFinished(map, {
                        event: evt
                    });

                    waits(100); // 100 is debounce interval
                    runs(function() {
                        expect(layout.loadContent).not.toHaveBeenCalled();
                    });
                });
            });
        });
    });
});
