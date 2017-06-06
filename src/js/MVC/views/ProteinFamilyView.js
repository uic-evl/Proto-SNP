"use strict";

var App = App || {};

const ProteinFamilyView = (function() {

  function ProteinFamilyView(model, element) {

    let self = this;

    self._model = model;
    self._id = element.id;
    self._dom = d3.select("#"+self._id);
    self.residueMappingUtility = new ResidueMappingUtility();
    self._dataModel = null;

    /* The user has uploaded or downloaded an alignment file */
    self.fileUploaded = new EventNotification(this);
    self.imageRendered = new EventNotification(this);

    /* Bind the protein family listener */
    self._model.proteinFamilyAdded.attach(function(sender, msg){
      let family = msg.family,
          colorMapping = self.residueMappingUtility.getColor(self._model.getProteinColoring());

      /* Initialize the trend image */
      self.initialize(family);

      self._dataModel = d3Utils.bind_data({sequences: family.data, names: family.index}, colorMapping, self.residue_glyph_size);

      self.render().then(function () {

        let verticalPaddleSize   = 6,
            horizontalPaddleSize = 1,
            maxPaddleSize = 10;

        self.imageRendered.notify({
          brushes : [
            {
              orientation: App.HORIZONTAL_PADDLE, paddleSize: horizontalPaddleSize, class:"brush horizontal",
              extent: [[0, 0], [self.width, self.height]], block_size: self.residue_glyph_size,
              position: [0, self.residue_glyph_size]
            }, {
              orientation: App.VERTICAL_PADDLE, paddleSize: verticalPaddleSize, maxPaddleSize: maxPaddleSize,
              class:"brush vertical-left", extent: [[0, 0], [self.width, self.height]],
              block_size: self.residue_glyph_size, semantic: "left",
              position: [0, self.residue_glyph_size * verticalPaddleSize]
            }, {
              orientation: App.VERTICAL_PADDLE, paddleSize: verticalPaddleSize, maxPaddleSize: maxPaddleSize,
              class:"brush vertical-right", extent: [[0, 0], [self.width, self.height]],
              block_size: self.residue_glyph_size, semantic: "right",
              position: [self.width - self.residue_glyph_size * verticalPaddleSize, self.width]}
          ],
          frequencyViewers : [
            {id: 'leftResidueSummaryViewer',  semantic: "left",  max_items: maxPaddleSize,
              block_size: self.residue_glyph_size, offset: 25, width: Math.floor(self.width/2.0), height: self.height},
            {id: 'rightResidueSummaryViewer', semantic: "right", max_items: maxPaddleSize,
              block_size: self.residue_glyph_size, offset: 25, width: Math.floor(self.width/2.0), height: self.height}
          ]
        });

        /* Create the legend */
        //App.residueModel.createColorLegend();
      });
    });

    /* The coloring scheme changed */
    self._model.proteinColoringChanged.attach(function(sender, msg){
      if (!self._dataModel) return;
      let colorMap = msg.scheme;
      self.recolor(colorMap);
      self.render();
    });

    /* Getter for the x-Axis scale */
    self.getXAxisScale = function() { return self.xScale; };

    /* Getter for the y-Axis scale */
    self.getYAxisScale = function() { return self.yScale; };

    /* Set the dimensions of the data */
    self.set_data_dimensions_sizes = function(family_data) {
      /* Get/store the length of the longest sequence */
      self.x_axis_length = parseInt(_.max(d3.set(family_data
          .map((residue) => { return residue.length; } ))
          .values()));
      /* Get/store the length of the y-axis -- i.e. how many proteins it contains */
      self.y_axis_length =  this._model.getProteinNames().length;
    };

    /* Setter for the chart dimensions */
    self.set_chart_dimensions = function() {

      let container_width = self._dom.node().parentNode.clientWidth,
          container_height = self._dom.node().parentNode.clientHeight,
          residue_width = Math.floor(container_width / self.x_axis_length);

      /* Reset the viewers width and height*/
      let viewer_width = residue_width *  self.x_axis_length;

      /*Reset the parent dom width/heights*/
      self._dom.classed("trend-viewer", false);
      self.width = viewer_width;

      /* Make sure the height of the data does not exceed the height of the container */
      let temp_height = self.y_axis_length * residue_width;

      /* We must reset the height of the trend image */
      if(temp_height < container_height) {
        container_height = temp_height;
      }
      else if(temp_height > container_height) {
        self.width = container_width;
        self.overviewImage = true;
      }
      self.height = container_height;

      /* Resize the DOM elements*/
      document.getElementById('trendImageViewer').parentNode.style.height = self.height;
      document.getElementById('trendImageViewer').style.height = self.height;

      document.getElementById('trendImageViewer').parentNode.style.width = self.width;
      document.getElementsByClassName('TrendImageView')[0].style.width = self.width;
    };

    /* Setter for the names of the proteins from the family */
    self.set_glyph_size = function() {
      /* Get and save the size of each residue for the trend image based on the width of the screen */
      self.residue_glyph_size = Math.round( self.width /self.x_axis_length);
    };

    /* Setter for the number of proteins we can display in a single view */
    self.set_proteins_per_view = function() {
      self.ppv = self.height / self.residue_glyph_size;
    };

    self.set_y_scale = function(values) {
      /* construct the y-scale */
      self.yScale = d3.scaleBand()
          .domain(values)
          .range([0, self.ppv * self.residue_glyph_size]);
    };

    /* Setter for the trend image scales */
    self.set_chart_scales = function() {
      /* construct the x-scale */
      self.xScale = d3.scaleLinear()
          .domain([0, self.x_axis_length])
          .range([0, Math.ceil((self.width)/self.residue_glyph_size)*self.residue_glyph_size]);
      /* Set the y scale with the protein names*/
      self.set_y_scale(_.slice(self._model.getProteinNames(), 0, self.ppv))
    }
  }

  ProteinFamilyView.prototype = {

    show: function () {
      let view = this;
      /* load the splash screen if there is no model data*/
      if (!view._model.isEmpty()) {
        $('#trendSplash').load("./src/html/familySplashTemplate.html", function () {
          let splash = $(this);
          /* Setup the upload callback for files */
          App.fileUtilities.familyUploadSetup(splash.find("#fileupload-family"),
              function (data, extension) {
                view.fileUploaded.notify({data: data, type: extension});
                /* Remove the splash screen */
                view._dom.select('#trendSplash').remove();
              });
        });
      }
    },

    initialize: function (family) {

      this.set_data_dimensions_sizes(family.data);
      this.set_chart_dimensions();
      this.set_glyph_size();
      this.set_proteins_per_view();

      /* Add the canvas and brush svg to the trend image dom*/
      this.canvasContext = d3Utils.create_chart_canvas(this._dom, this.width, this.height);
      this.backBufferContext = d3Utils.create_chart_back_buffer(this.width, this.height);

      this.set_chart_scales();
      d3Utils.clear_chart_dom(this._dom);
    },

    render: function () {
      let view = this;
      return new Promise(function (resolve, reject) {
        /* First, clear the canvas*/
        view.backBufferContext
            .clearRect(0, 0, view.width, view.height);

        //let image = context.createImageData(view.width + view.margin, view.height);

        /* Get the trend image rows from the data model */
        let rows = view._dataModel.selectAll("custom.proteinRow");

        /* Iterate over each element to render it to the canvas*/
        rows.each(function (d, i) {
          let columns = d3.select(this).selectAll("custom.cell");
          columns.each(function (d, i) {
            /* Get the residue from the element */
            let residue = d3.select(this);
            /* Set the fill color */
            view.backBufferContext.fillStyle = residue.attr("fill");
            /* color the area of the residue */
            view.backBufferContext
                .fillRect(parseInt(residue.attr('x')), parseInt(residue.attr('y')), view.residue_glyph_size, view.residue_glyph_size);
          });
        });

        let image = view.backBufferContext.getImageData(0, 0, view.width, view.height);
        view.canvasContext.putImageData(image, 0, 0);
        /* create the overview if the image runs off the page*/
        if (view.overviewImage) {
        }
        /* resolve when finished */
        resolve();
      });
    },

    reorder: function () {
      let protein_family = this._model.getProteinData();
      /* Get the new order for the protein rows in descending order */
      let ordering_scores = _.chain(protein_family)
          .sortBy((protein) => {
            return protein.scores[App.sorting];
          })
          .reverse().slice(0, this.ppv).value();

      this.svg
          .transition().duration(1000)
          .selectAll(".cell")
          .attr("transform", function (d, i) {
            let row = parseInt(d3.select(this).attr("row")),
                col = parseInt(d3.select(this).attr("col")),
                x_pos = col * this.residue_glyph_size,
                curr_y_pos = _.indexOf(ordering_scores, protein_family[row]) * this.residue_glyph_size;
            return App.utilities.translate(x_pos, curr_y_pos);
          })
          .attr("row", function () {
            let row = parseInt(d3.select(this).attr("row"));
            return _.indexOf(ordering_scores, protein_family[row]);
          })
          .call(function () {
            /* Reorder the labels*/
            //reorder_labels(ordering_scores);
            /* Set the new y-scale so the brushes have an updated lookup table */
            this.set_y_scale(_.map(ordering_scores, "name"));

            // TODO make event to pass to controller for reordering
            set_protein_family(ordering_scores);


            /* Reset the brush selections */
            //reset_brushes();
          });
    },

    /* Function to redraw the trend image */
    recolor: function (colorMapping) {
      let colorScale = this.residueMappingUtility.getColor(colorMapping),
          view = this;
      /* If a protein family exists, recolor based on the new color map */
      if (this._dataModel) {
        this._dataModel
            .selectAll("custom.cell")
            .attr('fill',   function(d) {
              let col = parseInt(d3.select(this).attr("col")),
                  mostFreq = view._model.getSequenceFrequencyAt(col);
              return colorScale(d, mostFreq).code;
            })
            .attr('stroke', function(d){
              let col = parseInt(d3.select(this).attr("col")),
                  mostFreq = view._model.getSequenceFrequencyAt(col);
              return colorScale(d, mostFreq).code;
            });
      }
    },

    attachBrushes: function(brushViews) {
      /* Multiple Brushes help: http://bl.ocks.org/jssolichin/54b4995bd68275691a23*/
      let brushSVG = d3Utils.create_brush_svg(this._dom, this.width, this.height)
          .append("g")
          .attr("class", "brushes")
          .style("width", this.width)
          .style("height", this.residue_glyph_size * this.y_axis_length);
      /* Attach the brushes to the svg */
      brushViews.forEach(function(view){
        let brush = view.getBrush(),
            brushObj = brushSVG.append("g")
              .attr("class", view.brushObj.getBrushClass)
              .call(brush)
              .call(brush.move, view.getInitialPosition());
        /*render the brush */
        view.render(brushObj);
      });
    },

    getXDimensionSize: function() { return this.x_axis_length; },

    getYDimensionSize: function() { return this.y_axis_length; }

};
  return ProteinFamilyView;

})();
