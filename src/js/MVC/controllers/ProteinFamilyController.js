"use strict";

var App = App || {};

const ProteinFamilyController = (function() {

    function ProteinFamilyController(model, view) {
        let self = this;

        self._model = model;
        self._view = view;

        self._brushViews = {};
        self._frequencyViews = {};

        self.proteinSelected = new EventNotification(this);

        function createOverviewPaddle(overviewSpec){
            /* construct the y-scale */
            let yScale = overviewSpec.brushSpec.scale,
                overviewBrush = new BrushView(self._model, overviewSpec.brushSpec);
            /* Setup the onMove callback */
            overviewBrush.brushMoved.attach(function(sender, msg){
                /* Map the selection into the protein family scale */
                let selection = msg.selection.map(yScale.invert);
                selection[0] = Math.round(selection[0]);
                selection[1] = Math.round(selection[1]);

                /* TODO Get the main brush position */

                /* TODO Check if it's still in the view */
                /* TODO  if so, move the brush to it */
                /* TODO if it's not, set the current protein to the top */


                /* Render the context bar that links the views */
                let y = msg.selection[0] + (msg.selection[1]- msg.selection[0])/2.0;
                let contextPoints = [
                    [{x:0, y:0},{x:self._view.x_offset, y:msg.selection[0]}],
                    [{x:0, y:self._view.height}, {x:self._view.x_offset, y:msg.selection[1]}]
                ];
                d3Utils.render_context_lines(overviewSpec.brushSpec.parent, contextPoints, 0.2);

                /* Render the new view*/
                self._view.render(self._view._familyImage, 0, selection[0]*self._view.getGlyphSize());
                /* Update the selection */
                self._model.setOverviewOffset(selection[0]);
            });

            self._brushViews['overview'] = overviewBrush;
            return overviewBrush;
        }

        function createFamilyPaddles(brushes) {
            brushes.forEach(function(brushSpec){
                /* Create the brush and link the listeners */
                let brushView = new BrushView(self._model, brushSpec);

                /* Attach the callback for selecting a protein */
                if(brushSpec.orientation === App.HORIZONTAL_PADDLE){
                    /* Notify the Tertiary Controller that a new protein is loaded */
                    brushView.proteinSelected.attach(function(sender,msg){
                        self.proteinSelected.notify(msg);
                    });
                }

                /* Setup the onMove observer */
                brushView.brushMoved.attach(function(sender, msg){
                    let options = msg.options;
                    if(options.orientation === App.HORIZONTAL_PADDLE){
                        /* Invert the d3 selection to determine the horizontal mapping */
                        let selection = msg.selection,
                            middle_selection = parseInt((selection[0] + selection[1])/2.0),
                            modelSelection = self._view.getYAxisScale().invert(_.clamp(middle_selection,0,Math.round(selection[1])));
                        /* Set the current selection in the model*/
                        self._model.setSelectedProtein(modelSelection);
                    }
                    else if(options.orientation === App.VERTICAL_PADDLE){
                        /* Invert the d3 selection to determine the horizontal mapping */
                        /* Get the current protein */
                        let selection = msg.selection,
                            currentSelection = selection.map(self._view.getXAxisScale().invert);
                        // (It's sad that I have to do this -- Floating pt errors)
                        currentSelection[0] = parseInt(Math.ceil(currentSelection[0]));
                        currentSelection[1] = parseInt(Math.ceil(currentSelection[1]));

                        /* Set the current selection in the model*/
                        let previousSelection = self._model.getSelectedResidues(options.semantic).selection;
                        if(previousSelection[0] !== currentSelection[0] || previousSelection[1] !== currentSelection[1]){
                            self._model.setSelectedResidues(options.semantic, currentSelection);
                        }
                    }
                });
                /* Add the brush to the list of views */
                self._brushViews[brushSpec.semantic] = brushView;
            });
        }

        function createResidueViewers(residueViewers) {
            let template = (self._view.overviewImage) ? "./src/html/frequencyViewer/frequencyViewerWithOverlayTemplate.html":
                "./src/html/frequencyViewer/frequencyViewerTemplate.html";
            $('#residueSummaryView').load(template, function () {
                /* Get information about the trend image */
                let numberOfRows  = self._view.getYDimensionSize(),
                    currentProtein  = self._model.getSelectedProtein();
                /* Create the frequency viewers for the family*/
                residueViewers.forEach(function(freqSpec){
                    /* Create the frequency viewers */
                    let freqView = new ResidueFrequencyView(self._model, _.assign(freqSpec, {'rows': numberOfRows}));
                    /* Attach the listeners */
                    self._frequencyViews[freqSpec.semantic] = freqView;
                    /* Render the viewers depending on the brush's position */
                    let brushPos = self._brushViews[freqSpec.semantic].getInitialPosition(),
                        selection = brushPos.map(self._view.getXAxisScale().invert);

                    // (It's sad that I have to do this -- Floating pt errors)
                    selection[0] = parseInt(Math.ceil(selection[0]));
                    selection[1] = parseInt(Math.ceil(selection[1]));

                    let maxFrequencies  = self._model.getMaxSequenceFrequenciesFromRange(selection);
                    /* Set the initial selections in the model */
                    self._model.setSelectedResidues(freqSpec.semantic, selection);
                    /*Render the view */
                    freqView.render({
                        maxFrequencies:maxFrequencies,
                        residues:currentProtein.sequence.slice(selection[0], selection[1]),
                        brush_center: brushPos[0] + (brushPos[1]-brushPos[0])/2.0,
                        brush_pos: brushPos,
                        range: [selection[0], selection[1]]
                    });
                });
            });
        }

        function getOverviewSelection() {
            let selection = self._brushViews['overview'].getSelection(),
                scale =  self._brushViews['overview'].getScale();
            /* Map the scale from the overview to the family view */
            selection = selection.map(scale.invert);
            /* Round to the nearest protein */
            selection[0] = Math.round(selection[0]);
            selection[1] = Math.round(selection[1]);
            return selection;
        }

        /* The coloring scheme changed */
        self._model.proteinColoringChanged.attach(function(sender, msg){
            if (!self._model.isEmpty()) return;
            let colorMap = msg.scheme,
                colorScale = App.residueMappingUtility.getColor(colorMap, "family"),
                /* Recolor the family viewer  */
                selection = [0,0];
            if(self._brushViews['overview']){
                selection = getOverviewSelection();
            }
            /* Recolor the trend image */
            self._view.recolor({color:colorScale, x:0, y:selection[0]*self._view.getGlyphSize()});
        });

        /* The coloring scheme changed */
        self._model.proteinSortingChanged.attach(function(sender, msg){
            let sorted_data = msg.data,
                colorMap = msg.colorScheme,
                colorScale = App.residueMappingUtility.getColor(colorMap, "family"),
                selection =[0,0];
            if(self._brushViews['overview']){
                selection = getOverviewSelection();
            }

            self._view.reorder({family:sorted_data, color:colorScale, x:0, y: selection[0]*self._view.getGlyphSize()});
        });

        /* On Alignment File Load */
        self._view.fileUploaded.attach(function(sender, args) {
            sender._model.setFamily(args.data, args.type, args.name);
        });

        /* On Alignment File Change */
        self._view.fileUpdated.attach(function(sender, args) {
            /* Reset the model and view */
            self._model.clear();
            self._view.clear();

            /* Clear the brushes and frequency view */
            d3.select("#residueSummaryView").selectAll("*").remove();
            d3.selectAll('.d3-tip').remove();

            /* Remove the context menu from the trend image */
            self._brushViews['horizontal'].removeContextMenu();

            delete self._brushViews;
            delete self._frequencyViews;

            self._frequencyViews = {};
            self._brushViews = {};

            /* Set the family to being initialization */
            sender._model.setFamily(args.data, args.type, args.name);
        });

        /* On Family View Rendered */
        self._view.imageRendered.attach(function(sender, args) {
            /* Create new brush views as requested by the family */
            createFamilyPaddles(args.brushes);
            /* Inform the view that the brushes are created */
            self._view.attachBrushes(_.values(self._brushViews), self._view.brushSVG);
            /* Create the new residue views */
            createResidueViewers(args.frequencyViewers);
        });

        /* On Overview Rendered*/
        self._view.overviewRendered.attach(function(sender, args) {
            /* Create the brush and inform the view */
            self._view.attachBrushes([createOverviewPaddle(args)], self._view.overviewSVG);
        });
    }

    ProteinFamilyController.prototype = {
        resize: function() {
            if(this._model.isEmpty()){
                this._view.clear();
                /* Clear the brushes and frequency view */
                d3.select("#residueSummaryView").selectAll("*").remove();
                d3.selectAll('.d3-tip').remove();

                /* Remove the context menu from the trend image */
                this._brushViews['horizontal'].removeContextMenu();

                delete this._brushViews;
                delete this._frequencyViews;

                this._frequencyViews = {};
                this._brushViews = {};

                this._view.resize();
            }
        }
    };

    return ProteinFamilyController;
})();