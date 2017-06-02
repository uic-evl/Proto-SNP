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
    this.proteinAdded = new EventNotification(this);

  }

  ProteinModel.prototype = {

    getProteinStructure : function () {
      return this.proteinStructure;
    },

    addProtein : function(metadata, file) {
      load_protein(metadata, file).then(function(structure){
        this.proteinStructure = structure;
        this.proteinAdded.notify(this.proteinStructure);
      }.bind(this));
    },

    isEmpty : function() {
      return !!this.proteinStructure;
    }

  };

  return ProteinModel;
})();
