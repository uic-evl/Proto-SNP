"use strict";

var App = App || {};

const PrimaryStructureController = (function() {

  function PrimaryStructureController(models, views) {
    this._model = models;
    this._views = views;

    /* Attach the listeners to the view */
    this._views.forEach(function(view){
      /* Residue selected event */
      view.residueSelected.attach(function(sender, args){
        sender._model.selectResidue(args);
      });
      /* Residue deselected event*/
      view.residueDeselected.attach(function(sender, args){
        sender._model.deselectResidue(args);
      });

    });

    /*  Bind the view with knockoutJS */
    ko.applyBindings({views: this._views}, $("#sequenceViewerTemplate")[0]);

  }

  PrimaryStructureController.prototype = {};

  return PrimaryStructureController;
})();