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
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var RenderingHooksInterceptor = require('wf-js-uicomponents/scroll_list/RenderingHooksInterceptor');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');

    function createEvent(type, gesture) {
        gesture = gesture || new Gesture();
        return new InteractionEvent(type, gesture, gesture);
    }

    describe('RenderingHooksInterceptor', function() {

        describe('on transform started', function() {

            describe('mouse wheel', function() {

                it('should render the layout at the current posiiton', function() {
                    var scrollList = _.extend({}, ScrollList.prototype);
                    var layout = _.extend({}, VerticalLayout.prototype);
                    var interceptor = new RenderingHooksInterceptor(scrollList);

                    spyOn(scrollList, 'getOptions').andReturn({ mode: ScrollModes.FLOW });
                    spyOn(scrollList, 'getLayout').andReturn(layout);
                    spyOn(layout, 'render');

                    interceptor.handleTransformStarted(null, { event: createEvent(EventTypes.MOUSE_WHEEL) });

                    expect(layout.render).toHaveBeenCalledWith(null);
                });
            });
        });
    });
});
