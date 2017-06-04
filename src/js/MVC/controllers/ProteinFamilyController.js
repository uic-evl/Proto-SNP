"use strict";

var App = App || {};

const ProteinFamilyController = (function() {

  function ProteinFamilyController(model, view) {

    let self = this;

    self._model = model;
    self._view = view;

    self._brushViews = [];

    /* Add residue selection */
    self._view.fileUploaded.attach(function(sender, args) {
      sender._model.setFamily(args.data, args.type);
    });

    /* Add residue selection */
    self._view.imageRendered.attach(function(sender, args) {
      /* Create new brush views as requested by the family */
      args.brushes.forEach(function(brushSpec){

        let brushView = new BrushView(self._model, brushSpec);

        brushView.brushMoved.attach(function(sender, msg){
          if(msg.orientation === App.HORIZONTAL_PADDLE){
            /* Invert the d3 selection to determine the horizontal mapping */
            let selection = msg.selection,
                middle_selection = parseInt((selection[0] + selection[1])/2.0),
                modelSelection = self._view.getYAxisScale().invert(middle_selection);
            /* Set the current selection in the model*/
            self._model.setSelectedProtein(modelSelection);
          }
        });

        self._brushViews.push(brushView);
      });
      /* Inform the view that the brushes are created */
      self._view.attachBrushes(self._brushViews);
    });

  }

  ProteinFamilyController.prototype = {

  };

  return ProteinFamilyController;
})();