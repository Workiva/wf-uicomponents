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

    var RenderingHooksInterceptor = function(scrollList) {
        this._debouncedLoad = _.debounce(function() {
            scrollList.getLayout().loadContent();
        }, 100);

        this._scrollList = scrollList;
    };

    RenderingHooksInterceptor.prototype = {

        handleTransformStarted: function(sender, args) {
            // This logic only applies to 'flow' mode.
            if (this._scrollList.getOptions().mode !== ScrollModes.FLOW) {
                return;
            }

            var eventType = args.event.type;
            var targetState = args.targetState;

            // Create placeholders to support smooth swipe animations.
            if (eventType === EventTypes.SWIPE) {

                // First, render based on current position to protect against
                // visible gaps in content. Then, render intermediate items in
                // a new frame, as adding them to the DOM all at once can
                // take a bit before the animation and cause a slight hiccup.
                this._renderLayout();
                requestAnimFrame(function() {
                    this._renderLayout(targetState);
                }.bind(this));
            }
            // Create placeholders to support mouse wheels.
            else if (eventType === EventTypes.MOUSE_WHEEL) {
                this._renderLayout();
            }
        },

        handleTransformFinished: function(sender, args) {
            var eventType = args.event.type;

            // Load content when releasing if the sender is done transforming.
            if (eventType === EventTypes.RELEASE) {
                this._renderLayout();
                if (!sender.isTransforming()) {
                    this._scrollList.render();
                }
            }
            // Load content after mousewheels stop.
            else if (eventType === EventTypes.MOUSE_WHEEL) {
                this._debouncedLoad();
            }
        },

        _renderLayout: function(targetState) {
            var layout = this._scrollList.getLayout();
            var targetScrollPosition = !targetState ? null : {
                top: targetState.translateY,
                left: targetState.translateX
            };
            layout.render(targetScrollPosition);
        }
    };

    _.assign(RenderingHooksInterceptor.prototype, InterceptorMixin);

    return RenderingHooksInterceptor;
});
