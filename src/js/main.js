"use strict";

// Global Application variable
var App = App || {};

(function(){

  /* Starting point of the program. Initializes the application */
  function init() {

    /* File utility setup */
    App.fileUtilities = new FileUtilities();
    App.dataUtilities = new DatabaseMappingUtils();
    App.residueMappingUtility = new ResidueMappingUtility();
    App.spinner = d3.select('.spinner').node();

    let proteinFamilyModel = new ProteinFamilyModel(),
        proteinFamilyView = new ProteinFamilyView(proteinFamilyModel, {id: "trendImageViewer"}),
        proteinFamilyController = new ProteinFamilyController(proteinFamilyModel, proteinFamilyView);

    let leftProteinModel = new ProteinModel(), rightProteinModel = new ProteinModel(),
        leftTertiaryStructureView = new TertiaryStructureView(leftProteinModel, {id: "molecularViewerA", position:"left"}),
        rightTertiaryStructureView = new TertiaryStructureView(rightProteinModel, {id: "molecularViewerB", position:"right"}),
        tertiaryStructuresController = new TertiaryStructureController(
            [leftProteinModel, rightProteinModel], [leftTertiaryStructureView, rightTertiaryStructureView], proteinFamilyController);

    let leftPrimaryStructureView  = new PrimaryStructureView(leftProteinModel, {id: "leftMolecularViewer-Sequence", position:"left"}),
        rightPrimaryStructureView = new PrimaryStructureView(rightProteinModel, {id: "rightMolecularViewer-Sequence", position:"right"}),
        primaryStructuresController = new PrimaryStructureController({}, [leftPrimaryStructureView, rightPrimaryStructureView]);

    let colorModel = new FilteringMenuModel({
      items:['Side Chain Class', 'Side Chain Polarity', 'Frequency (Family Viewer)']
    }),
        colorView = new FilteringMenuView(colorModel, { 'list' : $('#coloring_list') }),
        colorController = new FilteringMenuController({
          menu : "coloring",
          models: { list: colorModel, connected : [proteinFamilyModel, leftProteinModel, rightProteinModel]},
          view: colorView,
          cb:
              function(model, element) {
                model.setProteinColoring(element);
                App.residueMappingUtility.createColorLegend();
          }
        });

    let sortingModel = new FilteringMenuModel({
        items: ['Initial Ordering','Residue Frequency', 'Weighted Edit Distance',
          'Residue Commonality with', 'Normalized Residue Commonality with']
    }),
        sortingView = new FilteringMenuView(sortingModel, { 'list' : $('#sorting_list') }),
        sortingController = new FilteringMenuController({
          menu : "sorting",
          models: { list: sortingModel, connected: [proteinFamilyModel]},
          view: sortingView,
          cb:
              function(model, element) {
                model.setProteinSorting(element)
              }
        });

    /* Render the views */
    sortingView.show();
    colorView.show();

    leftTertiaryStructureView.show();
    rightTertiaryStructureView.show();
    proteinFamilyView.show();

    leftPrimaryStructureView.show();
    rightPrimaryStructureView.show();

  }
  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);
})();