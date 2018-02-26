"use strict";

// Global Application variable
var App = App || {};

(function(){

  /* File utility setup */
  App.fileUtilities = new FileUtilities();
  App.dataUtilities = new DatabaseMappingUtils();
  App.residueMappingUtility = new ResidueMappingUtility();

  /* List of views */
  let views = [];

  /* Taken from https://stackoverflow.com/questions/2854407/javascript-jquery-window-resize-how-to-fire-after-the-resize-is-completed */
  /* This function is used to ensure that the resize event complete before firing */
  let waitForFinalEvent = (function () {
    let timers = {};
    return function (callback, ms, uniqueId) {
      if (!uniqueId) {
        uniqueId = "Don't call this twice without a uniqueId";
      }
      if (timers[uniqueId]) {
        clearTimeout (timers[uniqueId]);
      }
      timers[uniqueId] = setTimeout(callback, ms);
    };
  })();

  let warning_resolution = function(cb) {
    swal({
      title: 'Resolution Warning',
      text: "The suggested resolution for this application is 1024x768 or larger. Smaller resolutions could lead to visual artifacts and loss of smoother interactions. ",
      type: 'warning',
      confirmButtonColor: '#3085d6',
    }).then((result) => {
      if (result.value) {
        cb();
      }
    })
  };

  function checkResolution(cb) {
    let w = window.innerWidth,
      h = window.innerHeight;

    /* check the resolution of the resize*/
    if(w < 1024 || h < 768) {
      warning_resolution(cb);
    }
    else {
      cb();
    }
  }

  function resize() {
    let r = ()=> {
      views.forEach(function (v) {
        v.resize();
      });
    };
    /* Check the resolution */
    checkResolution(r);
  }

  /* Starting point of the program. Initializes the application */
  function init() {
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

    /* Save the views in an array*/
    views = [proteinFamilyController, rightTertiaryStructureView, leftTertiaryStructureView, rightPrimaryStructureView, leftPrimaryStructureView];

    let launchModal = function() {
      $('#startupModalDiv').load("./src/html/modals/startupModal.html", function(){

        /* Launch the initial data modal */
        $("#initialModal").modal().on('shown.bs.modal', function (e) {

          let modal = $(this);

          /* Setup the file upload plugin */
          App.fileUtilities.initialUploadSetup(modal,
            function (metadata, result) {
              /* Initialize the viewer based on the input data */
              switch(metadata.extension){
                case "pdb":
                  leftTertiaryStructureView.file_loaded(metadata, result);
                  // Start the tour!
                  break;
                case "msf":
                case "fa":
                  proteinFamilyView.file_loaded(result, metadata.extension);
                  break;
              }

              /* destroy the file upload */
              modal.find("#fileUploadInput").fileupload('destroy');
              /* Close the modal */
              $("#initialModal").modal('hide');
            });

          /* Link the protein form to the model utilities */
          modal.find("#initialDataForm").on("submit", function(){
            let name = $(this).serialize().split('=')[1];
            App.fileUtilities.ajaxFromRCMB(name, function(blob){
              if(blob){
                blob.name = name + ".pdb";
                modal.find("#fileUploadInput").fileupload('add', {files: blob });
              }
              modal.find("#protein-name").val('');
            });
            return false;
          });

        });

      });
    };

    //checkResolution(launchModal);

    /* Show the tertiary viewers */
    leftTertiaryStructureView.show();
    rightTertiaryStructureView.show();
    proteinFamilyView.show();

    /* Show the sequence viewers */
    leftPrimaryStructureView.show();
    rightPrimaryStructureView.show();

    /* Register the resize callbacks */
    $(window).resize(function(){
      waitForFinalEvent(resize, 100, "Resize complete")
    });

    /* Register the about modal */
    $('#aboutModalDiv').load("./src/html/modals/aboutModal.html");

  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);
})();