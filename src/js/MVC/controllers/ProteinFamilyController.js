"use strict";

var App = App || {};

const ProteinFamilyController = (function() {

  function ProteinFamilyController(model, view) {
    let self = this;

    self._model = model;
    self._view = view;

    self._brushViews = {};
    self._frequencyViews = {};

    function createsBrush(brushes) {
      brushes.forEach(function(brushSpec){
        /* Create the brush and link the listeners */
        let brushView = new BrushView(self._model, brushSpec);
        /* Setup the on-move listener */
        brushView.brushMoved.attach(function(sender, msg){
          let options = msg.options;
          if(options.orientation === App.HORIZONTAL_PADDLE){
            /* Invert the d3 selection to determine the horizontal mapping */
            let selection = msg.selection,
                middle_selection = parseInt((selection[0] + selection[1])/2.0),
                modelSelection = self._view.getYAxisScale().invert(middle_selection);
            /* Set the current selection in the model*/
            self._model.setSelectedProtein(modelSelection);
          }
          else if(options.orientation === App.VERTICAL_PADDLE){
            /* Invert the d3 selection to determine the horizontal mapping */
            /* Get the current protein */
            let selection = msg.selection,
                currentSelection = selection.map(self._view.getXAxisScale().invert);
            // (It's sad that I have to do this -- Floating pt errors)
            currentSelection[0] = parseInt(Math.round(currentSelection[0]));
            currentSelection[1] = parseInt(Math.round(currentSelection[1]));
            /* Set the current selection in the model*/
            self._model.setSelectedResidues(options.semantic, currentSelection);
          }
        });

        /* Add the brush to the list of views */
        self._brushViews[brushSpec.semantic] = brushView;
      });
    }

    function createResidueViewers(residueViewers) {
      /* Get information about the trend image */
      let numberOfRows    = self._view.getYDimensionSize(),
          currentProtein  = self._model.getSelectedProtein();

      /* Create the frequency viewers for the family*/
      residueViewers.forEach(function(freqSpec){
        /* Create the frequency viewers */
        let freqView = new ResidueFrequencyView(self._model, freqSpec);
        /* Attach the listeners */
        self._frequencyViews[freqSpec.semantic] = freqView;

        /* Render the viewers depending on the brush's position */
        let selection = _.map(self._brushViews[freqSpec.semantic].getInitialPosition(),
            (o)=>{ return parseInt(o/freqSpec.block_size); }),
            residues  = self._model.getSequenceFrequenciesFromRange(selection);

        /* Set the initial selections in the model */
        self._model.setSelectedResidues(freqSpec.semantic, selection);

        /*Render the view */
        freqView.render(residues, numberOfRows, currentProtein.sequence.slice(selection[0], selection[1]) );
      });
    }

    /* Add residue selection */
    self._view.fileUploaded.attach(function(sender, args) {
      sender._model.setFamily(args.data, args.type);
    });

    /* Add residue selection */
    self._view.imageRendered.attach(function(sender, args) {
      /* Create new brush views as requested by the family */
      createsBrush(args.brushes);
      /* Create the new residue views */
      createResidueViewers(args.frequencyViewers);

      /* Inform the view that the brushes are created */
      self._view.attachBrushes(_.values(self._brushViews));
    });
  }

  ProteinFamilyController.prototype = {

  };

  return ProteinFamilyController;
})();