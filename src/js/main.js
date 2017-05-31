"use strict";

// Global Application variable
var App = App || {};

(function(){

  /* Starting point of the program. Initializes the application */
  function init() {

    let colorModel = new FilteringMenuModel(['Side Chain Class', 'Side Chain Polarity', 'Frequency (Family Viewer)']),
      colorView = new FilteringMenuView(colorModel, {
        'list' : $('#coloring_list')
      }),
      colorController = new FilteringMenuController(colorModel, colorView);

    let sortingModel = new FilteringMenuModel(['Initial Ordering', 'Residue Frequency', 'Weighted Edit Distance', 'Residue Commonality with', 'Normalized Residue Commonality with']),
        sortingView = new FilteringMenuView(sortingModel, {
        'list' : $('#sorting_list')
      }),
        sortingController = new FilteringMenuController(sortingModel, sortingView);

    let leftTertiaryStructureView = new TertiaryStructureView(null, {id: "molecularViewerA", position:"left"}),
        rightTertiaryStructureView = new TertiaryStructureView(null, {id: "molecularViewerB", position:"right"}),
        tertiaryStructuresController = new TertiaryStructureController({}, [leftTertiaryStructureView, rightTertiaryStructureView]);


    /* Render the view */
    sortingView.show();
    colorView.show();

    leftTertiaryStructureView.show();
  }
  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);
})();