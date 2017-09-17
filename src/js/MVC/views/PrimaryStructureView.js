"use strict";

var App = App || {};

const PrimaryStructureView = (function() {

  /* initialize the sequence viewer global variable */
  let list = {};

  function PrimaryStructureView(model, element) {
    let self = this;

    self._model = model;
    self._id = element.id;
    self._position = element.position;
    self._dom = null;

    self._model.proteinAdded.attach(function (sender, protein) {
      /* Get the sequence of the new protein */
     let sequence = sender.getSequence(protein.structure);

    });

  }

  PrimaryStructureView.prototype = {
    show : function () {
      /* Save the context's this */
      let view = this;
      /* Set the DOM selector */
      view._dom = $('#' + view._id);
    },

    /* Initialize the sequence view */
    initialize:  function(id, options){

      let $dom = this._dom,
          dom = $dom[0];

      /* Store the width and height*/
      self.width = this._dom.clientWidth;
      self.height = this._dom.clientHeight;

      // clear the dom of the previous list
      d3.select(id).selectAll().remove();

      // append a new span for the list
      d3.select(id)
        .attr("height", height)
        .append("span") // span element
        .attr("class", "sequence") // set the styling to the sequence class
      ;

      /* Remove the black background from the viewers*/
      d3.select(dom)
        .classed("black-background", false)
        .selectAll(".col-md-6")
        .classed("black-background", false);

  },

    /* Render the sequence list */
    render: function(id, sequence) {
      /* Add a span to the list view and populate it with the residues */
      let view = d3.select(id).select("span")
          .selectAll("span")
          // JOIN: Add the data to the Dom
          .data(sequence);
      // UPDATE: add new elements if needed
      view
          .enter().append("span")
          .attr("class", "residue")
          /* Merge the old elements (if they exist) with the new data */
          .merge(view)
          .text(function(d, i) { return "(" + parseInt(i+1) + ") " + d; })
          .style("width", view.width / 2)
          // EXIT: Remove unneeded DOM elements
          .exit().remove();
    }

  };

  return PrimaryStructureView;
})();