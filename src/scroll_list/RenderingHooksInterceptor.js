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
    var InterceptorMixin = require('wf-js-uicomponents/awesome_map/InterceptorMixin');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var requestAnimFrame = require('wf-js-common/requestAnimationFrame');

    /**
     * Rendering
     * @constructor
     */
    var RenderingHooksInterceptor = function(scrollList) {
        this._debouncedRender = _.debounce(function() {
            scrollList.render();
        }, 100);

        this._scrollList = scrollList;
        this._didWheelTranslateMap = false;
    };

    RenderingHooksInterceptor.prototype = {

        handleTransformStarted: function(sender, args) {
            // assert sender is AwesomeMap
            // This logic only applies to 'flow' mode.
            if (this._scrollList.getOptions().mode !== ScrollModes.FLOW) {
                return;
            }

            var eventType = args.event.type;
            var targetState = args.targetState;
            var layout = this._scrollList.getLayout();

            // Create placeholders to support smooth swipe animations.
            if (eventType === EventTypes.SWIPE) {

                // First, render based on current position to protect against
                // visible gaps in content. Then, render intermediate items in
                // a new frame, as adding them to the DOM all at once can
                // take a bit before the animation and cause a slight hiccup.
                var targetScrollPosition = {
                    left: -targetState.translateX,
                    top: -targetState.translateY
                };
                layout.render({ preserveStaleItems: true });
                requestAnimFrame(function() {
                    layout.render({ targetScrollPosition: targetScrollPosition });
                }.bind(this));
            }
            // Create placeholders to support mouse wheels.
            else if (eventType === EventTypes.MOUSE_WHEEL) {
                // Prevent unnecessary rendering for scrolls at boundaries
                var currentTranslation = sender.getTranslation();
                this._didWheelTranslateMap = (
                    (currentTranslation.y !== targetState.translateY) ||
                    (currentTranslation.x !== targetState.translateX)
                );
                if (this._didWheelTranslateMap) {
                    layout.render({ preserveStaleItems: true });
                }
            }
        },

        handleTransformFinished: function(sender, args) {
            var eventType = args.event.type;
            var layout = this._scrollList.getLayout();

            // Render the layout only (placeholders no content) if still transforming;
            // otherwise, render the list (includes content loading).
            if (eventType === EventTypes.RELEASE) {
                if (sender.isTransforming()) {
                    layout.render();
                }
                else {
                    this._scrollList.render();
                }
            }
            // Load content after mousewheels stop.
            else if (eventType === EventTypes.MOUSE_WHEEL) {
                // Mousewheels at boundary should be ignored
                if (this._didWheelTranslateMap) {
                    this._debouncedRender();
                }
            }
        }
    };

    _.assign(RenderingHooksInterceptor.prototype, InterceptorMixin);

    return RenderingHooksInterceptor;
});
