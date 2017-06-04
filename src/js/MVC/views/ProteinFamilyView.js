"use strict";

var App = App || {};

const ProteinFamilyView = (function() {

  function ProteinFamilyView(model, element) {

    let self = this;

    self._model = model;
    self.residueMappingUtility = new ResidueMappingUtility();
    self._id = element.id;
    self._dom = d3.select("#"+self._id);

    /* The user has uploaded or downloaded an alignment file */
    this.fileUploaded = new EventNotification(this);

    /* Bind the protein family listener */
    this._model.proteinFamilyAdded.attach(function(sender, msg){

      let family = msg.family;

      /* Initialize the trend image */
      self.initialize(family);

      let colorMapping = self.residueMappingUtility.getColor("side chain"),//App.colorMapping);
          data_model = d3Utils.bind_data({sequences: family.data, names: family.index}, colorMapping, self.residue_glyph_size);

      self.render(data_model).then(function () {
        /* Add the brushes to the canvas */
        //add_brushes(trendImageViewer.brushSVG);
        /* Render the brushes */
        //render_brushes(trendImageViewer.initHorizontalBrush, trendImageViewer.initVerticalBrushes);
        /* Create the legend */
        //App.residueModel.createColorLegend();
      });


    });

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

      // create_brush_svg();

      d3Utils.clear_chart_dom(this._dom);
    },

    render: function (data_model) {
      let view = this;
      return new Promise(function (resolve, reject) {
        /* First, clear the canvas*/
        view.backBufferContext
            .clearRect(0, 0, view.width, view.height);

        //let image = context.createImageData(view.width + view.margin, view.height);

        /* Get the trend image rows from the data model */
        let rows = data_model.selectAll("custom.proteinRow");

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
    recolor: function () {
      let colorMapping = this.residueMappingUtility.getColor(App.colorMapping);
      /* If a trend image exists, recolor based on the new color map */
      if (self.svg) {
        self.svg
            .selectAll(".cell")
            .attr('fill', function (d) {
              let col = parseInt(d3.select(this).attr("col")),
                  highestFreq = self.column_frequencies.getMostFrequentAt(col);
              return colorMapping(d, highestFreq).code;
            })
            .attr('stroke', function (d) {
              let col = parseInt(d3.select(this).attr("col")),
                  highestFreq = self.column_frequencies.getMostFrequentAt(col);
              return colorMapping(d, highestFreq).code;
            })
      }
    }
  };
  return ProteinFamilyView;

})();
