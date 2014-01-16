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
    var PropogationInterceptor = require('wf-js-uicomponents/scroll_list/PropogationInterceptor');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');

    describe('PropogationInterceptor', function() {

        var scrollList = ScrollList.prototype;
        var itemMap = AwesomeMap.prototype;
        var interceptor;

        beforeEach(function() {
            interceptor = new PropogationInterceptor(scrollList);

            spyOn(itemMap, 'handleInteractionEvent');
            spyOn(scrollList, 'getCurrentItemMap').andReturn(itemMap);
        });

        it('should not transfer cancelled events', function() {
            var evt = { cancelled: true };
            var result = interceptor.handleInteraction(null, { event: evt });

            expect(result).toBeUndefined();
            expect(itemMap.handleInteractionEvent).not.toHaveBeenCalled();
        });

        it('should not transfer simulated events', function() {
            var evt = { simulated: true };
            var result = interceptor.handleInteraction(null, { event: evt });

            expect(result).toBeUndefined();
            expect(itemMap.handleInteractionEvent).not.toHaveBeenCalled();
        });

        it('should transfer all other events', function() {
            var evt = {};
            var result = interceptor.handleInteraction(null, { event: evt });

            expect(result).toBe(false);
            expect(itemMap.handleInteractionEvent)
                .toHaveBeenCalledWith(interceptor, { event: evt });
        });
    });
});
