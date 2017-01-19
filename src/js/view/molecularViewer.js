// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var MolecularViewer = function(){

  /* initialize the molecular viewer global variable */
  var viewer = {};

  function initialize(id, options) {

    /* get the DOM element by the id parameter */
    viewer.domObj = document.getElementById(id);

    /* check if viewing options were passed in */
    options = options || {};

    /* get/save the width and height of the given DOM element */
    viewer.width = viewer.domObj.clientWidth;
    viewer.height = viewer.width * 0.9;

    /* add the width and height to the options */
    options.width = viewer.width;
    options.height = viewer.height;

    /* insert the viewer under the DOM element */
    viewer.pvViewer = pv.Viewer(document.getElementById(id), options);
  }

  function loadPDBFromRCMB(proteinName){

    /* perform an async download from RCMB to fetch the requested PDB File */
    pv.io.fetchPdb('https://files.rcsb.org/download/' + proteinName + '.pdb', function(structure) {

      /* Store the structure */
      viewer.structure = structure;

      /* Display the protein as cartoon, coloring the secondary structure
         elements in a rainbow gradient
      */
      viewer.pvViewer.cartoon(proteinName, structure, { color : color.ssSuccession() });

      /* center the structure in the view */
      // center in viewer
      viewer.pvViewer.centerOn(structure);
      // auto zoom to fit
      viewer.pvViewer.autoZoom();

      /* Add the protein's label */
      // get the label div
      var staticLabel = viewer.domObj.querySelector('.static-label');
      // set the text to the label
      staticLabel.innerHTML = proteinName;

    });

  }

  /* Accessor to get the underlying structure in the viewer */
  function getStructure() { return viewer.structure; }

  /* return the public-facing functions */
  return {
    init          : initialize,
    loadFromRCMB  : loadPDBFromRCMB,
    getStructure  : getStructure
  };

};