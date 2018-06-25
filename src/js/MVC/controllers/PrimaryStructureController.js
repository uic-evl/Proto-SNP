"use strict";

var App = App || {};

const PrimaryStructureController = (function () {

    function PrimaryStructureController(models, views) {
        this._model = models;
        this._views = views;

        let promises = [];
        /* Attach the listeners to the view */
        this._views.forEach(function (view) {

            /* Residue selected event */
            view.residueSelected.attach(function (sender, args) {
                sender._model.selectResidue(args);
            });
            /* Residue deselected event*/
            view.residueDeselected.attach(function (sender, args) {
                sender._model.deselectResidue(args);
            });

            promises.push(view.getPromise());

        });

        $.when(promises[0],promises[1]).done(function(v1, v2) {
            let s1 = $(`#${v1} span`)[0],
                s2 = $(`#${v2} span`)[0];
            let prev_len = 0;

            function select_scroll_1(e) {
                let length = $(this).scrollTop(),
                    diff = length - prev_len;

                if(Math.abs(diff) < 10) return;

                prev_len = length;
                $(s2).scrollTop(length);
            }
            function select_scroll_2(e) {
                let length = $(this).scrollTop(),
                    diff = length - prev_len;

                if(Math.abs(diff) < 10) return;

                prev_len = length;
                $(s1).scrollTop(length);
            }

            s1.addEventListener('scroll', select_scroll_1, false);
            s2.addEventListener('scroll', select_scroll_2, false);

        });

        /*  Bind the view with knockoutJS */
        ko.applyBindings({views: this._views}, $("#sequenceViewerTemplate")[0]);

    }

    PrimaryStructureController.prototype = {};

    return PrimaryStructureController;
})();