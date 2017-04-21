"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
let MolecularViewer = function(){

  /* initialize the molecular viewer global variable */
  let molecularViewer = {};
  let molecularController = null;


  function colorProteinBy() {
    let colorMapping = App.residueModel.getColor(App.colorMapping);
    return new pv.color.ColorOp(function (atom, out, index) {
      /* Select the color corresponding to the residue and mapping*/
     let color  = colorMapping(atom._residue._name).rgba;

     /*Set the RGBA output color */
     out[index+0]= color[0] / 255.0; out[index+1]= color[1] / 255.0;
     out[index+2]= color[2] / 255.0; out[index+3]= color[3] / 255.0;
    });
  }


  /* Recolor the protein according to the current coloring scheme */
  function recolor(){

    let geometry = get_geometry(),
        viewer   = get_viewer();

    /* Check to make sure the view is active*/
    if(geometry){
      /* Recolor */
      geometry.colorBy(colorProteinBy());
      /* Redraw */
      viewer.requestRedraw();
    }
  }


  /* Render the title of the viewer */
  function updateViewTitle(title) {
    d3.select(molecularViewer.parentNode).select('p.view')
      .html(_.toUpper(title));
  }


  function render(structure, proteinName) {

    /* Place the name of the protein above the viewer*/
    updateViewTitle(proteinName);

    /* Display the protein in the specified rendering, coloring by the specified property */
    switch(App.renderingStyle){
      case "cartoon":
        molecularViewer.geom = molecularViewer.pvViewer.cartoon(proteinName, structure, {color : colorProteinBy()});
        break;
    }

    /* center the structure in the view */
    // center in molecularViewer
    molecularViewer.pvViewer.centerOn(structure);
    // auto zoom to fit
    molecularViewer.pvViewer.autoZoom();
  }


  /* Accessor to get the underlying structure in the molecularViewer */
  function get_structure() { return molecularViewer.geom.structure(); }


  /* Accessor to get the underlying geometry in the molecularViewer */
  function get_geometry() { return molecularViewer.geom; }


  /* Accessor to get the underlying geometry in the molecularViewer */
  function get_viewer() { return molecularViewer.pvViewer; }


  /* Accessor to get the molecularViewer's height and width */
  function get_dimensions() { return {width: molecularViewer.width, height: molecularViewer.height}}


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


  function initialize(div_id, options) {

    /* get the DOM element by the id parameter */
    molecularViewer.domObj = d3.select(div_id).node();
    molecularViewer.parentNode = molecularViewer.domObj.parentNode;

    /* Remove the black background*/
    d3.select(molecularViewer.parentNode).classed("black-background", false);

    /* create a label to display selections */
    let staticLabel = document.createElement('div');
    staticLabel.innerHTML = '&nbsp;';
    staticLabel.className = 'static-label';

    /* Add the label to the model */
    molecularViewer.domObj.appendChild(staticLabel);

    /* check if viewing options were passed in */
    options = options || {};

    /* get/save the width and height of the given DOM element */
    molecularViewer.width = App.molecularViewerWidth;
    molecularViewer.height = parseInt(d3.select(molecularViewer.domObj).style('height'));

    /* add the width and height to the options */
    options.width = molecularViewer.width;
    options.height = molecularViewer.height;

    /* insert the molecularViewer under the DOM element */
    molecularViewer.pvViewer = pv.Viewer(molecularViewer.domObj, options);
    molecularController = new MolecularModelController({
      viewer   : molecularViewer.pvViewer,
      dom      : molecularViewer.domObj,
      label    : staticLabel
    });
  }


  /* return the public-facing functions */
  return {
    init          : initialize,
    render        : render,
    recolor       : recolor,
    getStructure  : get_structure,
    getSequence   : get_sequence,
    getDimensions : get_dimensions
  };

};