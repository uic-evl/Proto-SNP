"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
let MolecularViewer = function(){

  /* initialize the molecular viewer global variable */
  let molecularViewer = {};
  let residueModel = new ResidueModel();

  function colorProteinBy() {
    return new pv.color.ColorOp(function (atom, out, index) {

      /* Select the color corresponding to the residue and mapping*/
     let color  = residueModel.getColor(App.colorMapping, atom._residue._name).rgba;

     /*Set the RGBA output color */
     out[index+0]= color[0] / 255.0; out[index+1]= color[1] / 255.0;
     out[index+2]= color[2] / 255.0; out[index+3]= color[3] / 255.0;
    });
  }
    function initialize(div_id, options) {

    /* get the DOM element by the id parameter */
    molecularViewer.domObj = d3.select(div_id).node();

    /* check if viewing options were passed in */
    options = options || {};

    /* get/save the width and height of the given DOM element */
    molecularViewer.width = App.molecularViewerWidth;
    molecularViewer.height = App.molecularViewerHeight;

    /* add the width and height to the options */
    options.width = molecularViewer.width;
    options.height = molecularViewer.height;

    /* insert the molecularViewer under the DOM element */
    molecularViewer.pvViewer = pv.Viewer(d3.select(div_id).node(), options);
  }

  function render(structure, proteinName) {

    /* Display the protein in the specified rendering, coloring by the specified property */
    switch(App.renderingStyle){
      case "cartoon":
        molecularViewer.pvViewer.cartoon(proteinName, structure, {color : colorProteinBy()});
        break;
    }


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