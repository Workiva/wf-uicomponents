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
    var BoundaryInterceptor = require('wf-js-uicomponents/awesome_map/BoundaryInterceptor');
    var PeekInterceptor = require('wf-js-uicomponents/scroll_list/PeekInterceptor');
    var DoubleTapZoomInterceptor = require('wf-js-uicomponents/awesome_map/DoubleTapZoomInterceptor');
    var HitTester = require('wf-js-uicomponents/scroll_list/HitTester');
    var MouseWheelNavigationInterceptor = require('wf-js-uicomponents/scroll_list/MouseWheelNavigationInterceptor');
    var PropogationInterceptor = require('wf-js-uicomponents/scroll_list/PropogationInterceptor');
    var RenderingHooksInterceptor = require('wf-js-uicomponents/scroll_list/RenderingHooksInterceptor');
    var ScaleInterceptor = require('wf-js-uicomponents/awesome_map/ScaleInterceptor');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var SwipeInterceptor = require('wf-js-uicomponents/awesome_map/SwipeInterceptor');
    var SwipeNavigationInterceptor = require('wf-js-uicomponents/scroll_list/SwipeNavigationInterceptor');
    var ViewportResizeInterceptor = require('wf-js-uicomponents/scroll_list/ViewportResizeInterceptor');

    /**
     * @classdesc
     *
     * AwesomeMapFactory provides standard instantiation functions for maps
     * that are used by a ScrollList.
     *
     * @exports AwesomeMapFactory
     */
    var AwesomeMapFactory = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Create a map to contain a single item in the list.
         *
         * @method
         * @param {ScrollList} scrollList
         * @param {HTMLElement} host
         * @return {AwesomeMap}
         */
        createItemMap: function(scrollList, host) {
            var map = new AwesomeMap(host);
            var options = scrollList.getOptions();

            // Register interceptors.
            map.addInterceptor(new DoubleTapZoomInterceptor());
            map.addInterceptor(new SwipeInterceptor({
                animationDuration: 250,
                constrainToAxes: true
            }));
            if (options.scaleLimits) {
                map.addInterceptor(new ScaleInterceptor(options.scaleLimits));
            }
            map.addInterceptor(new BoundaryInterceptor({
                centerContent: true,
                mode: 'stop'
            }));

            // Wire up observables.
            map.onScaleChanged(function(source, args) {
                scrollList.onScaleChanged.dispatch([this, {
                    event: args.event,
                    scale: scrollList.getScale()
                }]);
            });

            return map;
        },

        /**
         * Create a map to contain the list.
         *
         * @method
         * @param {ScrollList} scrollList
         * @return {AwesomeMap}
         */
        createListMap: function(scrollList) {
            var map = new AwesomeMap(scrollList.getHost());
            var layout = scrollList.getLayout();
            var options = scrollList.getOptions();

            // Set content dimensions to the dimensions of the layout.
            map.setContentDimensions(layout.getSize());

            // Register interceptors.
            map.addInterceptor(new ViewportResizeInterceptor(scrollList));
            if (options.mode === ScrollModes.FLOW) {
                map.addInterceptor(new DoubleTapZoomInterceptor());
                map.addInterceptor(new SwipeInterceptor({
                    animationDuration: 2000,
                    constrainToAxes: true
                }));
                if (options.scaleLimits) {
                    map.addInterceptor(new ScaleInterceptor(options.scaleLimits));
                }
                map.addInterceptor(new BoundaryInterceptor({
                    centerContent: true,
                    mode: { x: 'stop', y: 'slow' }
                }));
            }
            else {
                if (options.mode === ScrollModes.PEEK) {
                    map.addInterceptor(new PeekInterceptor(scrollList));
                }
                else { // Modes.SINGLE
                    map.addInterceptor(new SwipeNavigationInterceptor(scrollList));
                }
                map.addInterceptor(new MouseWheelNavigationInterceptor(scrollList));
                map.addInterceptor(new PropogationInterceptor(scrollList));
            }
            map.addInterceptor(new RenderingHooksInterceptor(scrollList));

            // Wire up observables.
            map.onInteractionStarted(function() {
                scrollList.onInteractionStarted.dispatch([scrollList]);
            });
            map.onInteraction(function(source, args) {
                var newArgs = { event: args.event };
                var fn = HitTester[options.mode === ScrollModes.FLOW ? 'testListMap' : 'testItemMap'];
                var hit = fn(scrollList, args.event, args.currentState);
                if (hit) {
                    newArgs.itemIndex = hit.index;
                    newArgs.itemPosition = hit.position;
                }
                scrollList.onInteraction.dispatch([scrollList, newArgs]);
            });
            map.onInteractionFinished(function() {
                scrollList.onInteractionFinished.dispatch([scrollList]);
            });
            map.onTranslationChanged(function(source, args) {
                scrollList.getLayout().setScrollPosition({ top: args.y, left: args.x });
            });
            map.onScaleChanged(function(source, args) {
                scrollList.getLayout().setScale(args.scale);
                scrollList.onScaleChanged.dispatch([this, {
                    event: args.event,
                    scale: scrollList.getScale()
                }]);
            });

            // Set initial transform in order to center the content.
            map.transform({
                x: (layout.getViewportSize().width - layout.getSize().width) / 2,
                y: 0,
                scale: 1
            });

            return map;
        }
    };

    return AwesomeMapFactory;
});
