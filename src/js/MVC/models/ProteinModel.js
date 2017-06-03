"use strict";

var App = App || {};

const ProteinModel = (function() {

  /* Determines which method to load the protein */
  function load_protein(metadata, file){
    // if the data method is from an uploaded file
    if(file){
      return App.fileUtilities.uploadPDB(file, metadata);
    }
    // else from a download
    else {
      /* create a variable to use to test a promise */
      let protein_name = metadata.name;

      /* If the name is greater than 4 characters, it is not PDB format*/
      if(metadata.name.length > 4) {
        protein_name = App.dataUtilities.mneumonicToPDB(metadata.name);
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
  }

  function ProteinModel() {

    this.proteinStructure = null;
    this.selectedResidue = null;
    this.previousSelectedResidue = null;

    this.proteinAdded = new EventNotification(this);
    this.residueSelected = new EventNotification(this);

  }

  ProteinModel.prototype = {
    /* Accessor to get the underlying structure in the molecularViewer */
    getStructure: function() { return this.proteinStructure; },

    /* Accessor to get the underlying geometry in the molecularViewer */
    getGeometry: function() { return this.proteinStructure.geom; },

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

    addProtein : function(metadata, file) {
      load_protein(metadata, file).then(function(structure){
        this.proteinStructure = structure;
        this.proteinAdded.notify({structure:this.proteinStructure, name:metadata.protein_name});
      }.bind(this));
    },

    selectResidue : function(selection) {
      this.previousSelectedResidue = this.selectedResidue;
      this.selectedResidue = selection;
      /* Notify the listeners that the selection has been changed */
      this.residueSelected.notify(this.selectedResidue);
    },

    getResidueSelection : function() { return this.selectedResidue },

    isEmpty : function() {
      return !!this.proteinStructure;
    }

  };

  return ProteinModel;
})();
