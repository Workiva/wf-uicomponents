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

/// Select easing functions from http://www.robertpenner.com/easing/.
///
/// Each implementing class provides a CSS cubic beizer representing
/// the easing function, and a JavaScript implementation of the function.
/// The reason for both is that some browsers (IE9) do not support CSS Transitions,
/// so we need to use a fallback JavaScript easing function.
///
/// For example:
///
///     EasingFunction fn = new EaseOutQuart();
///     DateTime start = new DateTime.now();
///     num elapsed = 0; // elapsed time in milliseconds
///     num duration = 500; // duration in milliseconds
///     num value;
///
///     // Ease a single value from 0 to 1.
///     while (elapsed < duration) {
///         value = fn.js(0, 1, duration, elapsed);
///         DateTime complete = new DateTime.now();
///         elapsed = complete.difference(start).inMilliseconds;
///     }
abstract class EasingFunction {
    String css = '';
    js(num start, num delta, num duration, num elapsed);
}

/// See <http://easings.net/#easeOutCubic>.
class EaseOutCubic extends EasingFunction {
    String css = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

    js(num start, num delta, num duration, num elapsed) {
        elapsed = elapsed / duration - 1;
        return delta * (elapsed * elapsed * elapsed + 1) + start;
    }
}

/// See <http://easings.net/#easeOutQuart>
class EaseOutQuart extends EasingFunction {
    String css = 'cubic-bezier(0.165, 0.84, 0.44, 1)';

    js(num start, num delta, num duration, num elapsed) {
        elapsed = elapsed / duration - 1;
        return -delta * (elapsed * elapsed * elapsed * elapsed - 1) + start;
    }
}
