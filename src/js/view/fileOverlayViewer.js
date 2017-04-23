"use strict";

// Global Application variable
var App = App || {};

(function () {

  // initialize the protein selection overlays
  App.setupOverlays = function () {

    $(window).resize(function () {

      if (App.molecularViewerHeight < 560 && App.molecularViewerWidth > 600) {
        $('#overlay-left').addClass('short');
        $('#overlay-right').addClass('short');
      } else {
        $('#overlay-left').removeClass('short');
        $('#overlay-right').removeClass('short');
      }
    });

    $(window).trigger('resize');

    let left = $('#popup-trigger-left');
    let right = $('#popup-trigger-right');

    // Launch the overlay
    left.click(function () {
      // hide the select protein button
      left.hide();
      $('#overlay-left').addClass('open').find('.signup-form input:first').select();
    });

    // if the user clicks on the overlay or the 'X', close the overlay
    $('#overlay-background-left, #overlay-close-left').click(function () {
      // reshow the button
      left.show();
      $('#overlay-left').removeClass('open');
    });

    // Launch the overlay
    right.click(function() {
      // hide the select protein button
      right.hide();
      $('#overlay-right').addClass('open').find('.signup-form input:first').select();
    });

    // if the user clicks on the overlay or the 'X', close the overlay
    $('#overlay-background-right, #overlay-close-right').click(function () {
      // reshow the button
      right.show();
      $('#overlay-right').removeClass('open');
    });

  };

  // initialize the 3D view file upload
  App.setupUpload = function (viewer) {

    /* Setup the fileupload callback */
    $('#fileupload-' + viewer).fileupload({
      url: "",
      dataType: 'json',
      autoUpload: false
    })
    /* Handle the upload callbacks */
        .on('fileuploadadd', function (e, data) {
          // The select button
          let select = $(this).prop('disabled', true);
          // uploaded file
          let file = data.files[0];

          /*Upload Button - loads the file into the viewer*/
          let uploadButton = $('<button/>')
              .addClass('btn btn-primary uploadPDB')
              .text('Upload')
              .on('click', function () {

                // JS File reader to parse the uploaded file
                let reader = new FileReader(),
                /* Save the file name in the closure scope */
                fileName = file.name.split('.')[0];

                /* Event to fire once the file loads*/
                reader.addEventListener("load", function () {
                  /* Pass the file to be processed by the model */
                  App.applicationModel.processProteinRequest({position: viewer, protein_name: fileName}, this.result);
                }, false);

                // parse the file as text
                reader.readAsText(file);

                // Remove the div and buttons
                $(this).parent().remove();
                // abort the upload (we aren't passing it to a server)
                data.abort();

                // re-enable the select protein button
                select.prop('disabled', false);
              });

          /* Cancel button -- removes the chosen file and removes the div items*/
          let cancelButton = $('<button/>')
              .addClass('btn btn-primary uploadPDB')
              .text('Cancel')
              .on('click', function () {
                let $this = $(this),
                    data = $this.data();
                $this.parent().remove();
                data.abort();
                select.prop('disabled', false);
              });

          /* Create a div and attach it beneath the Choose File button */
          data.context = $('<div/>').appendTo('#files-'+viewer);
          let node = $('<p/>')
              .append($('<span/>').text(file.name));

          /* Append the Upload and Cancel Buttons */
          node.appendTo(data.context)
              .append(uploadButton.clone(true).data(data))
              .append(cancelButton.clone(true).data(data));
        })
        .prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled');
  };

  // initialize the family file uploader
  App.setupFamilyUploader = function(viewer) {
    /* Setup the fileupload callback */
    $('#fileupload-' + viewer).fileupload({
      url: "",
      dataType: 'json',
      autoUpload: false
    })
    /* Handle the upload callbacks */
      .on('fileuploadadd', function (e, data) {
        // uploaded file
        let file = data.files[0],
            extension = file.name.split('.').pop().toLowerCase();

        // JS File reader to parse the uploaded file
        let reader = new FileReader();

        /* Callback to loading the file */
        reader.addEventListener("load", function () {
          /* Pass the file to be processed by the model */
            App.applicationModel.processProteinFamily(this.result, extension);
        }, false);

        // parse the file as text
        reader.readAsText(file);

        // abort the upload (we aren't passing it to a server)
        data.abort();

      })
      .prop('disabled', !$.support.fileInput)
      .parent().addClass($.support.fileInput ? undefined : 'disabled');
  };

})();