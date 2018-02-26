"use strict";

var App = App || {};

const PrimaryStructureView = (function() {

  function spanSelected(residue, index) {

    let chains = this._model.getStructure().residueSelect(function(res){ return res.index() === index }),
        currentChain = this._model.getChain(),
        residues = [];
    chains.eachResidue(function(res){ residues.push(res._residue); });

    let selection = d3.select(this._dom).selectAll("span")
        .filter(function(d,i){
          return d === residue && i === index + 1;
        }).classed("selected_sequence");

    /* set the selected Residue on the model */
    if(!selection){
      this.residueSelected.notify({residue:residues[currentChain]});
    }
    else {
      this.residueDeselected.notify({residue:residues[currentChain]});
    }
  }

  function PrimaryStructureView(model, element) {
    let self = this;

    self._model = model;
    self._id = element.id;
    self._position = element.position;
    self._dom = null;

    /* The user has selected a new protein */
    self.residueSelected = new EventNotification(this);
    self.residueDeselected = new EventNotification(this);

    /* Event Listeners */

    /* New protein loaded into the view */
    self._model.proteinAdded.attach(function (sender, protein) {
      /* Initialize the viewer */
      self.initialize();
      /* Render the sequence with of the loaded protein */
      self.render(sender.getSequence(protein.structure));
    });

    /* Residue selected and added to the model */
    self._model.residueSelected.attach(function (sender, args){
      /* new selection, deselect all previous selections*/
      if(args.replace){
        d3.select(self._dom).selectAll("span")
            .classed("selected_sequence", false);
      }

      /* Highlight the selection */
      d3.select(self._dom).selectAll("span")
          .filter(function(d,i){
            return d === args.residue._name && i === args.residue._index + 1;
          })
        .classed("selected_sequence", true);
    });

    /* Residue deselected and removed to the model */
    self._model.residueDeselected.attach(function (sender, args){
      d3.select(self._dom).selectAll("span")
          .filter(function(d,i){
            return d === args.residue._name && i === args.residue._index + 1;
          })
          .classed("selected_sequence", false);
    });

  }

  PrimaryStructureView.prototype = {
    show : function () {
      /* Save the context's this */
      let view = this;
      /* Set the DOM selector */
      view._$dom = $('#' + view._id);
      view._dom = view._$dom[0];
    },

    /* Initialize the sequence view */
    initialize:  function(){
      let view = this;
      /* Store the width and height*/
      view.width = this._dom.clientWidth;
      view.height = this._dom.clientHeight;

      // clear the dom of the previous list
      d3.select(view._dom).selectAll().remove();

      // append a new span for the list
      d3.select(view._dom)
        .attr("height", self.height)
        .append("span") // span element
        .attr("class", "sequence")// set the styling to the sequence class
        .style("width", "100%")
      ;

      /* Remove the black background from the viewers*/
      d3.select(view._dom.parentNode)
        .classed("black-background", false)
        .selectAll(".col-6")
        .classed("black-background", false);
  },

    /* Render the sequence list */
    render: function(sequence) {
      let view = this;
      /* Add a span to the list view and populate it with the residues */
      let viewer = d3.select(view._dom).select("span")
          .selectAll("span")
          // JOIN: Add the data to the Dom
          .data(sequence);
      // UPDATE: add new elements if needed
      viewer
          .enter().append("span")
          .attr("class", "residue")
          /* Merge the old elements (if they exist) with the new data */
          .merge(viewer)
          .text(function(d, i) { return "(" + parseInt(i+1) + ") " + d; })
          .style("width", "100%")
          .on("click", spanSelected.bind(view))
          // EXIT: Remove unneeded DOM elements
          .exit().remove();
    },

    resize: function() {

    }
  };

  return PrimaryStructureView;
})();