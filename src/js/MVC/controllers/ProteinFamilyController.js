"use strict";

var App = App || {};

const ProteinFamilyController = (function() {

  function ProteinFamilyController(model, view) {
    this._model = model;
    this._view = view;

    let _this = this;

    /* Add residue selection */
    this._view.fileUploaded.attach(function(sender, args) {
      sender._model.setFamily(args.data, args.type);
    });

  }

  ProteinFamilyController.prototype = {

  };

  return ProteinFamilyController;
})();