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

define(function() {
    'use strict';

    /**
     * @classdesc
     *
     * EventTypes represent the type of events encapsulted by an {@link IneractionEvent}.
     *
     * @exports EventTypes
     */
    var EventTypes = {

        /**
         * User right clicks on desktop.
         * @type {string}
         */
        CONTEXT_MENU: 'contextmenu',

        /**
         * User double taps on touch or double clicks on desktop.
         * @type {string}
         */
        DOUBLE_TAP: 'doubletap',

        /**
         * User drags on touch or clicks and drags on desktop.
         * @type {string}
         */
        DRAG: 'drag',

        /**
         * User stops dragging due to a release or a change in gesture.
         * @type {string}
         */
        DRAG_END: 'dragend',

        /**
         * User starts dragging.
         * @type {string}
         */
        DRAG_START: 'dragstart',

        /**
         * User taps and holds on touch or clicks and holds on desktop.
         * @type {string}
         */
        HOLD: 'hold',

        /**
         * User generates a mousemove event on desktop.
         * @type {string}
         */
        MOUSE_MOVE: 'mousemove',

        /**
         * User generates a mousewheel event on desktop.
         * @type {string}
         */
        MOUSE_WHEEL: 'mousewheel',

        /**
         * User began spinning the mouse wheel.
         * @type {string}
         */
        MOUSE_WHEEL_START: 'mousewheelstart',

        /**
         * User has finished spinning the mouse wheel.
         * @type {string}
         */
        MOUSE_WHEEL_END: 'mousewheelend',

        /**
         * User is holding on a touchscreen and a box shows up to indicate release will show a
         * context menu.
         * @type {String}
         */
        MS_HOLD_VISUAL: 'MSHoldVisual',

        /**
         * User releases all fingers on touch or releases mouse-clicks on desktop.
         * @type {string}
         */
        RELEASE: 'release',

        /**
         * The viewport of the EventSynthesizer's host is resized.
         * @type {string}
         */
        RESIZE: 'resize',

        /**
         * User swipes on touch or clicks, drags and releases quickly on desktop.
         * @type {string}
         */
        SWIPE: 'swipe',

        /**
         * User taps and releases on touch or clicks and releases on desktop.
         * @type {string}
         */
        TAP: 'tap',

        /**
         * User touches on touch or hovers the mouse on desktop.
         * @type {string}
         */
        TOUCH: 'touch',

        /**
         * User pinches on touch.
         * @type {string}
         */
        TRANSFORM: 'transform',

        /**
         * User stops pinching on touch.
         * @type {string}
         */
        TRANSFORM_END: 'transformend',

        /**
         * User starts pinching.
         * @type {string}
         */
        TRANSFORM_START: 'transformstart'
    };

    return EventTypes;
});
