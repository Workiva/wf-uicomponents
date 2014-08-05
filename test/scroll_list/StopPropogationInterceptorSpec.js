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

    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var StopPropagationInterceptor = require('wf-js-uicomponents/scroll_list/StopPropagationInterceptor');

    describe('StopPropagationInterceptor', function() {

        var scrollList = ScrollList.prototype;
        var interceptor;

        beforeEach(function() {
            interceptor = new StopPropagationInterceptor(scrollList);
        });

        it('should not cancel simulated events', function() {
            var evt = { simulated: true };
            var result = interceptor.handleInteraction(null, { event: evt });

            expect(result).toBeUndefined();
        });

        it('should cancel all other events', function() {
            var evt = {};
            var result = interceptor.handleInteraction(null, { event: evt });

            expect(result).toBe(false);
        });
    });
});
