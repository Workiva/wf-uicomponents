/*! Workiva Copyright (c) 2015 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'scroll_list/ScrollList'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(exports, require('scroll_list/ScrollList'));
    } else {
        // Browser globals
        root.wf = root.wf || {};
        root.wf.uicomponents = root.wf.uicomponents || {};
        factory(root.wf.uicomponents, root.ScrollList);
    }
}(this, function (exports, ScrollList) {
