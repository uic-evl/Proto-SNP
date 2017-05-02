"use strict";

var App = App || {};

const TrendImageView = (function() {

  /* initialize the self instance variable */
  let self = {
    height  : 0,
    width   : 0,
    domObj  : null,
    canvasContext : null
  };


  /* Clear the chart DOM of all elements */
  function clear_chart_dom() {
    self.domObj.selectAll().remove();
  }


  function  create_chart_canvas() {
    let canvas = self.domObj
      .append('canvas')
      .attr("id", "trendCanvas")
      .attr("class", "trendImage")
      .attr("width", self.width)
      .attr("height", self.height)
    ;
    self.canvasContext = canvas.node().getContext('2d');
  }


  /* Bind the data to a fake dom */
  function bind_data(family, colorScale) {
    /* Fake DOM*/
    let customBase = document.createElement('custom'),
      custom = d3.select(customBase),
      /* Fake Rows */
      rows = custom.selectAll(".customRows")
        .data(family.data)
        .enter().append("custom")
        .attr("id", (d,idx) => { return "p" + index[idx];})
        .attr("class", "proteinRow"),

      /* Fake columns -- bind the data */
      elements = rows.selectAll('.cell')
        .data( (protein) => { return protein; } );

    /* Update: add new items as needed */
    elements
      .enter().append('custom')
      .attr("class", "cell")
      .merge(elements)
      .attr("x", (d,i,j) => { return i * self.residue_glyph_size; })
      .attr("y", (d,i,j) => { return j * self.residue_glyph_size; })
      .attr('width',  self.residue_glyph_size)
      .attr('height', self.residue_glyph_size)
      .attr("row", (d, i, j) => { return j; })
      .attr("col", (d, i, j) => { return i; })
      .attr('fill',  (d) => { return colorScale(d).code; })
      .attr('stroke',(d) => { return colorScale(d).code; });

    /* Remove any unneeded elements */
    elements
      .exit()
      .transition()
      .attr('width', 0)
      .attr('height', 0)
      .remove();

    /* Return the data model */
    return custom;
  }


  function TrendImageView(model) {

    this._model = model;
    this._elements = bind_data(this._model.getFamily(), App.residueModel.getColor("side chain"));

    this.render = function(){
      return new Promise(function(resolve, reject) {
        /* First, clear the canvas*/
        self.canvasContext
          .clearRect(0,0,self.width + self.margin, self.height);

        //let image = context.createImageData(self.width + self.margin, self.height);

        /* Get the trend image elements from the data model */
        let elements = data_model.selectAll("custom.cell");

        /* Iterate over each element to render it to the canvas*/
        elements.each(function(d,i) {

          /* Get the residue from the element */
          let residue = d3.select(this);
          /* Set the fill color */
          self.canvasContext.fillStyle = residue.attr("fill");
          /* color the area of the residue */
          self.canvasContext
            .fillRect( parseInt(residue.attr('x')), parseInt(residue.attr('y')), self.residue_glyph_size, self.residue_glyph_size);
        });
        /* resolve when finished */
        resolve();
      }).then(function() {

      });
    };

    this.redraw = function() {
    }

  }

  TrendImageView.prototype = View.prototype;

  return TrendImageView;

})();
