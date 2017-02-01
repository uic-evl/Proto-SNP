"use strict";

// Global Application variable
var App = App || {};

/*** KO Class ***/
function ApplicationModel() {

  // self reference
  let self = {};

  // Default viewer options
  self.options = {
    antialias: true,
    quality : 'medium',
    background: 'black'
  };

  // array to hold the proteins
  self.proteins = {};

  // Left and Right Proteins for the Viewers
  self.leftProtein = {};
  self.rightProtein = {};

  // Protein Family Object -- Trend Image
  self.proteinFamily = {};

  /* Determines which method to load the protein */
  function load_protein(viewer, file){
    // if the data method is from an uploaded file
    if(file){
      return load_from_upoaded_file(file, viewer);
    }
    // else from a download
    else {

      /* create a variable to use to test a promise */
      let protein_name = viewer.name;

      /* If the name is greater than 4 characters, it is not PDB format*/
      if(viewer.name.length > 4) {
        protein_name = App.dataUtils.mneumonicToPDB(viewer.name);
      }

      /* Fetch/Load the model from RCMP PDB */
      return Promise.resolve(protein_name)
        .then(function(name){
          return load_PDB_From_RCMB(name, viewer);
        })
        .catch(function() {
          /* Reject the operation */
          return Promise.reject(null);
        });
    }
  }

  /* Load the protein from RCMB */
  function load_PDB_From_RCMB(proteinName, pointer){
    /* perform an async download from RCMB to fetch the requested PDB File */
    return new Promise(function(resolve, reject){
      pv.io.fetchPdb('https://files.rcsb.org/download/' + proteinName + '.pdb', function(structure) {
        /*Save the protein structure*/
        pointer.structure = structure;
        /* Resolve the promise */
        resolve(pointer.structure);
      });
    });
  }

  /* Load the protein from the uploaded file */
  function load_from_upoaded_file(file, pointer){
    /* perform an async loading of the uploaded file */
    return new Promise(function(resolve, reject){
      /*Save the protein structure*/
      pointer.structure = pv.io.pdb(file, {loadAllModels:true})[0];
      /* Resolve the promise */
      resolve(pointer.structure);
    });
  }

  /* Render the 3D and Sequence Views */
  function render_views(structure) {

    /* No structure was returned */
    if(!structure) return;

    /* Render the 3D view */
    this.view.render(structure, this.modelPointer.name);

    // get the sequence of the protein
    this.modelPointer.sequence = this.view.getSequence(this.modelPointer.structure, 0);

    // initialize the sequence viewer
    App.sequenceViewer.init(this.viewPosition + "Viewer-Sequence");

    /* Check if a sequence is already added to the list, if so align them*/
    if(this.siblingPointer.name){
      /* Align the sequences */
      App.align(this.modelPointer.sequence, this.siblingPointer.sequence, {})
        .then(function(seq){
          /* Set the model sequences */
          this.modelPointer.sequence   = (this.viewPosition === "left")
            ? seq.leftSequence  : seq.rightSequence;
          this.siblingPointer.sequence = (this.siblingPosition === "right")
            ? seq.rightSequence : seq.leftSequence;

          /* Render the other sequence */
          App.sequenceViewer.render(this.siblingPosition + "Viewer-Sequence", this.siblingPointer.sequence);
        }.bind(this));
    }
    // render the sequence list
    App.sequenceViewer.render(this.viewPosition + "Viewer-Sequence", this.modelPointer.sequence);
  }

  /* Form callback to process the request to load a new protein */
  function fetch_and_store_protein(formData, file) {

    // view variable
    let viewOptions = {};

    viewOptions.view = App.leftMolecularViewer;

    // model pointers
    viewOptions.modelPointer   = self.leftProtein;
    viewOptions.siblingPointer = self.rightProtein;

    // left or right view
    viewOptions.viewPosition    =  "#";
    viewOptions.viewPosition += (formData.position) ? formData.position : formData.id.split('-')[0];
    viewOptions.siblingPosition = "#right";

    // Determine the viewer
    if(viewOptions.viewPosition === "#right") {
      /* Swap the views */
      viewOptions.view           = App.rightMolecularViewer;
      /* Swap the views */
      viewOptions.modelPointer   = self.rightProtein;
      viewOptions.siblingPointer = self.leftProtein;
      /* Swap the positions */
      viewOptions.siblingPosition    = "#left";
    }

    /* Parse the input */
    viewOptions.modelPointer.name = (formData.protein_name) ? formData.protein_name : $(formData).serialize().split('=')[1];

    /* load the pdb file for each viewer */
    load_protein(viewOptions.modelPointer, file)
    /* Once the data has been loaded, get the sequence and render the view */
      .then(function(structure) {

        /* Remove the splash overlay */
        $(viewOptions.viewPosition + 'Splash').remove();

        /* initialize the molecular viewer */
        viewOptions.view.init(viewOptions.viewPosition + 'Viewer', self.options);

        /* Render the views */
        render_views.call(viewOptions, structure);

      })
      .catch(function() { console.log("Protein not found") });

    /* Return false to prevent the form from reloading the page */
    return false;
  }

  /* Form callback to process the family datafile */
  function parse_and_store_family(file) {

    /* Remove the Splash screen */
    $("#trendSplash").remove();
    self.proteinFamily = new ProteinFamily(file);

    /* Create the sorting callbacks */
    self.sortedSequences = new SequenceSorting(self.proteinFamily.getFamily());
    self.sortedSequences.calculateFrequency();

    /* Initialize the trend image view */
    App.trendImageViewer.init("#trendImageViewer", self.sortedSequences);
    App.trendImageViewer.render(self.proteinFamily.getFamily());
  }

  /* Return the public-facing functions */
  return {
    processProteinRequest : fetch_and_store_protein,
    processProteinFamily  : parse_and_store_family
  };
}