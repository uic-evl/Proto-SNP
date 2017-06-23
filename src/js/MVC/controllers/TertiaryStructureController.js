"use strict";

var App = App || {};

const TertiaryStructureController = (function() {

  function TertiaryStructureController(models, views) {
    this._models = models;
    this._views = views;

    /* Setup the callback listeners for each view*/
    this._views.forEach(function(view, idx){
      /* Add Protein Upload Callbacks */
      view.fileUploaded.attach(function(sender, args) {
        sender._model.addProtein(args.metaData, args.file);
      });

      view.fileUpdated.attach(function(sender, args) {
        /* Clear the view and model */
        view._model.clear();
        view.clear();

        sender._model.addProtein(args.metaData, args.file);
      });

      /* Add residue selection */
      view.residueSelected.attach(function(sender, args) {
        sender._model.selectResidue(args.selection);
      });

    });

    /*  Bind the view with knockoutJS */
    ko.applyBindings({views: this._views}, $("#molecularViewerTemplate")[0]);
  }

  TertiaryStructureController.prototype = {};

  return TertiaryStructureController;
})();