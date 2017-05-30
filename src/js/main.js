"use strict";

// Global Application variable
var App = App || {};

(function(){

  /* Starting point of the program. Initializes the application */
  function init() {
      let model = new FilteringMenuModel(['Side Chain Class', 'Side Chain Polarity', 'Frequency (Family Viewer)']),
        view = new FilteringMenuView(model, {
          'list' : $('#coloring_list')
        }),
        controller = new FilteringMenuController(model, view);

    /*  Bind the view with knockoutJS */
    ko.applyBindings( view, $('#coloring_list')[0]);

    /* Render the view */
    view.show();
  }
  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);
})();