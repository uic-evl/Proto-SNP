"use strict";

// Global Application variable
var App = App || {};

/*** KO Class ***/
function Proteins() {
  // self reference
  let self = this;

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
  function loadProtein(viewer, file){
    // if the data method is from an uploaded file
    if(file){
      return loadFromUpoadedFile(file, viewer);
    }
    // else from a download
    else {
      return loadPDBFromRCMB(viewer.name, viewer);
    }
  }

  /* Load the protein from RCMB */
  function loadPDBFromRCMB(proteinName, pointer){
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
  function loadFromUpoadedFile(file, pointer){
    /* perform an async loading of the uploaded file */
    return new Promise(function(resolve, reject){
      /*Save the protein structure*/
      pointer.structure = pv.io.pdb(file, {loadAllModels:true})[0];
      /* Resolve the promise */
      resolve(pointer.structure);
    });
  }

  /* Render the 3D and Sequence Views */
  function renderViews(structure) {
    /* Render the 3D view */
    this.view.render(structure, this.modelPointer.name);
    // get the sequence of the protein
    this.modelPointer.sequence = this.view.getSequence(this.modelPointer.structure, 0);

    // initialize the sequence viewer
    App.sequenceViewer.init(this.viewPosition + "Viewer-Sequence");

    /* Check if a sequence is already added to the list, if so align them*/
    if(this.siblingPointer.name){
      /* Align the sequences */
      let seq = App.align(this.modelPointer.sequence, this.siblingPointer.sequence, {});

      /* Set the model sequences */
      this.modelPointer.sequence   = (this.viewPosition === "left")
        ? seq.leftSequence  : seq.rightSequence;
      this.siblingPointer.sequence = (this.siblingPosition === "right")
        ? seq.rightSequence : seq.leftSequence;

      /* Render the other sequence */
      App.sequenceViewer.render(this.siblingPosition + "Viewer-Sequence", this.siblingPointer.sequence);
    }
    // render the sequence list
    App.sequenceViewer.render(this.viewPosition + "Viewer-Sequence", this.modelPointer.sequence);
  }

  /* Form callback to process the request to load a new protein */
  function fetchAndStoreProtein(formData, file) {

    // view variable
    let viewOptions = {};

    viewOptions.view = App.leftViewer;

    // model pointers
    viewOptions.modelPointer   = self.leftProtein;
    viewOptions.siblingPointer = self.rightProtein;

    // left or right view
    viewOptions.viewPosition    =  "#";
    viewOptions.viewPosition += (file) ? formData.position : formData.id.split('-')[0];
    viewOptions.siblingPosition = "#right";

    // Determine the viewer
    if(viewOptions.viewPosition === "#right") {
      /* Swap the views */
      viewOptions.view           = App.rightViewer;
      /* Swap the views */
      viewOptions.modelPointer   = self.rightProtein;
      viewOptions.siblingPointer = self.leftProtein;
      /* Swap the positions */
      viewOptions.siblingPosition    = "#left";
    }

    /* Remove the splash overlay */
    $(viewOptions.viewPosition + 'Splash').remove();

      /* Parse the input */
    viewOptions.modelPointer.name = (file) ? formData.name : $(formData).serialize().split('=')[1];

      // initialize the left viewer
    viewOptions.view.init(viewOptions.viewPosition + 'Viewer', self.options);

      /* load the pdb file for each viewer */
      loadProtein(viewOptions.modelPointer, file)
      /* Once the data has been loaded, get the sequence and render the view */
      .then(renderViews.bind(viewOptions));
    /* Return false to prevent the form from reloading the page */
    return false;
  }

  /* Form callback to process the family datafile */
  function parseAndStoreFamily(file) {

    /* Remove the Splash screen */
    $("#trendSplash").remove();
    self.proteinFamily = new ProteinFamily(file);
    /* Initialize the trend image view */
    App.trendImageViewer.init("#trendImageViewer");

    App.trendImageViewer.render(self.proteinFamily.getFamily());

  }

  /* Return the public-facing functions */
  return {
    processProteinRequest : fetchAndStoreProtein,
    processProteinFamily  : parseAndStoreFamily
  };
}