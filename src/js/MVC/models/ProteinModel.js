"use strict";

var App = App || {};

const ProteinModel = (function() {

    function ProteinModel() {
        let self = this;

        self._proteinStructure = null;
        self._proteinName = "";
        self._geometry = null;
        self._selectedResidue = [];
        self._selectedChain = "";

        self._proteinSorting = "";
        self._proteinColoring = "Side Chain Class";
        self._rotation = {};
        self._zoom = null;
        self._center = null;

        self.proteinAdded = new EventNotification(this);
        self.proteinChanged = new EventNotification(this);

        self.residueSelected = new EventNotification(this);
        self.residueDeselected = new EventNotification(this);
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

        setStructure: function(structure) { this._proteinStructure = structure },

        /* Accessor to get the underlying geometry in the molecularViewer */
        getGeometry: function() { return this._geometry; },

        getSequence: function(structure, chain) {
            /* Set the chain */
            this._selectedChain = chain || 0;
            // Array to store the sequence
            let name_seq = [];
            /* Iterate over the residues of the chain and add them to the array*/
            structure.chains()[this._selectedChain].eachResidue(function(res){
                name_seq.push(res.name());
            });
            // return the sequence
            return {name: name_seq, abbr: App.residueMappingUtility.mapToAbbr(name_seq)};
        },

        getChain: function() { return this._selectedChain; },

        getName: function() { return this._proteinName},

        addProtein : function(metadata, file) {
            this.load_protein(metadata, file).then(function(structure){

                this._proteinStructure = structure;
                this._proteinName = metadata.protein_name;
                this.proteinAdded.notify({structure:this._proteinStructure, name:metadata.protein_name});

                /* Associate the protein if loaded from the family */
                if(metadata.associated_protein){
                    let family_seq = App.residueMappingUtility.removeGaps(metadata.associated_protein.sequence)
                        , protein_seq = this.getSequence(structure),

                        p1 = `>${this._proteinName}:A\n${protein_seq.abbr.join("")}`,
                        p2 = `>${metadata.associated_protein.name}\n${family_seq}`,

                        alignment = pairwiseAlignProtein(p1, p2, {gap: 10, begin:0, end:0.0}).split(">");

                  /* Open the modal */
                  $('#proteinAlignmentModal').modal('show')
                  .on('shown.bs.modal', function (event) {

                    var m = msa({
                      el: document.getElementById("protein_alignment"),
                      // seqs: seqs,
                      vis: {
                        conserv: false,
                        overviewbox: false
                      },
                      // smaller menu for JSBin
                      menu: "small",
                      bootstrapMenu: true
                    });

                    let protein_1 = alignment[1].split("\n")
                        , protein_2 = alignment[2].split("\n");

                    m.seqs.add({seq:protein_1[1]});
                    m.seqs.add({seq:protein_2[1]});

                    m.render();
                  });


                }

            }.bind(this));
        },

        /* Clear the model instance variables and data */
        clear: function() {
            this._proteinStructure = null;
            this._geometry = null;
            this._selectedResidue = [];

            this._proteinName = "";
            this._proteinSorting = "";
            this._proteinColoring = "";
        },

        selectResidue : function(options) {
            if(options.replace){
                this._selectedResidue = [options.residue];
            }
            else{
                this._selectedResidue.push(options.residue);
            }
            /* Notify the listeners that the selection has been changed */
            this.residueSelected.notify(options);
        },

        deselectResidue : function(options) {
            let index = this._selectedResidue.indexOf(options.residue);
            this._selectedResidue.splice(index, 1);
            /* Notify the listeners that the selection has been changed */
            this.residueDeselected.notify(options);
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

        setProteinColoring: function (coloring, interaction) {
            this._proteinColoring = coloring;
            if(this.isEmpty()){
                this.proteinColoringChanged.notify({scheme: coloring});
            }
            return this;
        },

        getProteinColoring: function() {
            return this._proteinColoring;
        },

        isEmpty : function() {
            return !!this._proteinStructure;
        }

    };

    return ProteinModel;
})();
