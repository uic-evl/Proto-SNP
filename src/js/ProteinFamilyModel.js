"use strict";

var App = App || {};

const ProteinFamilyModel = (function() {

  function ProteinFamilyModel(raw_data) {

    this._rawData = raw_data;
    this._parsedData = null;

    this._selectedProtein = null;
    this._selectedResidues = {left: [], right: []};
    this._proteinSorting = "";

    /* Update Events  */
    this.selectedProteinChanged = new EventNotification();
    this.selectedResiduesChanged = new EventNotification();
    this.proteinSortingChanged = new EventNotification();
  }

  ProteinFamilyModel.prototype = {

    getSelectedProtein: function () {
      return this._selectedProtein;
    },

    setSelectedProtein: function (protein) {
      this._selectedProtein = protein;
      this.selectedProteinChanged.notify({protein: protein});
      return this
    },

    getSelectedResidues: function (position) {
      return this._selectedResidues[position];
    },

    setSelectedResidues: function (position, selection) {
      this._selectedResidues[position] = selection;
      this.selectedResiduesChanged.notify({residues: selection});
      return this
    },

    getProteinSorting: function () {
      return this._proteinSorting;
    },

    setProteinSorting: function (sorting) {
      this._proteinSorting = sorting;
      this.proteinSortingChanged.notify({algorithm: sorting});
      return this
    }

  };


  return ProteinFamilyModel;
})();
