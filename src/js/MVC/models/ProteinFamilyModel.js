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
    let self = this;
    
    self._selectedProtein = null;
    self._selectedResidues = {left: [], right: []};
    self._previousSelectedResidues = {left: [], right: []};

    self._sequenceSortingAlgorithms = null;

    self._proteinSorting = "";
    self._proteinColoring = "";

    self._proteinNames = null;
    self._parsedData = null;

    /* Update Events */
    self.proteinFamilyAdded          = new EventNotification(this);
    self.selectedProteinChanged      = new EventNotification(this);
    self.selectedResiduesChanged     = new EventNotification(this);
    /* Menu Filtering */
    self.proteinSortingChanged       = new EventNotification(this);
    self.proteinColoringChanged      = new EventNotification(this);

    /* Setter for the different types of similarity scores */
     self.set_scores = function(metric, scores) {
      scores.forEach( (o) => {
        let member = _.find(self._rawData, (m) => { return o.name === m.name} );
        member.scores[metric] = o.score;
      });
    };

    /* Calculate all of the sorting metrics for family */
    self.calculate_all_sorting_scores = function(protein) {
      /* Calculate the edit distance scores with the first protein and enable the menu option */
      let edit_dist = self._sequenceSortingAlgorithms.calculateEditDistanceScores(protein),
      /* Calculate the weighted edit distance scores with the first protein and enable the menu option */
      weighted_edit_dist = self._sequenceSortingAlgorithms.calculateEditDistanceScores(protein,
          {insertion: 3, deletion: 3, substitution: 5}),
      /* Calculate the residue commonality scores with the first protein and enable the menu option */
      commonality = self._sequenceSortingAlgorithms.calculateCommonalityScores(protein),
      /* Calculate the weighted residue commonality scores with the first protein and enable the menu option */
      weighted_commonality = self._sequenceSortingAlgorithms.calculateCommonalityScores(protein, 1);
      /* Resolve when all promises return */
      Promise.all([edit_dist, weighted_edit_dist, commonality, weighted_commonality]).then(values => {
        /* Enable sorting menu */
        $("#sorting_list").find("li").removeClass("disabled");
        /* Set the family scores */
        self.set_scores("edit_distance", values[0]);
        self.set_scores("weighted_edit_distance", values[1]);
        self.set_scores("commonality_scores", values[2]);
        self.set_scores("normalized_commonality_scores", values[3]);
      });
    }
  }

  ProteinFamilyModel.prototype = {
    setFamily : function(data, type) {
      this._rawData = App.fileUtilities.parseAlignmentFile(data, type);
      map_trend_image_data(this._rawData).then(function(parsed_data) {
        this._parsedData = parsed_data;
        this.setProteinNames();

        /* Setup the sequence sorting algorithms and calculate the initial scores */
        this._sequenceSortingAlgorithms = new SequenceSorting(this._rawData);
        this.calculate_all_sorting_scores(this._rawData[0]);

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

    getSequenceFrequencyAt: function(position) {
      return this._sequenceSortingAlgorithms.getMostFrequentAt(position)
    },

    getFamily: function() {
      return this._parsedData;
    },

    /* Setter for the names of the proteins from the family */
    setProteinNames : function () {
      this._proteinNames = d3.set(this._rawData.map(function( residue )
      { return residue.name; } )).values();
      /* Set the initial selected protein to the first name */
      this.setSelectedProtein(this._proteinNames[0]);
    },

    getProteinNames : function() { return this._proteinNames; },

    getSelectedProtein: function () {
      return this._selectedProtein;
    },

    setSelectedProtein: function (proteinName) {
      this._selectedProtein = _.filter(this._rawData, ['name', proteinName])[0];
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
      this._previousSelectedResidues[position] = this._selectedResidues[position];
      this._selectedResidues[position] = selection;
      /* Notify all listeners */
      this.selectedResiduesChanged.notify(
          { semantic : position,
            selection: this._selectedResidues[position],
            previous : this._previousSelectedResidues[position]
          }
      );
      return this;
    },

    getProteinSorting: function () { return this._proteinSorting; },

    getProteinColoring: function () { return this._proteinColoring; },

    setProteinSorting: function (sorting) {
      this._proteinSorting = sorting;
      this.proteinSortingChanged.notify({scheme: this._proteinSorting});
      return this;
    },

    setProteinColoring: function (coloring) {
      this._proteinColoring = coloring;
      this.proteinColoringChanged.notify({scheme: this._proteinColoring});
      return this;
    },

    isEmpty : function() {
      return !!this._parsedData;
    }
  };

  return ProteinFamilyModel;
})();
