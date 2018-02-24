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
    self.frequencyRange = null;

    self._calloutWidth = 125;
    self._calloutHeight = 200;

    function createStackedBarChart(d,i) {
      /* Show the tooltip*/
      self.tip.show(d,i);

      /* Render stacked bar of the frequencies */
      let height = self._calloutHeight, width = self._calloutWidth,
          margin = {top: 10, right: 20, bottom: 30, left: 40},
          xOffset = 25;

      /* Select the colormap*/
      let colorMap = App.residueMappingUtility.getColor("Side Chain Class", "family");

      let x = d3.scaleBand()
          .rangeRound([0, width])
          .paddingInner(0.05)
          .align(0.1),

        y = d3.scaleLinear()
          .rangeRound([height, 0]);

      let tipSVG = d3.select("#"+self.semantic+"tipDiv svg")
          .append('g')
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")"),

      /* Get the raw column data*/
      range = self.frequencyRange[0] + i,
      raw = self._model.getSequenceFrequenciesFromRange([range,range+1]),
      domains = [{column: i, data: raw[0]}];

      /* Set the domains */
      x.domain(domains.map(function(d) { return d.column; }));
      y.domain([0, _.sum(_.values(raw[0]))]).nice();

      /* Extract and sort the pairs*/
      let ticks = y.ticks(),
          tickSpacing = Math.ceil((ticks[1] - ticks[0]) / 2.0),
        pairs = _.toPairs(raw[0]);
        pairs = _.filter(pairs, function(o){ return o[1] >= tickSpacing; });
        pairs.sort(function(a,b){ return b[1] - a[1];});

      raw[0] = _.fromPairs(pairs.slice(0,5));

      /* Get the keys*/
      let keys = _.keys(raw[0]);

      /* Render the bars */
      let g = tipSVG.append("g")
          .selectAll("g")
          .data(d3.stack().keys(keys)(raw))
          .enter().append("g")
          .attr("fill", function(d) { return colorMap(d.key).code; });

      g.selectAll("rect")
          .data(function(d) { return d; })
            .enter().append("rect")
            .attr("x", function(d) { return 10 + x(domains[0].column); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("height", function(d) { return y(d[0]) - y(d[1]); })
            .attr("width", 40);

      /* Add text over the bars to show the residues */
      g.selectAll("text")
          .data(function(d) { return d; })
          .enter().append("text")
          .text(function(d,i,j) { return keys[j] })
          .attr("y", function(d) { return y(d[1]) + Math.round((y(d[0]) - y(d[1]))/2.0) + 3; })
          .attr("x", function(d) { return 60 + x(domains[0].column); })
          .style('font-size', '10px')
          .attr("text-anchor", "middle")
          .style("fill", '#FFF');

      /* Add the y-axis */
      tipSVG.append("g")
          .attr("class", "axis")
          .attr("transform", "translate("+-width/2.0+"," + height + ")")
          .call(d3.axisBottom(x));

      /* Add axis text/tics */
      tipSVG.append("g")
          .attr("class", "axisPop")
          // .attr("x", xOffset)
          .call(d3.axisLeft(y).ticks(null, "s"));

      tipSVG.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - (margin.left+xOffset/2))
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", '#FFF')
        .text("Residue Count");
    }

    /* Set the model listeners */
    /* Update on horizontal paddle move */
    self._model.selectedProteinChanged.attach(function(sender, msg){
      /* Not initialized yet */
      if(!self._visible) return;
      /* Render the view */
      let selection = self._model.getSelectedResidues(options.semantic).selection,
          protein = msg.selection;
      /*Render the view */
      self.update(protein.sequence.slice(selection[0], selection[1]), [selection[0], selection[1]]);
    });

    /* Update on vertical paddle move */
    self._model.selectedResiduesChanged.attach(function(sender, msg){
      /* Not initialized yet */
      if(!self._visible || (msg.semantic !== options.semantic) ) return;
      /* Update the labels to the new selection */
      let selection = msg.selection,
          maxFrequencies = self._model.getMaxSequenceFrequenciesFromRange(selection),
          protein = self._model.getSelectedProtein();
      /*Render the view */
      self.render({
        maxFrequencies:maxFrequencies,
        residues:protein.sequence.slice(selection[0], selection[1]),
        brush_pos: selection[0]*options.block_size + (selection[1]*options.block_size - selection[0]*options.block_size)/2.0,
        range: [selection[0], selection[1]]
      });
    });

    self.set_scales = function(residue_frequencies, family_member_count) {
      /*Set the scale for the x-axis */
      self.xScale = d3.scaleLinear()
          .domain([0, residue_frequencies.length])
          .range(self.range);
      self.yScale = d3.scaleLinear()
          .domain([0, family_member_count])
          .range([self.bar_height, 0]);
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
          .attr("class", function(d,i){return "freq_bars r" + i})
          .attr("width", self.glyph_width)
          .attr("height", self.bar_height)
          .attr('y', function(d) { return self.y_offset; })
          .attr('x', function(d, i) { return self.xScale(i) })
          .on('mouseover', createStackedBarChart)
          .on('mouseout', this.tip.hide)
          .on('click', function(d,i,a) {
            console.log(d);
          })
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
          .on('mouseover', createStackedBarChart)
          .on('mouseout', this.tip.hide)
          .on('click', function(d,i,a) {
            let protein = self._model.getSelectedProtein();
            let occ = App.textUtilities.occurrences(protein.sequence.join(), d[0]);
          })
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
          .style('cursor', 'default')
        .append("svg:title")
          .text(function(d, i) { return 'Most frequent: ' +  d[0] + ' \nOccurrences: ' + d[1] })
      ;
      /* Remove the unneeded frequency labels */
      frequencyText.exit().remove();
    };

    self.update = function(selected_residues, range) {
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
          .text(function(d,i){ return '(' + (range[0] + i+1) + ') ' + d[0] })
          .style("text-anchor", "middle")
          .style("font-weight", "bold")
          .style('cursor', 'default')
        .append("svg:title")
          .text(function(d, i) { return d[0] + ' at position ' + (range[0]+ i+1) })
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
      let self = this;
      /* Show the viewer */
      this._parent.classed("hidden", false);
      /* Set the DOM's width/height so it centers in it's parent */
      this._parent
          // .style("width", options.width)
          // .style("margin-left", options.margin)
          .style("height", function(){
            return (options.overviewImage) ? this.clientHeight : 75;
          });

      this.width   = options.width / 2.0;
      this.height  = this._parent.node().clientHeight;
      this.aspectRatio  = this.height/this.width;
      this.semantic = options.semantic;

      this.bar_height = this.height  * 0.3;
      this.y_offset = (this.height - this.bar_height + this._barOffset)/2.0;
      this.glyph_width = this.bar_height * 2.0;

      this._dom
          .style("width", this.width)
          .style("height", this.height);

      /* Clear the dom element */
      d3Utils.clear_chart_dom(this._dom);

      /* Initialize the svg */
      this._svg = this._dom.select("svg");
      d3Utils.set_chart_size(this._svg.node(), this.width, this.height);

      /* Initialize tooltip */
      this.tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(function(d) {
            return "<div id='" + self.semantic + "tipDiv'>" +
              "<h5 style=' text-align: center; margin-top:0; font-weight: bold'>Most frequent</h5>" +
              "<svg class='barCallout' style='height:" + (self._calloutHeight + 15) + "px; width:" + self._calloutWidth + "px;'></svg></div>"
          });

      /* Invoke the tooltip */
      this._svg.call(this.tip);
      this.range = [options.offset_x, this.width];

      let scale = d3.scaleLinear().domain([0, options.max_items]).range(this.range),
        y_position = this._barOffset/2.0,
        /* Set the width of the context line */
        width_offset = scale(options.max_items-1);
        width_offset += (scale(options.max_items) - width_offset) * 0.9;

      let contextPoints = [
          [ {x: this._barOffset,   y:y_position},     { x: width_offset, y: y_position}],
          [ {x: this._barOffset+1, y: y_position},    { x: this._barOffset+1, y:y_position + this._barOffset} ],
          [ {x: width_offset-1,    y: y_position},    { x: width_offset-1, y:y_position + this._barOffset}]
      ];

      //d3Utils.render_context_lines(this._svg, contextPoints);
    },

    render : function(render_options) {
      /* Set the scales based on the new selection */
      this.set_scales(render_options.maxFrequencies, this._familyMemberCount, render_options.residues);
      /* Re-set the range to center glyphs */
      this.range[0] = (this.width - this.xScale(render_options.residues.length-1))/2.0;
      this.xScale.range(this.range);

      // console.log(this.width-this.xScale(render_options.residues.length-1));
      /* Render the bars */
      this.frequencyRange = render_options.range;
      this.render_bars(render_options.maxFrequencies, this._familyMemberCount);
      this.render_labels(render_options.maxFrequencies);
      /* Update the labels */
      this.update(render_options.residues, render_options.range);
      /* Render the context bars */
      // d3Utils.render_context_bars(this._svg,
      //   {
      //     x: (this.semantic==="left") ? render_options.brush_pos : render_options.brush_pos-this.width,
      //     y: 1,
      //     height: 10,
      //     width:1
      //   });
      /* Set the visibility flag to true*/
      this._visible = true;
    },
  };
  return ResidueFrequencyView;
})();
