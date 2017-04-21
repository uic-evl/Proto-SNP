"use strict";

// Global Application variable
var App = App || {};

(function(){

  // Default PV viewer options
  App.options = {
    antialias: true,
    quality : 'medium',
    background: 'black'
  };

  /* Starting point of the program. Initializes the application */
  function init() {

    /* Get the interface's dom elements*/
    let leftDomMol  = document.getElementById('leftViewer').parentNode;
    let rightDomMol = document.getElementById('rightViewer').parentNode;
    let trendDom    = document.getElementById('trendImageViewer').parentNode;
    let seqViewDom  = document.getElementById('sequenceViewer');
    let freqOffset  = 25;


    /* The size of the EVL header */
    let headerHeight = 0;
    App.labelHeight = document.getElementsByClassName('view')[0].clientHeight;

    /* Aspect Ratio */
    App.aspectRatio = window.innerWidth > ( window.innerHeight - headerHeight ) ?
        (window.innerHeight - headerHeight)/window.innerWidth :
        window.innerWidth / (window.innerHeight- headerHeight) ;

    /* Calculate the height and width of the molecular viewers */
    App.molecularViewerWidth  = leftDomMol.clientWidth;
    App.molecularViewerHeight = parseInt((App.molecularViewerWidth + App.labelHeight)* App.aspectRatio);

    /* Calculate the height and width of the trend image */
    App.trendWidth   = trendDom.clientWidth;
    App.trendHeight  = (window.innerHeight - App.molecularViewerHeight ) * App.aspectRatio;

    /* Calculate the height and width of the frequency viewer */
    App.frequencyWidth  = App.trendWidth / 2.0 + freqOffset;
    App.frequencyHeight = App.trendHeight * 0.3;

    /* Set the div height for the molecular viewers */
    leftDomMol.style.height  = App.molecularViewerHeight;
    rightDomMol.style.height = App.molecularViewerHeight;

    seqViewDom.parentNode.style.height  = App.molecularViewerHeight ;

    /* Set the div height for the trend image */
    trendDom.style.height = App.trendHeight;

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
    App.leftFrequencyViewer = new FrequencyViewer({offset: freqOffset});
    App.rightFrequencyViewer = new FrequencyViewer({offset: freqOffset});

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