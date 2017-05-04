"use strict";

// Global Application variable
var App = App || {};

(function(){

  /* Starting point of the program. Initializes the application */
  function init() {

    let freqOffset  = 25;

    App.labelHeight = document.getElementsByClassName('view')[0].clientHeight;

    /* Create the Data Mapping Utility Library */
    App.dataUtils = new DatabaseMappingUtils();

    /* Setup the Menu */
    App.coloringMenu = new MenuController();
    App.coloringMenu.initColoringMenu(".coloringOption");
    App.coloringMenu.initSortingMenu(".sortingOption");

    /* create the left and right viewers */
    App.leftMolecularViewer  = new MolecularViewer();
    App.rightMolecularViewer = new MolecularViewer();

    /* Setup the sequence viewer */
    App.sequenceViewer = new SequenceViewer();

    /* Setup the trend image viewer */
    App.trendImageViewer = new TrendImageViewer({freqOffset: freqOffset});

    /* Setup the frequency histogram viewers*/
    App.leftFrequencyViewer = new FrequencyViewer({trend_div: "trendImageViewer", offset: freqOffset});
    App.rightFrequencyViewer = new FrequencyViewer({trend_div: "trendImageViewer", offset: freqOffset});

    /* Set the initial rendering style and color mapping */
    App.colorMapping      = "side chain";
    App.sorting           = "initial";
    App.renderingStyle    = "cartoon";

    /* Set the residue property model */
    App.residueModel = new ResidueModel();

    /* Bind the model to the view*/
    App.applicationModel = new ApplicationModel();
    ko.applyBindings(App.applicationModel);

    /* Setup the protein selection overlays */
    App.setupOverlays();

    /* Setup the protein file upload */
    App.setupUpload("left");
    App.setupUpload("right");
    App.setupFamilyUploader("family");
  }
  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);
})();