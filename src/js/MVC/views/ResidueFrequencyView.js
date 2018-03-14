"use strict";

var App = App || {};

const ResidueFrequencyView = (function() {

    function ResidueFrequencyView(model, options) {
        let self = this;

        self._model = model;

        self._id = options.id;
        self._dom = d3.select("#"+self._id);
        self._parent = options.parent;

        self._barOffset_x = 0;
        self._barOffset_y = 8;
        self._familyMemberCount = options.rows;
        self._svg = null;
        self._visible = false;
        self.frequencyRange = null;
        self.summary_margin = 0;
        self.label_offset = options.label_size;
        self.label_length = options.label_length;

        self._calloutWidth = 125;
        self._calloutHeight = 200;

        let trendImage = d3.select("#trendImageViewer").node(),
            menu_height = d3.select("#menu").node().clientHeight,
            body_height = d3.select("#main_container").node().clientHeight,
            window_height = window.innerHeight;
        self.space = window_height - body_height - menu_height;
        self.left_padding = utils.getComputedStyleValue(trendImage, "padding-left");
        self.right_padding = utils.getComputedStyleValue(trendImage, "padding-right");

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

        function updateProteinLabel() {
            /* Add label for the protein's name */
            let protein_label = self._summarySvg.selectAll(".proteinLabel")
                .data([{
                    text: self._model.getSelectedProtein().name, size: "0.5em",
                    x: 0, y: self.y_offset - self._barOffset_y + self.summary_margin +1
                }]);

            /* Create / merge */
            protein_label
                .enter().append("g").append("text")
                .attr("class", "proteinLabel")
                .merge(protein_label)
                .attr('x', (d) => {return d.x;})
                .attr("y", (d) => {return d.y;})
                .attr("dy", (d) => {return d.size})
                .text((d) => {return App.textUtilities.truncate(d.text, self.label_length) + " Residue"})
                .call(App.textUtilities.wordWrap, self.label_offset+5);
        }

        function addTextBackground(el) {
            let ctx =  self._summarySvg.node(),
                SVGRect = el.getBBox();

            let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", SVGRect.x);
            rect.setAttribute("y", SVGRect.y);
            rect.setAttribute("width", SVGRect.width);
            rect.setAttribute("height", SVGRect.height);
            rect.setAttribute("class", "rangeBackground");
            rect.setAttribute("fill", "#ecf0f1");
            self._summarySvg.node().insertBefore(rect, el);
        }

        /* Set the model listeners */
        /* Update on horizontal paddle move */
        self._model.selectedProteinChanged.attach(function(sender, msg){
            /* Not initialized yet */
            if(!self._visible) return;
            /* Render the view */
            let selection = self._model.getSelectedResidues(options.semantic).selection,
                protein = msg.selection;
            /* Render the view */
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
                brush_center: selection[0]*options.block_size + (selection[1]*options.block_size - selection[0]*options.block_size)/2.0,
                brush_pos: [selection[0]*options.block_size,  selection[1]*options.block_size],
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
                .attr('y', ()=> { return self.y_offset })
                .attr('x', (d, i)=>{ return self.xScale(i) - self.glyph_width/4.0; })
                .on('mouseover', createStackedBarChart)
                .on('mouseout', this.tip.hide)
                .style("fill", "white");

            /* Remove the unneeded bars */
            bar.exit().remove();

            /* Color the bars according to the frequency of the residue*/
            let frequency =
                self._svg
                // .select(".bar_group")
                    .selectAll(".frequencies")
                    .data(residue_frequencies);

            // UPDATE: add new elements if needed
            frequency
                .enter().append("rect")
                .attr("class", "frequencies")
                /* Merge the old elements (if they exist) with the new data */
                .merge(frequency)
                .attr('x', function(d, i) { return self.xScale(i) - self.glyph_width/4.0 })
                .attr('y', function(d) { return self.yScale(d[1]) + self.y_offset; })
                .attr("width", self.glyph_width)
                .attr("height", function(d) { return ( self.bar_height - self.yScale(d[1]) )  })
                .on('mouseover', createStackedBarChart)
                .on('mouseout', this.tip.hide)
                .on('click', function(d,i,a) {
                    let protein = self._model.getSelectedProtein();
                    App.textUtilities.occurrences(protein.sequence.join(), d[0]);
                })
                .attr("fill", function(d,i) { return (d[0] === selected_residues[i]) ? "#990000" : "#D3D3D3"; })
            ;
            /* Remove the unneeded frequency bars */
            frequency.exit().remove();
        };

        self.render_labels = function(residue_frequencies){
            /* Add the residue text to the bars */
            let frequencyText =
                self._svg
                    .selectAll(".residueText")
                    .data(residue_frequencies);

            // UPDATE: add new elements if needed
            frequencyText
                .enter().append("text")
                .attr("class", "residueText")
                /* Merge the old elements (if they exist) with the new data */
                .merge(frequencyText)
                .attr('x', function(d, i) { return self.xScale(i) + self.glyph_width / 4.0 })
                .attr("y", ()=>{return self.bar_height + self._barOffset_y + self.y_offset;})
                .attr("dy", ".35em")
                .text(function(d){ return d[0] })
                .style("text-anchor", "middle")
                // .style("font-weight", "bold")
                .style('cursor', 'default')
                .append("svg:title")
                .text(function(d, i) { return 'Most frequent: ' +  d[0] + ' \nOccurrences: ' + d[1] });
            /* Remove the unneeded frequency labels */
            frequencyText.exit().remove();

            if(options.semantic === "left") {
                /* Add the consensus label */
                let consensus_label = self._summarySvg.selectAll(".consensusLabel")
                    .data(
                        [{
                            text:"Family Consensus Residue",
                            width: self._summarySvg.attr("width"), size: "0.5em",
                            x:0, y:self.bar_height/2.0 + self._barOffset_y + self.y_offset + self.summary_margin
                        }]);

                /* Create / merge */
                consensus_label
                    .enter().append("g").append("text")
                    .attr("class", "consensusLabel")
                    .attr('x', (d)=>{return d.x ;})
                    .attr("y", (d)=>{return d.y ;})
                    .attr("dy", (d)=>{return d.size})
                    .text((d)=>{return d.text;})
                    .call(App.textUtilities.wordWrap, self.label_offset+5);
            }

        };

        self.update = function(selected_residues, range) {
            /* Add the residue text to the bars */
            let selectionText =
                self._svg
                    .selectAll(".selectionText")
                    .data(selected_residues) ;

            // UPDATE: add new elements if needed
            selectionText
                .enter().append("text")
                .attr("class", "selectionText")
                /* Merge the old elements (if they exist) with the new data */
                .merge(selectionText)
                .attr('x', (d, i)=> { return self.xScale(i) + self.glyph_width / 4.0 })
                .attr("y", () => {return self.y_offset - self._barOffset_y;})
                .attr("dy", "0.5em")
                .text((d,i)=>{ return '(' + (range[0] + i+1) + ') ' + d[0] })
                .style("text-anchor", "middle")
                .style("font-weight", "900")
                .style('cursor', 'default')
                .append("svg:title")
                .text(function(d, i) { return d[0] + ' at position ' + (range[0]+ i+1) })
            ;
            /* Remove the unneeded selection labels */
            selectionText.exit().remove();

            /* Update the color for matching residues*/
            self._svg.selectAll(".frequencies")
                .attr("fill", (d,i)=>{ return (d[0] === selected_residues[i]) ?  "#D3D3D3" : "#990000"; });

            if(options.semantic === "left") {
                updateProteinLabel();
            }
        };

        self.renderContext = function(options) {
            let scale = d3.scaleLinear().domain([0, this.max_items]).range(this.range),
                y_position = this._barOffset_y/2.0,
                x_bar_position = (this.semantic==="left") ? options.brush_center : options.brush_center-this.width,
                contextPoints = [],
                /* Set the width of the context line */
                width_offset = scale(this.max_items-1),
                context_bar_height = 10,
                offset = self.left_padding,
                context_offset_y = context_bar_height+self.summary_margin;
            width_offset += (scale(this.max_items) - width_offset) * 0.95;

            /* Render the context bar */
            d3Utils.render_context_bars(this._svg,
                {
                    x: x_bar_position, y: 1,
                    height: context_bar_height, width:1
                });
            /* render the context lines */
            if(this.semantic === "left"){
                contextPoints = [
                    [ {x: this._barOffset_x+offset, y: y_position+self.summary_margin},  { x: options.brush_pos[0]+offset, y: 0}],
                    [ {x: width_offset+offset,      y: y_position+self.summary_margin},  { x: options.brush_pos[1]+offset, y: 0} ],
                ];
            }
            else {
                contextPoints = [
                    [ {x: width_offset,      y: y_position+self.summary_margin},  { x: options.brush_pos[1]-this.width, y: 0}],
                    [ {x: this._barOffset_x, y: y_position+self.summary_margin},  { x: options.brush_pos[0]-this.width, y: 0} ],
                ];
            }
            d3Utils.render_context_lines(this._summarySvg, contextPoints, "context-line-width");

            /* Add range text between the context lines */
            let range_text = (options.range[0]+1) + " - " + options.range[1],
                range_labels = this._summarySvg.selectAll(".rangeLabel")
                    .data([{text:range_text, width: this._summarySvg.attr("width"), size:"0.8em"}]);

            /* Create / merge */
            range_labels
                .enter().append("text")
                .attr("class", "rangeLabel")
                .merge(range_labels)
                .attr('x', function(d, i) {
                    /* Get the width of the rendered text*/
                    let font_family = utils.getComputedStyleValue(this, "font-family"),
                        font_size   = App.textUtilities.emToPixels(d.size),
                        font = font_size + "px " + font_family,
                        text_length = App.textUtilities.getTextWidth(font, d.text),
                        /* Center of the brush */
                        center = (contextPoints[0][1].x + contextPoints[1][1].x)/2.0,
                        end_position = center + text_length/2.0;
                    /* Test the text length */
                    if(end_position > d.width){
                        center = center - (end_position-d.width);
                    }
                    return center;
                })
                .attr("y", (d)=>{return App.textUtilities.emToPixels(d.size)/4.0})
                .attr("dy", (d)=>{return d.size})
                .text(range_text);

            /* Add a background to the label */
            d3.selectAll(".rangeBackground").remove();
            addTextBackground(self._summarySvg.select(".rangeLabel").node());
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
                .style("height",  this.clientHeight);

            this.width   = options.width / 2.0;
            this.height  = options.height;
            this.aspectRatio  = this.height/this.width;
            this.semantic = options.semantic;

            this.bar_height = options.bar_height;
            this.y_offset = (this.height - this.bar_height + this._barOffset_y)/2.0;
            this.glyph_width = options.bar_width;
            this.max_items = options.max_items;

            this._dom
                .style("width", this.width)
                .style("height", this.height);

            /* Clear the dom element */
            d3Utils.clear_chart_dom(this._dom);

            /* Initialize the svg */
            this._svg = this._dom.select(".freqSVG");

            d3Utils.set_chart_size(this._svg.node(), this.width, this.height);
            this.summary_margin = utils.getComputedStyleValue(this._dom.select(".freqSVG").node(), "margin-top");

            this._summarySvg = this._dom.select(".summarySVG");
            d3Utils.set_chart_size(this._summarySvg.node(),
                this.width, this.height+this.summary_margin*2);

            if(options.semantic === "left"){
                this._svg.style("right",0);
            }
            else {
                this._svg.style("left",0);
                this._summarySvg.style("left",0);
            }

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
            this.range = [options.offset_x+self.label_offset, this.width];

            let scale = d3.scaleLinear().domain([0, options.max_items]).range(this.range),
                y_position = this._barOffset_y/2.0,
                /* Set the width of the context line */
                width_offset = scale(options.max_items-1);
            width_offset += (scale(options.max_items) - width_offset) * 0.95;

            let contextPoints = [
                [ {x: this._barOffset_x,   y:y_position},   { x: width_offset, y: y_position}],
                [ {x: this._barOffset_x+1, y: y_position},  { x: this._barOffset_x+1, y:y_position + this._barOffset_y} ],
                [ {x: width_offset,    y: y_position},      { x: width_offset, y:y_position + this._barOffset_y}]
            ];

            d3Utils.render_context_lines(this._svg, contextPoints);

            if(options.semantic === "left"){
                App.residueMappingUtility.createColorLegend("family");
            }
        },

        render : function(render_options) {
            /* Set the scales based on the new selection */
            this.set_scales(render_options.maxFrequencies, this._familyMemberCount, render_options.residues);
            /* Re-set the range to center glyphs */
            this.range[0] = (this.width - this.xScale(render_options.residues.length-1) )/2.0 + this.label_offset;
            this.xScale.range(this.range);

            // console.log(this.width-this.xScale(render_options.residues.length-1));
            /* Render the bars */
            this.frequencyRange = render_options.range;
            this.render_bars(render_options.maxFrequencies, this._familyMemberCount);
            this.render_labels(render_options.maxFrequencies);
            /* Update the labels */
            this.update(render_options.residues, render_options.range);
            /* Render the context bars */
            this.renderContext(render_options);

            /* Set the visibility flag to true*/
            this._visible = true;
        },

        resize : function() {}
    };
    return ResidueFrequencyView;
})();
