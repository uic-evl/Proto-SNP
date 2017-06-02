"use strict";

var App = App || {};

const TertiaryStructureView = (function() {

  /* Scope instance variable */
  let self = {};

  function TertiaryStructureView(model, element) {

    let self = this;

    self._model = model;
    self._id = element.id;
    self._position = element.position;
    self._dom = null;


    /* The user has uploaded or downloaded a PDB file */
    this.fileUploaded = new EventNotification(this);

    /* Attach the listeners */
    this._model.proteinAdded.attach(function(protein){

      /* Close the splash screen */
      $('#'+self._id)
        .find('#splash').remove();
    });
  }

  TertiaryStructureView.prototype = {
    show : function () {

      let view = this;
      view._dom = $('#'+view._id);

      /* load the splash screen if there is no model data*/
      if(!view._model.isEmpty()){
        /* Load the splash template */
        this._dom.find('#splash').load("./src/html/tertiarySplashTemplate.html", function(){

          let splash =  $(this),
              splash_trigger = splash.find("#popup-trigger-molecule");

          // Launch the overlay
          splash_trigger.click(function () {
            // hide the select protein button
            splash
                .find("#splashOverlay").addClass('open')
                .find('.signup-form input:first').select();
            splash_trigger.hide();
          });

          // If the user clicks on the overlay or the 'X', close the overlay
          splash.find('#overlayBackground, #overlayClose').click(function () {
            // reshow the button
            splash.find('#splashOverlay').removeClass('open');
            splash_trigger.show();
          });

          /* Setup the uoload callback for files */
          App.fileUtilities.uploadSetup(splash.find("#fileUploadInput"),
              function( metadata, result ){
                view.fileUploaded.notify({metaData: metadata, file: result});
              })
        });
      }
    },

    initialize : function() { }


  };

  return TertiaryStructureView;

})();