"use strict";

var App = App || {};

const TertiaryStructureController = (function() {

  /* Set the view semantics for easy lookup */
  let semantics = { left: 0, right : 1};

  function TertiaryStructureController(models, views, controllers) {
    let self = this;
    self._models = models;
    self._views = views;
    self._controllers = controllers;


    /* Setup the callback listeners for each view*/
    self._views.forEach(function(view, idx){

      /* Add Protein Upload/Update Callbacks */
      view.fileUploaded.attach(function(sender, args) {
        sender._model.addProtein(args.metaData, args.file);
      });

      view.fileUpdated.attach(function(sender, args) {
        /* Clear the view and model */
        view._model.clear();
        view.clear();
        sender._model.addProtein(args.metaData, args.file);
      });

      view.colorChanged.attach(function(sender, args){
        let m = _.without(self._models, sender._model)[0];
        m.setProteinColoring(args.color);
      });

      /* Add residue selection/deselection */
      view.residueSelected.attach(function(sender, args) {
        sender._model.selectResidue(args);
      });
      view.residueDeselected.attach(function(sender, args) {
        sender._model.deselectResidue(args);
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
          m.setCamera(args, true);
        }
      });
    });

    /* Receive the protein name/viewer side that was selected from the family viewer*/
    controllers.proteinSelected.attach(function(sender, msg) {
      self._views[semantics[msg.semantic]].downloadPDB(msg.protein);
    });

    /*  Bind the view with knockoutJS */
    ko.applyBindings({views: this._views}, $("#molecularViewerTemplate")[0]);
  }

  TertiaryStructureController.prototype = {};

  return TertiaryStructureController;
})();