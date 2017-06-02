"use strict";

var App = App || {};

const TertiaryStructureController = (function() {

  function TertiaryStructureController(models, views) {
    this._models = models;
    this._views = views;

    /* Setup the callback listeners for each view*/
    this._views.forEach(function(view, idx){
      /* Add Protein Callback */
      view.fileUploaded.attach(function(sender, args) {
        sender._model.addProtein(args);
      });
    });

    /*  Bind the view with knockoutJS */
    ko.applyBindings({views: this._views}, $("#molecularViewers")[0]);
  }

  TertiaryStructureController.prototype = {};

  return TertiaryStructureController;
})();