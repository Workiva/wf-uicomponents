/**
https://github.com/derickbailey/jasmine.async
(MIT License)

Copyright ©2012 Muted Solutions, LLC. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

define([], function() {
    'use strict';
    /* global it, runs, waitsFor */

    function runAsync(block) {
        return function() {
            var done = false;
            var complete = function() {
                done = true;
            };

            runs(function() {
                block(complete);
            });

            waitsFor(function() {
                return done;
            });
        };
    }

    function AsyncSpec(spec) {
        this.spec = spec;
    }

    AsyncSpec.prototype.beforeEach = function(block) {
        this.spec.beforeEach(runAsync(block));
    };

    AsyncSpec.prototype.afterEach = function(block) {
        this.spec.afterEach(runAsync(block));
    };

    AsyncSpec.prototype.it = function(description, block) {
        // For some reason, `it` is not attached to the current
        // test suite, so it has to be called from the global
        // context.
        it(description, runAsync(block));
    };

    return AsyncSpec;
});
