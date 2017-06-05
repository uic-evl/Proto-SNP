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

  function ProteinFamilyModel() {

    this._selectedProtein = null;
    this._selectedResidues = {left: [], right: []};
    this._previousSelectedResidues = {left: [], right: []};
    this._proteinSorting = "";
    this._proteinNames = null;
    this._parsedData = null;
    this._sequenceSortingAlgorithms = null;

    /* Update Events */
    this.proteinFamilyAdded      = new EventNotification(this);
    this.selectedProteinChanged  = new EventNotification(this);
    this.selectedResiduesChanged = new EventNotification(this);
    this.proteinSortingChanged   = new EventNotification(this);
  }

  ProteinFamilyModel.prototype = {

    setFamily : function(data, type) {
      this._rawData = App.fileUtilities.parseAlignmentFile(data, type);
      map_trend_image_data(this._rawData).then(function(parsed_data) {
        this._parsedData = parsed_data;
        this.setProteinNames();

        /* Setup the sequence sorting algorithms */
        this._sequenceSortingAlgorithms = new SequenceSorting(this._rawData);

        this.proteinFamilyAdded.notify({family: this._parsedData});
      }.bind(this));
    },

    getSequenceFrequenciesFromRange: function(range) {
      let fragments = this._sequenceSortingAlgorithms.getFragmentCountsFromRange(range[0], range[1]),
          curFragments = [];
      fragments.forEach(function(fragment) {
        /* Get the highest occurring residue and it's frequency */
        curFragments.push(_.max(_.toPairs(fragment), function(o){ return o[1] }));
      });
      return curFragments;
    },

    getFamily: function() {
      return this._parsedData;
    },

    /* Setter for the names of the proteins from the family */
    setProteinNames : function () {
      this._proteinNames = d3.set(this._rawData.map(function( residue )
      { return residue.name; } )).values();
      /* Set the initial selected protein to the first name */
      this._selectedProtein = this._proteinNames[0];
    },

    getProteinNames : function() { return this._proteinNames; },

    getSelectedProtein: function () {
      return _.filter(this._rawData, ['name', this._selectedProtein])[0];
    },

    setSelectedProtein: function (proteinName) {
      this._selectedProtein = proteinName;
      /* Notify all listeners */
      this.selectedProteinChanged.notify({selection: this._selectedProtein});
      return this;
    },

    getSelectedResidues: function (position) {
      return {
        selection: this._selectedResidues[position],
        previous: this._previousSelectedResidues[position]
      }
    },

    setSelectedResidues: function (position, selection) {
      console.log(selection);
      this._previousSelectedResidues[position] = this._selectedResidues[position];
      this._selectedResidues[position] = selection;
      /* Notify all listeners */
      this.selectedResiduesChanged.notify(
          {
            selection: this._selectedResidues[position],
            previous: this._previousSelectedResidues[position]
          }
      );
      return this;
    },

    getProteinSorting: function () {
      return this._proteinSorting;
    },

    setProteinSorting: function (sorting) {
      this._proteinSorting = sorting;
      this.proteinSortingChanged.notify({algorithm: sorting});
      return this;
    },

    isEmpty : function() {
      return !!this._parsedData;
    }
  };

  return ProteinFamilyModel;
})();
