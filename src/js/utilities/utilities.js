"use strict";

// Global Application variable
var App = App || {};

const utils = function () {

    return {
        getComputedStyleValue : function(el, styling) {
            let style = el.currentStyle || window.getComputedStyle(el),
                pixels = parseFloat(style[styling],10);
            return (pixels) ? pixels : style[styling];
        },
        waitForFinalEvent : (function () {
            let timers = {};
            return function (callback, ms, uniqueId) {
                if (!uniqueId) {
                    uniqueId = "Don't call this twice without a uniqueId";
                }
                if (timers[uniqueId]) {
                    clearTimeout (timers[uniqueId]);
                }
                timers[uniqueId] = setTimeout(callback, ms);
            };
        })(),
        warning_resolution : function(cb) {
            swal({
                title: 'Resolution Warning',
                text: "The suggested resolution for this application is 1024x768 or larger. Smaller resolutions could lead to visual artifacts and loss of smoother interactions. ",
                type: 'warning',
                confirmButtonColor: '#3085d6',
            }).then(cb)
        }
    }

}();