"use strict";

// Global Application variable
var App = App || {};

(function () {

  var self = {};

  // initialize the protein selection overlays
  App.setupOverlays = function () {

    $(document).ready(function () {

      $(window).resize(function () {

        if (App.viewerHeight < 560 && App.viewerWidth > 600) {
          $('#overlay-left').addClass('short');
          $('#overlay-right').addClass('short');
        } else {
          $('#overlay-left').removeClass('short');
          $('#overlay-right').removeClass('short');
        }
        $('#overlay-background-left').width(App.viewerWidth).height(App.viewerHeight);
        $('#overlay-background-right').width(App.viewerWidth).height(App.viewerHeight);

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
      right.click(function () {
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

    });
  };

  // initialize the file upload
  App.setupUpload = function () {

    $('#fileupload').fileupload({
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

                let// file = data.files[0],
                    reader = new FileReader();

                /* Save the file name in the closure scope */
                self.fileName = file.name.split('.')[0];

                /* Event to fire once the file loads*/
                reader.addEventListener("load", function () {
                  /* Pass the uploaded file into the reader */
                  App.leftViewer.loadFromFile(this.result)
                      .then(function(structure){
                        $('#leftSplash').remove();

                        App.leftViewer.init('#leftViewer', {
                          antialias: true,
                          quality : 'medium',
                          background: 'black'
                        } );

                        App.leftViewer.render(structure[0], self.fileName);
                      });
                }, false);

                reader.readAsText(file);

                $(this).parent().remove();
                data.abort();
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
          data.context = $('<div/>').appendTo('#left-files');
          let node = $('<p/>')
              .append($('<span/>').text(file.name));

          /* Append the Upload and Cancel Buttons */
          node.appendTo(data.context)
              .append('<br>')
              .append('<br>')
              .append(uploadButton.clone(true).data(data))
              .append(cancelButton.clone(true).data(data));
        })
        .prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled');
  }

})();