"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var MolecularViewer = function(){

  /* initialize the molecular viewer global variable */
  let molecularViewer = {};

  function initialize(id, options) {

    /* get the DOM element by the id parameter */
    molecularViewer.domObj = d3.select(id).node();

    /* check if viewing options were passed in */
    options = options || {};

    /* get/save the width and height of the given DOM element */
    molecularViewer.width = App.molecularViewerWidth;
    molecularViewer.height = App.molecularViewerHeight;

    /* add the width and height to the options */
    options.width = molecularViewer.width;
    options.height = molecularViewer.height;

    /* insert the molecularViewer under the DOM element */
    molecularViewer.pvViewer = pv.Viewer(d3.select(id).node(), options);
  }

  function render(structure, proteinName) {

    /* Display the protein as cartoon, coloring the secondary structure
       elements in a rainbow gradient */
    molecularViewer.pvViewer.cartoon(proteinName, structure, { color : color.ssSuccession() });

    /* center the structure in the view */
    // center in molecularViewer
    molecularViewer.pvViewer.centerOn(structure);
    // auto zoom to fit
    molecularViewer.pvViewer.autoZoom();
  }

/* Accessor to get the underlying structure in the molecularViewer */
function get_structure() { return molecularViewer.structure; }

/* Accessor to get the molecularViewer's height and width */
function get_dimensions() { return {width: molecularViewer.width, height: molecularViewer.height }}

/* Accessor to get the underlying sequence of the Protein*/
function get_sequence(structure, chain) {
  // Array to store the sequence
  let seq = [];

  /* Iterate over the residues of the chain and add them to the array*/
  structure.chains()[chain || 0].eachResidue(function(res){
    seq.push(res.name());
  });

  // return the sequence
  return seq;
}

/* return the public-facing functions */
return {
  init          : initialize,
  render        : render,
  getStructure  : get_structure,
  getSequence   : get_sequence,
  getDimensions : get_dimensions
};

};