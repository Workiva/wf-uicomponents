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

import 'dart:html' show HtmlElement;
import 'dart:math';

/// The minimum amount of pixel difference between touches to trigger a zoom.
const num minimumPixelDistanceChange = 2; // 4 pixels

/// Represents gestures captured by an [EventSynthesizer] and attached to
/// an [InteractionEvent].
class Gesture {
  /// The angle of the gesture, in degrees.
  /// Zero degrees is right of center, and the angle increases clockwise.
  num angle;

  /// The center point of the gesture, relative to the page.
  Point<num> center;

  /// The change in position along the x-axis.
  num deltaX;

  /// The change in position along the y-axis.
  num deltaY;

  /// The direction of the gesture: 'up', 'down', 'left' or 'right'.
  String direction;

  /// The duration of the gesture, in ms.
  num duration;

  /// The scale of the gesture, where 1 represents a zoom level of 100%.
  num scale;

  /// The source event that triggered the gesture.
  /// TODO: I'm not sure what type of object the source is yet. We should
  /// specify the type once we know.
  dynamic source;

  /// The target element the gesture was performed upon.
  HtmlElement target;

  /// The position of the fingers during the gesture, relative to the page.
  List<Point<num>> touches;

  /// The velocity of the gesture along the x-axis.
  num velocityX;

  /// The velocity of the gesture along the y-axis.
  num velocityY;

  Gesture({this.angle: null, this.center: null, this.deltaX: 0, this.deltaY: 0,
      this.direction: null, this.duration: 0, this.scale: 1, this.source: null,
      this.target: null, this.touches: null, this.velocityX: 0,
      this.velocityY: 0}) {
    if (touches == null) {
      touches = new List<Point>();
    }
  }

  /// Creates a new gesture from a Hammer-like gesture.
  /// This method provides a convenient way to map between property names
  /// in our Gesture object and the anonymous gesture object Hammer uses.
  Gesture.fromHammerGesture(dynamic gesture) {
    angle = gesture.angle;
    center = gesture.center;
    deltaX = gesture.deltaX;
    deltaY = gesture.deltaY;
    direction = gesture.direction;
    duration = 0; // No duration after the interaction has happened;
    scale = gesture.scale;
    source = gesture.srcEvent;
    target = gesture.target;
    touches = gesture.touches;
    velocityX = gesture.velocityX;
    velocityY = gesture.velocityY;
  }

  /// Clones the gesture.
  Gesture clone() {
    Point<num> center = this.center;
    center = center == null
        ? null
        : new Point<num>(center.x, center.y);

    List<Point<num>> touches = new List<Point<num>>();
    for (var pnt in this.touches) {
      touches.add(new Point(pnt.x, pnt.y));
    }

    return new Gesture(
        angle: angle,
        center: center,
        deltaX: deltaX,
        deltaY: deltaY,
        direction: direction,
        duration: duration,
        scale: scale,
        source: source,
        target: target,
        touches: touches,
        velocityX: velocityX,
        velocityY: velocityY
    );
  }

  /// Creates a gesture with iterative deltas from the given gesture. By
  /// default, we track cumulative changes over the entire interaction.
  Gesture createIterativeGesture(gesture) {
    Gesture iterativeGesture = this.clone();

    // Calculate iterative deltas for the gesture.
    iterativeGesture.deltaX -= gesture.deltaX;
    iterativeGesture.deltaY -= gesture.deltaY;
    iterativeGesture.duration -= gesture.duration;

    if (this._validateTouchDistance(gesture)) {
      iterativeGesture.scale /= gesture.scale;
    } else {
      iterativeGesture.scale = 1.0;
    }

    return iterativeGesture;
  }

  /// Calculates the distance between touches.
  num getTouchDistance() {
    if (touches.length != 2) {
      return 0;
    }

    Point<num> touch1 = touches[0];
    Point<num> touch2 = touches[1];
    num x = touch1.x - touch2.x;
    num y = touch1.y - touch2.y;

    return sqrt(x * x + y * y);
  }

  /// Prevent bad transform behavior by validating the touch distance delta:
  /// if the delta is too large there is sticky behavior;
  /// if the delta is too small there is screen jiggle.
  bool _validateTouchDistance(gesture) {
    num delta = getTouchDistance() - gesture.getTouchDistance();
    return delta.abs() > minimumPixelDistanceChange;
  }

  /// Gets the gesture position relative to the target.
  Point getPosition() {
    if (target != null && center != null) {
      Rectangle targetRect = target.getBoundingClientRect();
      return new Point<num>(
          center.x - targetRect.left, center.y - targetRect.top);
    } else {
      return null;
    }
  }
}
