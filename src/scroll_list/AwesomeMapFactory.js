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
    var DoubleTapZoomInterceptor = require('wf-js-uicomponents/awesome_map/DoubleTapZoomInterceptor');
    var HorizontalAlignments = require('wf-js-uicomponents/layouts/HorizontalAlignments');
    var MouseWheelNavigationInterceptor = require('wf-js-uicomponents/scroll_list/MouseWheelNavigationInterceptor');
    var PeekInterceptor = require('wf-js-uicomponents/scroll_list/PeekInterceptor');
    var RenderingHooksInterceptor = require('wf-js-uicomponents/scroll_list/RenderingHooksInterceptor');
    var ScaleInterceptor = require('wf-js-uicomponents/awesome_map/ScaleInterceptor');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var StopPropagationInterceptor = require('wf-js-uicomponents/scroll_list/StopPropagationInterceptor');
    var SwipeInterceptor = require('wf-js-uicomponents/awesome_map/SwipeInterceptor');
    var SwipeNavigationInterceptor = require('wf-js-uicomponents/scroll_list/SwipeNavigationInterceptor');
    var VerticalAlignments = require('wf-js-uicomponents/layouts/VerticalAlignments');
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
            var hAlignLeft = options.horizontalAlign === HorizontalAlignments.LEFT;
            var hAlignCenter = options.horizontalAlign === HorizontalAlignments.CENTER;
            var vAlignTop = options.verticalAlign === VerticalAlignments.TOP;
            var vAlignAuto = options.verticalAlign === VerticalAlignments.AUTO;
            var map = new AwesomeMap(host, {
                cancelMouseWheelEvents: false,
                mousePanningEnabled: options.mousePanningEnabled
            });

            // Register interceptors.
            map.addInterceptor(new DoubleTapZoomInterceptor());
            if (options.scaleLimits) {
                map.addInterceptor(new ScaleInterceptor(options.scaleLimits));
            }
            if (options.mode === ScrollModes.PEEK) {
                map.addInterceptor(new PeekInterceptor(scrollList));
            }
            else if (options.mode === ScrollModes.SINGLE) {
                map.addInterceptor(new SwipeNavigationInterceptor(scrollList));
            }
            map.addInterceptor(new SwipeInterceptor({
                constrainToAxes: true
            }));
            map.addInterceptor(new BoundaryInterceptor({
                centerContentX: hAlignCenter,
                centerContentY: vAlignAuto,
                mode: 'stop',
                pinToLeft: hAlignLeft,
                pinToTop: vAlignTop,
                scrollList: scrollList
            }));

            // Wire up observables.
            // Emit interaction events from the map that was current at the
            // start of an interaction.
            var mapAtInteractionStart = null;
            map.onInteractionStarted(function(source) {
                mapAtInteractionStart = scrollList.getCurrentItemMap();
                if (mapAtInteractionStart !== source) {
                    return;
                }
                scrollList.onInteractionStarted.dispatch([scrollList]);
            });
            map.onInteraction(function(source, args) {
                if (mapAtInteractionStart !== source) {
                    return;
                }
                var evt = args.event;
                var newArgs = { event: evt };
                if (evt.position) {
                    var hit = scrollList.hitTest(evt.position);
                    if (hit) {
                        newArgs.itemIndex = hit.index;
                        newArgs.itemPosition = hit.position;
                    }
                }
                scrollList.onInteraction.dispatch([scrollList, newArgs]);
            });
            map.onInteractionFinished(function(source) {
                if (mapAtInteractionStart !== source) {
                    return;
                }
                scrollList.onInteractionFinished.dispatch([scrollList]);
            });
            map.onScaleChanged(function(source, args) {
                scrollList.onScaleChanged.dispatch([scrollList, {
                    event: args.event,
                    scale: scrollList.getScale()
                }]);
            });
            map.onScaleChanging(function(source, args) {
                scrollList.onScaleChanging.dispatch([scrollList, {
                    event: args.event,
                    currentScale: args.currentScale,
                    nextScale: args.nextScale,
                }]);
            });
            map.onTranslationChanged(function(source, args) {
                scrollList.onItemScrollPositionChanged.dispatch([scrollList, {
                    event: args.event,
                    x: -args.x,
                    y: -args.y
                }]);
            });
            map.onTranslationChanging(function(source, args) {
                scrollList.onItemScrollPositionChanging.dispatch([scrollList, {
                    event: args.event,
                    currentPosition: {
                        x: -args.currentTranslation.x,
                        y: -args.currentTranslation.y
                    },
                    nextPosition: {
                        x: -args.nextTranslation.x,
                        y: -args.nextTranslation.y
                    }
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
            var hAlignLeft = options.horizontalAlign === HorizontalAlignments.LEFT;
            var hAlignCenter = options.horizontalAlign === HorizontalAlignments.CENTER;
            var vAlignTop = options.verticalAlign === VerticalAlignments.TOP;
            var vAlignAuto = options.verticalAlign === VerticalAlignments.AUTO;
            var map = new AwesomeMap(scrollList.getHost(), {
                cancelMouseWheelEvents: true,
                mousePanningEnabled: options.mousePanningEnabled
            });

            // Set content dimensions to the dimensions of the layout.
            map.setContentDimensions(layout.getSize());

            // Register interceptors.
            map.addInterceptor(new ViewportResizeInterceptor(scrollList));
            if (options.mode === ScrollModes.FLOW) {
                map.addInterceptor(new DoubleTapZoomInterceptor());
                map.addInterceptor(new SwipeInterceptor({
                    constrainToAxes: true
                }));
                if (options.scaleLimits) {
                    map.addInterceptor(new ScaleInterceptor(options.scaleLimits));
                }
                map.addInterceptor(new BoundaryInterceptor({
                    centerContentX: hAlignCenter,
                    centerContentY: vAlignAuto,
                    mode: { x: 'stop', y: 'slow' },
                    pinToLeft: hAlignLeft,
                    pinToTop: vAlignTop
                }));
            }
            else {
                map.addInterceptor(new MouseWheelNavigationInterceptor(scrollList));
                map.addInterceptor(new StopPropagationInterceptor(scrollList));
            }
            map.addInterceptor(new RenderingHooksInterceptor(scrollList));

            if (options.mode === ScrollModes.FLOW) {
                // Wire up observables.
                map.onInteractionStarted(function() {
                    scrollList.onInteractionStarted.dispatch([scrollList]);
                });
                map.onInteraction(function(source, args) {
                    var evt = args.event;
                    var newArgs = { event: evt };
                    if (evt.position) {
                        var hit = scrollList.hitTest(evt.position);
                        if (hit) {
                            newArgs.itemIndex = hit.index;
                            newArgs.itemPosition = hit.position;
                        }
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
                map.onScaleChanging(function(source, args) {
                    scrollList.onScaleChanging.dispatch([scrollList, {
                        event: args.event,
                        currentScale: args.currentScale,
                        nextScale: args.nextScale,
                    }]);
                });
            }
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
            map.onTranslationChanging(function(source, args) {
                scrollList.onScrollPositionChanging.dispatch([scrollList, {
                    event: args.event,
                    currentPosition: {
                        x: -args.currentTranslation.x,
                        y: -args.currentTranslation.y
                    },
                    nextPosition: {
                        x: -args.nextTranslation.x,
                        y: -args.nextTranslation.y
                    }
                }]);
            });

            // Set initial transform in order to center the content.
            var viewportSize = layout.getViewportSize();
            var layoutSize = layout.getSize();
            var transformX = 0;
            if (hAlignCenter) {
                transformX = (viewportSize.width - layoutSize.width) / 2;
            }
            var transformY = 0;
            if (vAlignAuto && viewportSize.height > layoutSize.height) {
                transformY = (viewportSize.height - layoutSize.height) / 2;
            }
            map.transform({
                x: transformX,
                y: transformY,
                scale: 1
            });

            return map;
        }
    };

    return AwesomeMapFactory;
});
