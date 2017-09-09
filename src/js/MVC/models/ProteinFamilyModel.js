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
    self._mappings = {};

    /* Update Events */
    self.proteinFamilyAdded          = new EventNotification(this);
    self.selectedProteinChanged      = new EventNotification(this);
    self.selectedResiduesChanged     = new EventNotification(this);
    /* Menu Filtering */
    self.proteinSortingChanged       = new EventNotification(this);
    self.proteinColoringChanged      = new EventNotification(this);

    /* Promises */
    self.mappingPromise = null;

    /* Setter for the different types of similarity scores */
    self.set_scores = function(metric, scores) {
      scores.forEach( (o) => {
        let member = _.find(self._rawData, (m) => { return o.name === m.name} );
        member.scores[metric] = o.score;
      });
    };

    /* Calculate all of the sorting metrics for family */
    self.calculate_all_sorting_scores_main = function(protein) {
      /* Calculate the edit distance scores with the first protein and enable the menu option */
      let edit_dist = self._sequenceSortingAlgorithms.calculateEditDistanceScores(protein),
      /* Calculate the weighted edit distance scores with the first protein and enable the menu option */
      weighted_edit_dist = self._sequenceSortingAlgorithms.calculateEditDistanceScores(protein,
          {insertion: 3, deletion: 3, substitution: 5}),
      /* Calculate the residue commonality scores with the first protein and enable the menu option */
      commonality = self._sequenceSortingAlgorithms.calculateCommonalityScores(protein),
      /* Calculate the weighted residue commonality scores with the first protein and enable the menu option */
      weighted_commonality = self._sequenceSortingAlgorithms.calculateCommonalityScores(protein, 1)
      ;
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
    };
  }

  ProteinFamilyModel.prototype = {

    isEmpty : function() {
      return !!this._parsedData;
    },

    /* Setter for the names of the proteins from the family */
    setFamily : function(data, type) {
      this._rawData = App.fileUtilities.parseAlignmentFile(data, type);
      map_trend_image_data(this._rawData).then(function(parsed_data) {

        this._parsedData = parsed_data;
        this.setProteinNames();
        this.mappingPromise = App.promiseUtilities.makeQueryablePromise(this.setProteinMappings());

        /* Setup the sequence sorting algorithms and calculate the initial scores */
        this._sequenceSortingAlgorithms = new SequenceSorting(this._rawData);

        /* If the browser does not support web workers, execute the code sequentially */
        if (!window.Worker) {
          this.calculate_all_sorting_scores_main(this._rawData[0]);
        }
        else {

          let algorithms = this._sequenceSortingAlgorithms.getAlgorithms(),
              workers = algorithms.length,
              finished = 0,
              model = this;

          /* Iterate over each algorithm and launch a worker*/
          algorithms.forEach(function(algorithm){
            let myWorker = new Worker("src/js/utilities/sequenceSortingProcessing.js");
            myWorker.postMessage({
              family: model._rawData,
              algorithm: algorithm,
              protein: model._rawData[0]
            });

            /* Add the scores to the model once it returns */
            myWorker.onmessage = function(response) {
              model.set_scores(response.data.algorithm, response.data.score);
              finished++;
              if(workers === finished){
                $("#sorting_list").find("li").removeClass("disabled");
              }
            };
          });
        }

        this.proteinFamilyAdded.notify({family: this._parsedData});
      }.bind(this));
    },

    clear: function() {
      this._parsedData = null;
      this._rawData = null;
      this._mappings = {};
      this._selectedProtein = null;
      this._selectedResidues = {left: [], right: []};
      this._previousSelectedResidues = {left: [], right: []};
      this.mappingPromise = null;

      this._sequenceSortingAlgorithms = null;

      this._proteinSorting = "";
      this._proteinColoring = "";

      this._proteinNames = null;
      this._parsedData = null;
    },

    getMaxSequenceFrequenciesFromRange: function(range) {
      let fragments = this._sequenceSortingAlgorithms.getFragmentCountsFromRange(range[0], range[1]),
          curFragments = [];
      fragments.forEach(function(fragment) {
        /* Get the highest occurring residue and it's frequency */
        curFragments.push(_.maxBy(_.toPairs(fragment), function(o){ return o[1] }));
      });
      return curFragments;
    },

    getSequenceFrequenciesFromRange: function(range) {
      return this._sequenceSortingAlgorithms.getFragmentCountsFromRange(range[0], range[1]);
    },

    getSequenceFrequencyAt: function(position) {
      return this._sequenceSortingAlgorithms.getMostFrequentAt(position)
    },

    getFamily: function() {
      return this._parsedData;
    },

    getProteinMappings: function(name) {
      if(this.mappingPromise.isFulfilled())
        return this._mappings[name];
    },

    setProteinMappings: function() {
      let self = this;
      return new Promise(function(resolve, reject){
        /* Get the mnemonics of each protein */
        let pdbQueryString = [];
        let allQueryString = [];
        self._proteinNames.forEach(function(name,i,all){
          if(name.length === 4){
            pdbQueryString.push(name);
          }
          allQueryString.push(name);
          self._mappings[name] = [];
        });
        /* Query PDB and uniprot */
        Promise.all([App.dataUtilities.checkPDBs(pdbQueryString.join(',')),
          App.dataUtilities.queryForUniprotIdentifiers(allQueryString.join(','))])
          .then(function(results){
            /* Parse the PDB data*/
            [].map.call(results[0].querySelectorAll("record"), function(record) {
              let record_selector = d3.select(record);
              return{
                pdb: record_selector.attr("structureId"),
                status: record_selector.attr("status")
              }
            })
              .forEach(function(protein){
                if(protein.status !== "UNKNOWN" && self._mappings[protein.pdb].indexOf(protein.pdb) < 0){
                  self._mappings[protein.pdb].push(protein.pdb);
                }
              });
            /* Parse the uniprot data*/
            results[1].forEach(function(protein){
              let proteins = protein.pdb.split(';');
              proteins.forEach(function(p){
                if(p.length > 0 && self._mappings[protein.id].indexOf(p) < 0){
                  self._mappings[protein.id].push(p)
                }
              });
            });
          resolve(self._mappings);
          });
      });
    },

    setProteinNames : function () {
      this._proteinNames = d3.set(this._rawData.map(function( residue )
      { return residue.name; } )).values();
      /* Set the initial selected protein to the first name */
      this.setSelectedProtein(this._proteinNames[0]);
    },

    getProteinNames : function() { return this._proteinNames; },

    getProteinCount : function() { return this._proteinNames.length; },

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
      /* Reorder the raw data */
      let ordering_scores = _.chain(this._rawData)
          .sortBy((protein) => {
            return protein.scores[sorting];
          }).reverse().slice(0, this.ppv).value(),
      /* Save a reference to the model */
          model = this;
      /* Remap the data then notify the controller */
      map_trend_image_data(ordering_scores).then(function(parsed_data){
        /* Save the new parsed data and names */
        model._parsedData = parsed_data;
        model.setProteinNames();
        /* notify the listeners */
        model.proteinSortingChanged.notify({
          scheme: model._proteinSorting,
          data : parsed_data,
          colorScheme: model._proteinColoring});
        return Promise.resolve();
      });
      return this;
    },

    setProteinColoring: function (coloring) {
      this._proteinColoring = coloring;
      this.proteinColoringChanged.notify({scheme: this._proteinColoring});
      return this;
    }

  };

  return ProteinFamilyModel;
})();
