"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var MolecularViewer = function(){

  /* initialize the molecular viewer global variable */
  let viewer = {};

  function initialize(id, options) {

    /* get the DOM element by the id parameter */
    viewer.domObj = d3.select(id).node();

    /* check if viewing options were passed in */
    options = options || {};

    /* get/save the width and height of the given DOM element */
    viewer.width = viewer.domObj.clientWidth;
    viewer.height = viewer.width * 0.9;

    /* add the width and height to the options */
    options.width = viewer.width;
    options.height = viewer.height;

    /* insert the viewer under the DOM element */
    viewer.pvViewer = pv.Viewer(d3.select(id).node(), options);
  }

  function render(structure, proteinName) {

    /* Display the protein as cartoon, coloring the secondary structure
       elements in a rainbow gradient */
    viewer.pvViewer.cartoon(proteinName, structure, { color : color.ssSuccession() });

    /* center the structure in the view */
    // center in viewer
    viewer.pvViewer.centerOn(structure);
    // auto zoom to fit
    viewer.pvViewer.autoZoom();
  }

  function load(proteinName, file){
    // if the data method is from an uploaded file
    if(file){
      return loadFromUpoadedFile(file);
    }
    // else from a download
    else {
      return loadPDBFromRCMB(proteinName);
    }
  }

  function loadPDBFromRCMB(proteinName){
    /* perform an async download from RCMB to fetch the requested PDB File */
    return new Promise(function(resolve, reject){
      pv.io.fetchPdb('https://files.rcsb.org/download/' + proteinName + '.pdb', function(structure) {
        /* Store the structure */
        viewer.structure = structure;
        /* Resolve the promise */
        resolve(structure);
      });
    });
  }

  function loadFromUpoadedFile(file){
    /* perform an async loading of the uploaded file */
    return new Promise(function(resolve, reject){
      /* Store the structure */
      viewer.structure = pv.io.pdb(file, {loadAllModels:true})[0];
      /* Resolve the promise */
      resolve(viewer.structure);
    });

  }

/* Accessor to get the underlying structure in the viewer */
function getStructure() { return viewer.structure; }

/* Accessor to get the viewer's height and width */
function getDimensions() { return {width: viewer.width, height: viewer.height }}

/* Accessor to get the underlying sequence of the Protein*/
function getSequence(chain) {
  // Array to store the sequence
  let seq = [];

  /* Iterate over the residues of the chain and add them to the array*/
  viewer.structure.chains()[chain || 0].eachResidue(function(res){
    seq.push(res.name());
  });

  // return the sequence
  return seq;
}

/* return the public-facing functions */
return {
  init          : initialize,
  loadProtein   : load,
  render        : render,
  getStructure  : getStructure,
  getSequence   : getSequence,
  getDimensions : getDimensions
};

};