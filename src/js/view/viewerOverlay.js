"use strict";

// Global Application variable
var App = App || {};

(function(){

  // initialize the protein selection overlays
  App.setupOverlays = function() {

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

})();