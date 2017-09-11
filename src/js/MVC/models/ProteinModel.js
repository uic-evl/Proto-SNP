"use strict";

var App = App || {};

const ProteinModel = (function() {

  function ProteinModel() {
    let self = this;

    self._proteinStructure = null;
    self._proteinName = "";
    self._geometry = null;
    self._selectedResidue = null;
    self._previousSelectedResidue = null;

    self._proteinSorting = "";
    self._proteinColoring = "";
    self._rotation = {};
    self._zoom = null;
    self._center = null;

    self.proteinAdded = new EventNotification(this);
    self.proteinChanged = new EventNotification(this);

    self.residueSelected = new EventNotification(this);
    self.proteinSortingChanged    = new EventNotification(this);
    self.proteinColoringChanged   = new EventNotification(this);

    self.rotateModel   = new EventNotification(this);
    self.zoomModel   = new EventNotification(this);
    self.cameraChanged   = new EventNotification(this);

    /* Determines which method to load the protein */
    self.load_protein = function (metadata, file){
      // if the data method is from an uploaded file
      if(file){
        return App.fileUtilities.uploadPDB(file, metadata);
      }
      // else from a download
      else {
        /* create a variable to use to test a promise */
        let protein_name = metadata.protein_name;
        /* If the name is greater than 4 characters, it is not PDB format*/
        if(metadata.protein_name.length > 4) {
          protein_name = App.dataUtilities.mnemonicToPDB(metadata.protein_name);
        }

        /* Fetch/Load the model from RCMP PDB */
        return Promise.resolve(protein_name)
            .then(function(name){
              return App.fileUtilities.downloadFromRCMB(name, metadata);
            })
            .catch(function() {
              /* Reject the operation */
              return Promise.reject(null);
            });
      }
    };
  }

  ProteinModel.prototype = {
    /* Accessor to get the underlying structure in the molecularViewer */
    getStructure: function() { return this._proteinStructure; },

    /* Accessor to get the underlying geometry in the molecularViewer */
    setGeometry: function(geometry) { this._geometry = geometry; },

    /* Accessor to get the underlying geometry in the molecularViewer */
    getGeometry: function() { return this._geometry; },

    getSequence: function(structure, chain) {
      // Array to store the sequence
      let seq = [];
      /* Iterate over the residues of the chain and add them to the array*/
      structure.chains()[chain || 0].eachResidue(function(res){
        seq.push(res.name());
      });
      // return the sequence
      return seq;
    },

    getName: function() { return this._proteinName},

    addProtein : function(metadata, file) {
      this.load_protein(metadata, file).then(function(structure){
        this._proteinStructure = structure;
        this._proteinName = metadata.protein_name;
        this.proteinAdded.notify({structure:this._proteinStructure, name:metadata.protein_name});
      }.bind(this));
    },

    /* Clear the model instance variables and data */
    clear: function() {
      this._proteinStructure = null;
      this._geometry = null;
      this._selectedResidue = null;
      this._previousSelectedResidue = null;

      this._proteinName = "";
      this._proteinSorting = "";
      this._proteinColoring = "";
    },

    selectResidue : function(selection) {
      this._previousSelectedResidue = this._selectedResidue;
      this._selectedResidue = selection;
      /* Notify the listeners that the selection has been changed */
      this.residueSelected.notify(this._selectedResidue);
    },

    getResidueSelection : function() { return this._selectedResidue },

    setProteinSorting: function (sorting) {
      this._proteinSorting = sorting;
      this.proteinSortingChanged.notify({scheme: sorting});
      return this;
    },

    setRotation: function(rotation,  propagate){
      this._rotation = rotation;
      /* If this was not a native rotation */
      if(propagate){
        this.rotateModel.notify({rotation: this._rotation});
      }
    },

    setZoom: function(zoom,  propagate){
      this._zoom = zoom;
      /* If this was not a native rotation */
      if(propagate){
        this.zoomModel.notify({zoom: this._zoom});
      }
    },

    setCamera: function(camera, propagate){
      this._rotation = camera.rotation;
      this._zoom = camera.zoom;
      this._center = camera.center;
      /* If this was not a native rotation */
      if(propagate){
        this.cameraChanged.notify(camera);
      }
    },

    getRotation : function() { return this._rotation; },

    getProteinSorting: function() { return this._proteinSorting; },

    setProteinColoring: function (coloring) {
      this._proteinColoring = coloring;
      this.proteinColoringChanged.notify({scheme: coloring});
      return this;
    },

    getProteinColoring: function() { return this._proteinColoring; },

    isEmpty : function() {
      return !!this._proteinStructure;
    }

  };

  return ProteinModel;
})();
