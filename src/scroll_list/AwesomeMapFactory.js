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
    var PropagationInterceptor = require('wf-js-uicomponents/scroll_list/PropagationInterceptor');
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
            var options = scrollList.getOptions();
            var yBoundaryMode = options.mode === ScrollModes.SINGLE ? 'stop' : 'slow';
            var map = new AwesomeMap(host, {
                // By the time an event comes through, it has already passed through the list map,
                // so there's no need to normalize the position again.
                normalizeEventPosition: false,
                touchScrollingEnabled: options.touchScrollingEnabled
            });

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
                mode: { x: 'stop', y: yBoundaryMode }
            }));

            // Wire up observables.
            map.onScaleChanged(function(source, args) {
                scrollList.onScaleChanged.dispatch([scrollList, {
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
            var layout = scrollList.getLayout();
            var options = scrollList.getOptions();
            var map = new AwesomeMap(scrollList.getHost(), {
                touchScrollingEnabled: options.touchScrollingEnabled
            });

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
                map.addInterceptor(new PropagationInterceptor(scrollList));
            }
            map.addInterceptor(new RenderingHooksInterceptor(scrollList));

            // Wire up observables.
            map.onInteractionStarted(function() {
                scrollList.onInteractionStarted.dispatch([scrollList]);
            });
            map.onInteraction(function(source, args) {
                var newArgs = { event: args.event };
                var fn = HitTester[options.mode === ScrollModes.FLOW ? 'testListMap' : 'testItemMap'];
                var hit = fn(scrollList, args.event);
                if (hit) {
                    newArgs.itemIndex = hit.index;
                    newArgs.itemPosition = hit.position;
                }
                scrollList.onInteraction.dispatch([scrollList, newArgs]);
            });
            map.onInteractionFinished(function() {
                scrollList.onInteractionFinished.dispatch([scrollList]);
            });
            map.onScaleChanged(function(source, args) {
                scrollList.getLayout().setScale(args.scale);
                scrollList.onScaleChanged.dispatch([scrollList, {
                    event: args.event,
                    scale: scrollList.getScale()
                }]);
            });
            map.onTranslationChanged(function(source, args) {
                scrollList.getLayout().setScrollPosition({
                    top: -args.y,
                    left: -args.x
                });
                scrollList.onScrollPositionChanged.dispatch([scrollList, {
                    event: args.event,
                    x: -args.x,
                    y: -args.y
                }]);
            });

            // Set initial transform in order to center the content.
            var viewportSize = layout.getViewportSize();
            var layoutSize = layout.getSize();
            map.transform({
                x: (viewportSize.width - layoutSize.width) / 2,
                y: (viewportSize.height < layoutSize.height ? 0 :
                    (viewportSize.height - layoutSize.height) / 2),
                scale: 1
            });

            return map;
        }
    };

    return AwesomeMapFactory;
});
