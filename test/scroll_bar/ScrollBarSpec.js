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

    var $ = require('jquery');
    var _ = require('lodash');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var ScrollBar = require('wf-js-uicomponents/scroll_bar/ScrollBar');

    describe('ScrollBar', function () {
        var scrollList = _.extend({}, ScrollList.prototype);
        var scrollBar;
        var parentEl;

        var parent = $('<div id="scroll-bar-parent"></div>');
        $('body').append(parent);

        var mockLayout = {
            getViewportSize: function () { return 100; },
            getSize: function () { return 700; },
            getVisiblePosition: function () { return { top: 0 };},
            getCurrentItemIndex: function () { return 0; }
        };

        var mockListMap = {
            onTranslationChanged: function() {},
            onScaleChanged: function() {}
        };

        var options = {};
        options.scrollbarId = 'scroll-bar';
        options.scrollbarContainerId = 'scroll-bar-container';

        beforeEach(function() {
            scrollList._items = [{ height: 700 }];

            parentEl = document.getElementById('scroll-bar-parent');

            spyOn(scrollList, 'getLayout').andReturn(mockLayout);
            spyOn(scrollList, 'getListMap').andReturn(mockListMap);
            scrollBar = new ScrollBar(scrollList, parentEl, options);
        });

        afterEach(function() {
            $('body').empty();
        });

        it('should scroll to position when the scrollBar is moved', function() {
            var scrollBarEl = document.getElementById('scroll-bar');
            var e1 = document.createEvent('Event');
            e1.initEvent('mousedown', true, false);
            var e2 = document.createEvent('Event');
            e2.initEvent('mousemove', true, false);
            spyOn(scrollList, 'scrollTo');

            scrollBarEl.dispatchEvent(e1);
            scrollBarEl.dispatchEvent(e2);

            expect(scrollList.scrollTo).toHaveBeenCalled();
        });
    });

});
