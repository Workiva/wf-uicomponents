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
        var verticalOffset = 0;
        var scrollBar;
        
        var scrollBarTemplate = $('<div id="scroll-bar-container"><div id="scroll-bar"></div></div>');
        
        var mockLayout = {
            getViewportSize: function () { return 100; },
            getSize: function () { return 700; },
            getVisiblePosition: function () { return { top: 0 };},
            getCurrentItemIndex: function () { return 0; }
        };
        
        beforeEach(function() {
            scrollBarTemplate.appendTo('body');
            
            scrollList._items = [{ height: 700 }];
            
            spyOn(scrollList, 'getLayout').andReturn(mockLayout);
            spyOn(scrollList, 'getListMap').andReturn({onTranslationChanged: function() {}});
            scrollBar = new ScrollBar(scrollList, verticalOffset);
        });
        
        afterEach(function() {
            $('body').empty();
        });
        
        it('should scroll to position when the scrollBar is moved', function() {
            var scrollBarEl = $('#scroll-bar');
            spyOn(scrollList, 'scrollTo');
            
            scrollBarEl.trigger('mousedown', function() {});
            scrollBarEl.trigger('mousemove', function() {});
            expect(scrollList.scrollTo).toHaveBeenCalled();
        });
    });

});
