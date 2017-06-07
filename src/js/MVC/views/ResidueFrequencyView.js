"use strict";

var App = App || {};

const ResidueFrequencyView = (function() {

  function ResidueFrequencyView(model, options) {

    let self = this;

    self._model = model;

    self._id = options.id;
    self._dom = d3.select("#"+self._id);
    self._parent = d3.select("div."+options.parent);

    self._barOffset = 5;
    self._familyMemberCount = options.rows;
    self._svg = null;
    self._visible = false;

    /* Set the model listeners */
    /* Update on horizontal paddle move */
    self._model.selectedProteinChanged.attach(function(sender, msg){
      /* Not initialized yet */
      if(!self._visible) return;
      /* Render the view */
      let selection = self._model.getSelectedResidues(options.semantic).selection,
          protein = msg.selection;
      /*Render the view */
      self.update(protein.sequence.slice(selection[0], selection[1]));
    });

    /* Update on vertical paddle move */
    self._model.selectedResiduesChanged.attach(function(sender, msg){
      /* Not initialized yet */
      if(!self._visible || (msg.semantic !== options.semantic) ) return;
      /* Update the labels to the new selection */
      let selection = msg.selection,
          residues = self._model.getSequenceFrequenciesFromRange(selection),
          protein = self._model.getSelectedProtein();
      /*Render the view */
      self.render(residues, protein.sequence.slice(selection[0], selection[1]));
    });

    self.set_scales = function(residue_frequencies, family_member_count) {
      /*Set the scale for the x-axis */
      /* construct the x-scale */
      self.xScale = d3.scaleLinear()
          .domain([0, residue_frequencies.length])
          .range(self.range)
      ;

      self.yScale = d3.scaleLinear()
          .domain([0, family_member_count])
          .range([self.height * 0.2, 0])
      ;
    };

    /* Render the bars for each residue */
    self.render_bars = function(residue_frequencies, selected_residues) {

      /* Add the bars to the viewer */
      let bar = self._svg
          .selectAll(".freq_bars")
          .data(residue_frequencies);

      // UPDATE: add new elements if needed
      bar
          .enter().append('g')
          .append('rect')
          /* Merge the old elements (if they exist) with the new data */
          .merge(bar)
          .attr("class", "freq_bars")
          .attr("width", self.glyph_width)
          .attr("height", self.height * 0.2)
          .attr('y', function(d) { return self.height * 0.3 + self._barOffset } )
          .attr('x', function(d, i) { return self.xScale(i) })
          .style("fill", "white");

      /* Remove the unneeded bars */
      bar.exit().remove();

      /* Color the bars according to the frequency of the residue*/
      let frequency =
          self._svg.selectAll(".frequencies")
              .data(residue_frequencies);

      // UPDATE: add new elements if needed
      frequency
          .enter().append("rect")
          .attr("class", "frequencies")
          /* Merge the old elements (if they exist) with the new data */
          .merge(frequency)
          .attr('x', function(d, i) { return self.xScale(i) })
          .attr('y', function(d) { return self.yScale(d[1]) + self.height * 0.3 + self._barOffset} )
          .attr("width", self.glyph_width)
          .attr("height", function(d) { return ( self.height * 0.2 - self.yScale(d[1]) )  })
          .attr("fill", function(d,i) { return (d[0] === selected_residues[i]) ?  "#43a2ca" : "#D3D3D3"; })
      ;

      /* Remove the unneeded frequency bars */
      frequency.exit().remove();
    };

    self.render_labels = function(residue_frequencies){

      /* Add the residue text to the bars */
      let frequencyText = self._svg.selectAll(".residueText")
          .data(residue_frequencies);

      // UPDATE: add new elements if needed
      frequencyText
          .enter().append("text")
          .attr("class", "residueText")
          /* Merge the old elements (if they exist) with the new data */
          .merge(frequencyText)
          .attr('x', function(d, i) { return self.xScale(i) + self.glyph_width / 2 })
          .attr("y", self.height * 0.6 + self._barOffset )
          .attr("dy", ".35em")
          .text(function(d){ return d[0] })
          .style("text-anchor", "middle")
          .style("font-weight", "bold")
      ;

      /* Remove the unneeded frequency labels */
      frequencyText.exit().remove();
    };

    self.update = function(selected_residues){
      /* Add the residue text to the bars */
      let selectionText = self._svg.selectAll(".selectionText")
          .data(selected_residues);

      // UPDATE: add new elements if needed
      selectionText
          .enter().append("text")
          .attr("class", "selectionText")
          /* Merge the old elements (if they exist) with the new data */
          .merge(selectionText)
          .attr('x', function(d, i) { return self.xScale(i) + self.glyph_width / 2 })
          .attr("y", self.height * 0.2 + self._barOffset)
          .attr("dy", ".3em")
          .text(function(d){ return d[0] })
          .style("text-anchor", "middle")
          .style("font-weight", "bold")
      ;
      /* Remove the unneeded selection labels */
      selectionText.exit().remove();
      /* Update the color for matching residues*/
      self._svg.selectAll(".frequencies")
          .attr("fill", function(d,i) { return (d[0] === selected_residues[i]) ?  "#D3D3D3" : "#43a2ca"; })
    };

    /* Initialize the viewer */
    self.initialize(options);
  }

  ResidueFrequencyView.prototype = {

    initialize : function (options) {
      /* Show the viewer */
      this._parent.classed("hidden", false);

      this.width   = this._parent.node().clientWidth/2.0;
      this.height  = this._parent.node().clientHeight;

      this.glyph_width = this.width / options.max_items;

      /* Clear the dom element */
      d3Utils.clear_chart_dom(this._dom);
      this._svg = d3Utils.create_chart_svg(this._dom, this.width, this.height);

      if(options.semantic === "left"){
        this.range = [options.offset*2, this.width];
        this.contextPoints = [
            [ {x: options.offset, y:10},      { x: this.width, y: 10}],
            [ {x: options.offset + 1, y: 10}, { x: options.offset + 1, y:20} ],
            [ {x: this.width -1, y: 10},      { x: this.width - 1, y:20}] ];
      }
      else {
        this.range = [options.offset*2, this.width];
        this.contextPoints = [
          [ {x: options.offset, y:10},      {x: this.width, y: 10}],
          [ {x: options.offset + 1, y: 10}, {x: options.offset + 1, y:20} ],
          [ {x: this.width -1, y: 10},      {x: this.width - 1, y:20}] ];
      }

      // render_context_lines();
    },

    render : function(residue_frequencies, selected_residues) {
      /* Set the scales based on the new selection */
      this.set_scales(residue_frequencies, this._familyMemberCount, selected_residues);
      /* Render the bars */
      this.render_bars(residue_frequencies, this._familyMemberCount);
      this.render_labels(residue_frequencies);
      /* Update the labels */
      this.update(selected_residues);
      /* Set the visibility flag to true*/
      this._visible = true;
    },
  };

  return ResidueFrequencyView;

})();
