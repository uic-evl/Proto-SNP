"use strict";

var App = App || {};

const ProteinFamilyModel = (function() {

  /* Parse the incoming data into row, columns, and values */
  function map_trend_image_data(raw_data) {
    return new Promise(function(resolve, reject) {
      let data = [], index = [], columns = [];
      /* Extract the rows and data */
      raw_data.forEach( (d,i) => {
        data.push(d.sequence);
        index.push(d.name);
      } );
      /* Extract the columns */
      data[0].forEach( (d,i) => { columns.push(["R", i]) } );
      /* Resolve the promise to return the data */
      resolve({ data: data, index : index, columns : columns });
    });
  }


  function ProteinFamilyModel(raw_data) {

    this._rawData = App.fileUtilities.parse(raw_data.data, raw_data.type);
    map_trend_image_data(this._rawData).then(function(parsed_data) {
      this._parsedData = parsed_data;
    });

    this._selectedProtein = null;
    this._selectedResidues = {left: [], right: []};
    this._proteinSorting = "";

    /* Update Events  */
    this.selectedProteinChanged = new EventNotification();
    this.selectedResiduesChanged = new EventNotification();
    this.proteinSortingChanged = new EventNotification();
  }

  ProteinFamilyModel.prototype = {

    getFamily: function() {
      return this._parsedData;
    },

    getSelectedProtein: function () {
      return this._selectedProtein;
    },

    setSelectedProtein: function (protein) {
      this._selectedProtein = protein;
      this.selectedProteinChanged.notify({protein: protein});
      return this;
    },

    getSelectedResidues: function (position) {
      return this._selectedResidues[position];
    },

    setSelectedResidues: function (position, selection) {
      this._selectedResidues[position] = selection;
      this.selectedResiduesChanged.notify({residues: selection});
      return this;
    },

    getProteinSorting: function () {
      return this._proteinSorting;
    },

    setProteinSorting: function (sorting) {
      this._proteinSorting = sorting;
      this.proteinSortingChanged.notify({algorithm: sorting});
      return this;
    }
  };

  return ProteinFamilyModel;
})();
