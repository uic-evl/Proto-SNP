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
        self._selectedProteinIndex = 0;
        self._selectedProteinOffset = 0;
        self._selectedResidues = {left: [], right: []};
        self._previousSelectedResidues = {left: [], right: []};

        self._sequenceSortingAlgorithms = null;

        self._proteinSorting = "initial";
        self._proteinColoring = "";

        self._proteinNames = null;
        self._parsedData = null;
        self._fileName = "";
        self._mappings = {};

        self._max_frequencies = [];

        /* Update Events */
        self.proteinFamilyAdded          = new EventNotification(this);
        self.selectedProteinChanged      = new EventNotification(this);
        self.proteinOverviewChanged      = new EventNotification(this);
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
            self._sequenceSortingAlgorithms.calculateEditDistanceScores(protein)
                .then(function(edit_scores){
                    /* Set the family scores */
                    self.set_scores("edit_distance", edit_scores);
                    /* Calculate the weighted edit distance scores with the first protein and enable the menu option */
                    return self._sequenceSortingAlgorithms.calculateEditDistanceScores(protein,
                        {insertion: 3, deletion: 3, substitution: 5});
                })
                .then(function(weighted_edit_scores){
                    /* Set the family scores */
                    self.set_scores("weighted_edit_distance", weighted_edit_scores);
                    /* Calculate the residue commonality scores with the first protein and enable the menu option */
                    return self._sequenceSortingAlgorithms.calculateCommonalityScores(protein);
                })
                .then(function(commonality_scores){
                    /* Set the family scores */
                    self.set_scores("commonality_scores", commonality_scores);
                    /* Calculate the weighted residue commonality scores with the first protein and enable the menu option */
                    self._sequenceSortingAlgorithms.calculateCommonalityScores(protein, 1);
                })
                .then(function(normalized_commonality_scores){
                    /* Set the family scores */
                    self.set_scores("normalized_commonality_scores", normalized_commonality_scores);
                    /* Enable sorting menu */
                    $("#sorting_list").find("li").removeClass("disabled");
                });
        };
    }

    ProteinFamilyModel.prototype = {

        isEmpty : function() {
            return !!this._parsedData;
        },

        /* Clear the model to load a new family */
        clear: function() {
            this._parsedData = null;
            this._rawData = null;
            this._mappings = {};
            this._selectedProtein = null;
            this._selectedProteinIndex = 0;
            this._selectedResidues = {left: [], right: []};
            this._previousSelectedResidues = {left: [], right: []};
            this.mappingPromise = null;
            this._max_frequencies = [];

            this._sequenceSortingAlgorithms = null;

            this._proteinSorting = "initial";
            this._proteinColoring = "";

            this._proteinNames = null;
            this._parsedData = null;
            this._fileName = "";

            /* Update Events */
            this.selectedProteinChanged.clear();
            this.selectedResiduesChanged.clear();
        },

        calculate_scores : function(protein, cb) {
            /* If the browser does not support web workers, execute the code sequentially */
            if (!window.Worker) {
                this.calculate_all_sorting_scores_main(protein);
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
                        protein: protein
                    });

                    /* Add the scores to the model once it returns */
                    myWorker.onmessage = function(response) {
                        model.set_scores(response.data.algorithm, response.data.score);
                        finished++;
                        if(workers === finished){
                            $("#sorting_list").find("li").removeClass("disabled");
                            if(cb) cb();
                        }
                    };
                });
            }
        },

        addProteinMapping: function(name,protein) {
            if(this._mappings[name].indexOf(protein.pdb) < 0){
                this._mappings[name].push(protein.pdb);
                return true;
            }
            return false;
        },

        /* Setter for the names of the proteins from the family */
        setFamily : function(data, type, file_name) {
            this._fileName = file_name;
            this._rawData = App.fileUtilities.parseAlignmentFile(data, type);
            map_trend_image_data(this._rawData).then(function(parsed_data) {

                /* Setup the sequence sorting algorithms and calculate the initial scores */
                this._sequenceSortingAlgorithms = new SequenceSorting(this._rawData);

                this._parsedData = parsed_data;
                this.setProteinNames();

                /* Set the initial selected protein to the first name */
                this.setSelectedProtein(this._proteinNames[0]);

                this.setColumnFrequencies();
                this.mappingPromise = this.setProteinMappings();

                /* Calculate the similarity scores between proteins */
                this.calculate_scores(this._rawData[0]);

                this.proteinFamilyAdded.notify({
                    family: this._parsedData,
                    proteinCount: this._proteinNames.length,
                    sequenceLength: this._rawData[0].length
                });
            }.bind(this));
        },

        setSortingProtein: function() {
            let self = this,
                elements = self.getProteinNames();
            /* Open the selection modal and setup auto-complete */
            $('#proteinSelection').modal('show')
                .on('shown.bs.modal', function (event) {
                    /* Setup the input prediction list*/
                    let proteins = new Bloodhound({
                        datumTokenizer: Bloodhound.tokenizers.whitespace,
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        local: elements
                    });
                    /* Initialize the input prediction */
                    $('#proteinSortSelection').typeahead(
                        {
                            hint: true,
                            highlight: true,
                            minLength: 1
                        },
                        {
                            name: 'proteins',
                            source: proteins
                        });
                    /* Give the input focus */
                    $(event.target).find('#proteinSortSelection').focus();
                })
                .on("hide.bs.modal", function(event){
                    /* Get the protein based on the input of the user */
                    let inputField = $(event.target).find('#proteinSortSelection'),
                        proteinName = inputField.val(),
                        protein = _.filter(self._rawData, ['name', proteinName])[0];
                    /* Clear the protein */
                    inputField.val('');
                    /* If it was a valid protein, set the sorting to be based on the selection*/
                    if(protein){
                        self.calculate_scores(protein, self.setProteinSorting.bind(self,self._proteinSorting));
                    }
                });
        },

        setOverviewOffset: function(offset){
            this._selectedProteinOffset = offset;
            // /* Set the selected protein to reflect the change */
            let selection = this._proteinNames[this._selectedProteinIndex + this._selectedProteinOffset];
            this._selectedProtein = _.filter(this._rawData, ['name', selection])[0];
            this.proteinOverviewChanged.notify({selection: this._selectedProtein});
            this.selectedProteinChanged.notify({selection: this._selectedProtein});
        },

        setSelectedProtein: function (protein_name) {
            this._selectedProtein = _.filter(this._rawData, ['name', protein_name])[0];
            this._selectedProteinIndex = this._proteinNames.indexOf(protein_name);
            /* Notify all listeners */
            this.selectedProteinChanged.notify({selection: this._selectedProtein});
            return this;
        },

        setSelectedResidues: function (position, selection) {
            if(_.intersection(this._selectedResidues[position], selection).length === selection.length){
                return this;
            }
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

        setProteinSorting: function (sorting) {
            if(sorting){
                this._proteinSorting = sorting;
                let
                    /* Save a reference to the model */
                    model = this;
                /* Reorder the raw data */
                this._rawData = _.chain(this._rawData)
                    .sortBy((protein) => {
                        return protein.scores[sorting];
                    }).reverse().slice(0, this.ppv).value();
                /* Remap the data then notify the controller */
                map_trend_image_data(this._rawData).then(function(parsed_data){
                    /* Save the new parsed data and names */
                    model._parsedData = parsed_data;
                    model.setProteinNames();
                    /* Set the selected protein to reflect the change */
                    let selection = model._proteinNames[model._selectedProteinIndex + model._selectedProteinOffset];
                    if(!selection) {
                        selection = model._proteinNames[0];
                    }
                    model.setSelectedProtein(selection);
                    /* notify the listeners */
                    model.proteinSortingChanged.notify({
                        scheme: model._proteinSorting,
                        data : parsed_data,
                        colorScheme: model._proteinColoring});
                    return Promise.resolve();
                });
            }
            return this;
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
                        results[0]
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

        setProteinNames : function (data) {
            this._proteinNames = d3.set(this._rawData.map(function( residue )
            { return residue.name; } )).values();
        },

        setColumnFrequencies : function () {
            /* iterate over the columns*/
            let i = 0;
            for(let residue of this._parsedData.data[0]){
                this._max_frequencies.push(this._sequenceSortingAlgorithms.getMostFrequentAt(i++));
            }
        },

        setProteinColoring: function (coloring) {
            this._proteinColoring = coloring;
            this.proteinColoringChanged.notify({scheme: this._proteinColoring});
            return this;
        },

        getCurrentProteinPosition : function() {
            return this._selectedProteinIndex;
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
            return this._max_frequencies[position];
        },

        getFileName: function() {
            return this._fileName;
        },

        getFamily: function() {
            return this._parsedData;
        },

        getProteinMappings: function() {
            return this.mappingPromise;
        },

        getProteinNames : function() { return this._proteinNames; },

        getProteinCount : function() { return this._proteinNames.length; },

        getSequenceCount : function() { return this._rawData[0].length; },

        getSelectedProtein: function () {
            let selection = this._proteinNames[this._selectedProteinIndex + this._selectedProteinOffset];
            return _.filter(this._rawData, ['name', selection])[0];
        },

        getSelectedResidues: function (position) {
            return {
                selection: this._selectedResidues[position],
                previous: this._previousSelectedResidues[position]
            }
        },

        getProteinSorting: function () { return this._proteinSorting; },

        getProteinColoring: function () { return this._proteinColoring; },
    };

    return ProteinFamilyModel;
})();
