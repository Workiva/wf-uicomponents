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

part of wUIComponents;

enum EventTypes {
  /// User right clicks on desktop.
  contextMenu,

  /// User double taps on touch or double clicks on desktop.
  doubleTap,

  /// User drags on touch or clicks and drags on desktop.
  drag,

  /// User stops dragging due to a release or a change in gesture.
  dragEnd,

  /// User starts dragging.
  dragStart,

  /// User taps and holds on touch or clicks and holds on desktop.
  hold,

  /// User generates a mousemove event on desktop.
  mouseMove,

  /// User generates a mousewheel event on desktop.
  mouseWheel,

  /// User began spinning the mouse wheel.
  mouseWheelStart,

  /// User has finished spinning the mouse wheel.
  mouseWheelEnd,

  /// User releases all fingers on touch or releases mouse-clicks on desktop.
  release,

  /// The viewport of the EventSynthesizer's host is resized.
  resize,

  /// User swipes on touch or clicks, drags and releases quickly on desktop.
  swipe,

  /// User taps and releases on touch or clicks and releases on desktop.
  tap,

  /// User touches on touch or hovers the mouse on desktop.
  touch,

  /// User pinches on touch.
  transform,

  /// User stops pinching on touch.
  transformEnd,

  /// User starts pinching.
  transformStart
}
