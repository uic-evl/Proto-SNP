"use strict";

var App = App || {};

const ResidueFrequencyView = (function() {

  function ResidueFrequencyView(model, options) {
    let self = this;

    self._model = model;

    self._id = options.id;
    self._dom = d3.select("#"+self._id);
    self._parent = d3.select("div."+options.parent);

    self._barOffset = 10;
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
          frequencies = self._model.getSequenceFrequenciesFromRange(selection),
          protein = self._model.getSelectedProtein();
      /*Render the view */
      self.render({
        frequencies:frequencies,
        residues:protein.sequence.slice(selection[0], selection[1]),
        brush_pos: selection[0]*options.block_size + (selection[1]*options.block_size - selection[0]*options.block_size)/2.0
      });
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
          .range([self.bar_height, 0])
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
          .attr("height", self.bar_height)
          .attr('y', function(d) { return self.y_offset; })
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
          .attr('y', function(d) { return self.yScale(d[1]) + self.y_offset; })
          .attr("width", self.glyph_width)
          .attr("height", function(d) { return ( self.bar_height - self.yScale(d[1]) )  })
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
          .attr('x', function(d, i) { return self.xScale(i) + self.glyph_width / 2.0 })
          .attr("y", ()=>{return self.bar_height + self._barOffset + self.y_offset;})
          .attr("dy", ".35em")
          .text(function(d){ return d[0] })
          .style("text-anchor", "middle")
          .style("font-weight", "bold")
      ;
      /* Remove the unneeded frequency labels */
      frequencyText.exit().remove();
    };

    self.update = function(selected_residues) {
      /* Add the residue text to the bars */
      let selectionText = self._svg.selectAll(".selectionText")
          .data(selected_residues);

      // UPDATE: add new elements if needed
      selectionText
          .enter().append("text")
          .attr("class", "selectionText")
          /* Merge the old elements (if they exist) with the new data */
          .merge(selectionText)
          .attr('x', function(d, i) { return self.xScale(i) + self.glyph_width / 2.0 })
          .attr("y", () => {return self.y_offset - self._barOffset;})
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

    /* Render the line above the bars */
    self.render_context_lines = function(points) {
      /* Add the context bar above viewers */
      let context = this._svg
        .selectAll(".context-bar").data(points)
        .enter().append("path")
        .attr("d", (d) => { return d3Utils.lineFunction(d)})
        .attr("class", "context-bar");
    };

    /* Render the pointer bar */
    self.render_context_bars = function(render_options) {
      /* Add the bars to the viewer */
      let bar = self._svg
          .selectAll(".context-line")
          .data([render_options]);

      // UPDATE: add new elements if needed
      bar
          .enter().append('g')
          .append('rect')
          /* Merge the old elements (if they exist) with the new data */
          .merge(bar)
          .attr("class", "context-line")
          .attr("width", render_options.width)
          .attr("height", render_options.height)
          .attr('y', render_options.y)
          .attr('x', render_options.x)
          .style("fill", "black");

      /* Remove the unneeded bars */
      bar.exit().remove();
    };

      /* Initialize the viewer */
    self.initialize(options);
  }

  ResidueFrequencyView.prototype = {

    initialize : function (options) {
      /* Show the viewer */
      this._parent.classed("hidden", false);

      this.width   = options.width / 2.0;
      this.height  = this._parent.node().clientHeight;
      this.aspectRatio  = this.height/this.width;
      this.semantic = options.semantic;

      this.bar_height = this.height  * 0.3;
      this.bar_y = this.height  * 0.4;
      this.y_offset = (this.height - this.bar_height + this._barOffset)/2.0;
      this.glyph_width = this.bar_height * 2.0;

      /* Set the DOM's width/height so it centers in it's parent */
      this._dom
          .style("width", this.width)
          .style("height", this.height);

      this._parent
          .style("width", options.width)
          .style("margin-left", options.margin);

      /* Clear the dom element */
      d3Utils.clear_chart_dom(this._dom);
      this._svg = d3Utils.create_chart_svg(this._dom, {width:this.width, height:this.height});
      this.range = [options.offset*2, this.width];
      let scale = d3.scaleLinear().domain([0, options.max_items]).range(this.range),
        y_position = this._barOffset/2.0,
        /* Set the width of the context line */
        width_offset = scale(options.max_items-1);
        width_offset += (scale(options.max_items) - width_offset) * 0.9;

      let contextPoints = [
          [ {x: this._barOffset,   y:y_position},     { x: width_offset, y: y_position}],
          [ {x: this._barOffset+1, y: y_position},    { x: this._barOffset+1, y:y_position + this._barOffset} ],
          [ {x: width_offset-1,    y: y_position},    { x: width_offset-1, y:y_position + this._barOffset}] ];

      this.render_context_lines(contextPoints);
    },

    render : function(render_options) {
      /* Set the scales based on the new selection */
      this.set_scales(render_options.frequencies, this._familyMemberCount, render_options.residues);
      /* Render the bars */
      this.render_bars(render_options.frequencies, this._familyMemberCount);
      this.render_labels(render_options.frequencies);
      /* Update the labels */
      this.update(render_options.residues);
      /* Render the context bars */
      this.render_context_bars({
        x: (this.semantic==="left") ? render_options.brush_pos:render_options.brush_pos-this.width,
        y: 1,
        height: 10,
        width:1
      });
      /* Set the visibility flag to true*/
      this._visible = true;
    },
  };

  return ResidueFrequencyView;

})();
