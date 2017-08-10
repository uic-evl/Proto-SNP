"use strict";

var App = App || {};

const TertiaryStructureController = (function() {

  function TertiaryStructureController(models, views) {
    let self = this;
    self._models = models;
    self._views = views;

    /* Setup the callback listeners for each view*/
    self._views.forEach(function(view, idx){
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

      view.modelRotated.attach(function(sender, args){
        // update the sender's model
        sender._model.setRotation(args.rotation, false);
        // update the other model if it is set
        let m = _.without(self._models, sender._model)[0];
        if(m.isEmpty()){
          m.setRotation(args.rotation, true);
        }
      });

      view.modelZoomed.attach(function(sender, args){
        // update the sender's model
        sender._model.setZoom(args.zoom, false);
        // update the other model if it is set
        let m = _.without(self._models, sender._model)[0];
        if(m.isEmpty()){
          m.setZoom(args.zoom, true);
        }
      });

      view.cameraChanged.attach(function(sender, args){
        // update the sender's model
        sender._model.setZoom(args, false);
        // update the other model if it is set
        let m = _.without(self._models, sender._model)[0];
        if(m.isEmpty()){
          console.log(args);
          m.setCamera(args, true);
        }
      });
    });

    /*  Bind the view with knockoutJS */
    ko.applyBindings({views: this._views}, $("#molecularViewerTemplate")[0]);
  }

  TertiaryStructureController.prototype = {};

  return TertiaryStructureController;
})();