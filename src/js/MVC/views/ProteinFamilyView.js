"use strict";

var App = App || {};

const ProteinFamilyView = (function() {

  function ProteinFamilyView(model, element) {
    let self = this;

    self._model = model;
    self._id = element.id;
    self.overviewImage = false;

    self._parentDom = d3.select("#"+self._id);
    self._dom = self._parentDom.append("div")
        .classed("trendDiv", true)
        .classed("center-aligned", true);

    /* The user has uploaded or downloaded an alignment file */
    self.fileUploaded = new EventNotification(this);
    self.imageRendered = new EventNotification(this);
    self.overviewRendered = new EventNotification(this);

    function build_brushes_and_viewers() {
      let verticalPaddleSize   = 6,
          horizontalPaddleSize = 1,
          maxPaddleSize = 10;

      /* Get the calculated margin of the family viewer to align the frequency viewer */
      let margin = parseInt(window.getComputedStyle(self._dom.node())["margin-left"]);

      return {
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
        {id: 'leftResidueSummaryViewer',  parent: "residueSummaryView", semantic: "left",  max_items: maxPaddleSize,
          block_size: self.residue_glyph_size, offset: 5, class: "center-align", margin: margin, width: self.width},
        {id: 'rightResidueSummaryViewer',  parent: "residueSummaryView", semantic: "right", max_items: maxPaddleSize,
          block_size: self.residue_glyph_size, offset: 5, class: "center-align",  margin: margin, width: self.width}
      ]
      };
    }

    /* Builds the brush that lies on top of the overview */
    function build_overview_brush(width, height) {
      let count = self._model.getProteinCount(),
          block_size = height / count,
          paddleSize = Math.round(self.ppv * block_size),
          scale = d3.scaleLinear()
              .domain([0, count])
              .range([0, height]);

      /* Return the specs for the new */
      return {
        orientation: App.OVERVIEW_PADDLE,
        width:  width,
        height: height,
        paddleSize : paddleSize,
        scale      : scale,
        class      : "brush horizontal",
        block_size: block_size,
        extent: [[self.width, 0], [self.width + width, height]],
        position: [0, paddleSize],
        proteinsPerView: self.ppv
      }
    }

    /* Renders the image overview onto the canvas */
    self.render_overview = function() {
      /* Create the overview if the image runs off the page*/
      let overview_width = self._dom.node().parentNode.clientWidth * 0.1,
          view = self,
      /* The overview will be 1/10th of the view */
      overview = new Image();
      /* Add the image to the canvas once it is loaded */
      overview.onload = function(){
        self.canvasContext.drawImage(overview, self.width, 0, overview_width, self.height);
        /* Notify the listens that the overview has been rendered */
        self.overviewRendered.notify({brushSpec: build_overview_brush(overview_width, view.height)});
      };
      /* Add the data to the image*/
      overview.src = self._backBufferImage;
    };

    /* Bind the protein family listener */
    self._model.proteinFamilyAdded.attach(function(sender, msg){
      let family = msg.family,
          colorMapping = App.residueMappingUtility.getColor(self._model.getProteinColoring());
      /* Initialize the trend image view*/
      self.initialize(family);
      /* Initialize the back buffer with the family data */
      self.initialize_back_buffer(family.data, colorMapping)
          /* Render the family view */
          .then(self.render.bind(self,self._familyImage,0,0))
          .then(function(){
            /* Notify the controller that the image has been rendered */
            self.imageRendered.notify(build_brushes_and_viewers());
            /* Render the overview if one is needed */
            if (self.overviewImage) {
              self.render_overview();
            }
            /* Enable the coloring menu */
            $("#coloring_list").find("li").removeClass("disabled");
            /* Create the legend */
            App.residueMappingUtility.createColorLegend();
          }).catch(console.log.bind(console));
    });

    self.initialize_back_buffer = function(family, colorMapping) {
      /* Find the width of the div */
      let width = (self.overviewImage) ? parseInt(self.width*1.1) : self.width;
      /* First, clear the canvas*/
      self.backBufferContext.clearRect(0, 0, width,  self._backBufferHeight);
      return new Promise(function(resolve, reject) {
        /* Get the trend image rows from the data model */
        family.forEach(function(sequence,row){
          sequence.forEach(function(residue, col){
            let mostFreq = self._model.getSequenceFrequencyAt(col);
            self.backBufferContext.fillStyle = colorMapping(residue, mostFreq).code;
            self.backBufferContext.fillRect(col*self.residue_glyph_size, row*self.residue_glyph_size,
                self.residue_glyph_size, self.residue_glyph_size);
          });
        });
        /* Get the back buffer data */
        self._backBufferImage = self.backBufferCanvas.toDataURL();
        /* Create the family image */
        self._familyImage = new Image();
        /* Add the image to the canvas once it is loaded */
        self._familyImage.onload = function(){ resolve(this); };
        /* Add the data to the image*/
        self._familyImage.src = self._backBufferImage;
      });
    };

    /* Getter for the x-Axis scale */
    self.getXAxisScale = function() { return self.xScale; };

    /* Getter for the y-Axis scale */
    self.getYAxisScale = function() { return self.yScale; };

    /* Set the dimensions of the data */
    self.set_data_dimensions_sizes = function(family_data) {
      /* Get/store the length of the longest sequence */
      self.x_axis_length = parseInt(_.max(d3.set(family_data.map((residue) => {return residue.length;})).values()));
      /* Get/store the length of the y-axis -- i.e. how many proteins it contains */
      self.y_axis_length =  this._model.getProteinNames().length;
    };

    /* Setter for the chart dimensions */
    self.set_chart_dimensions = function() {
      let container_width = self._parentDom.node().parentNode.clientWidth,
          residue_width = Math.floor(container_width / self.x_axis_length),
          viewer_width = residue_width * self.x_axis_length;

      /*Reset the parent dom width/heights */
      self._parentDom.classed("trend-viewer", false)
               .classed("proteinFamilyViewer", true);
      /* Make sure the height of the data does not exceed the height of the container */
      let protein_height = self.y_axis_length * residue_width,
          new_height = self._parentDom.node().clientHeight,
          proteins_per_view = protein_height / residue_width;


      /* Trend image fits in the DIV's space */
      if(protein_height < new_height) {
        self.height = protein_height;
        self.width = container_width = viewer_width;
      }
      /* We must reset the height of the trend image */
      else if(protein_height > new_height) {
        self.overviewImage = true;
        /* Set the new height/width */
        /* Create a new width that is 90% of the previous, giving us room for the viewer */
        if( (viewer_width + (viewer_width * 0.1)) > container_width ){
          let temp_width = (container_width - (viewer_width * 0.1));
          residue_width = Math.floor(temp_width / self.x_axis_length);
          self.width = residue_width * self.x_axis_length;
        }
        else {
          self.width = viewer_width;
        }
        proteins_per_view = Math.floor(new_height/residue_width);
        self.height = proteins_per_view * residue_width;
      }
      this.set_glyph_size(residue_width);
      this.set_proteins_per_view(proteins_per_view);

      /* Resize the DOM elements*/
      document.getElementById('trendImageViewer').parentNode.style.height = self.height;
      document.getElementById('trendImageViewer').style.height = self.height;
      document.getElementById('trendImageViewer').parentNode.style.width = container_width;
      document.getElementsByClassName('TrendImageView')[0].style.width = container_width;
    };

    /* Setter for the names of the proteins from the family */
    self.set_glyph_size = function(size) {
      /* Get and save the size of each residue for the trend image based on the width of the screen */
      self.residue_glyph_size = (size)?size:Math.round( self.width /self.x_axis_length);
    };

    /* Setter for the number of proteins we can display in a single view */
    self.set_proteins_per_view = function(proteins_per_view) {
      self.ppv = (proteins_per_view)?proteins_per_view:Math.floor(self.height/self.residue_glyph_size);
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
    };

    self.set_brush_SVG = function(dom, width, height) {
      /* Multiple Brushes help: http://bl.ocks.org/jssolichin/54b4995bd68275691a23*/
      return d3Utils.create_brush_svg(dom, {width:width, height:height})
          .append("g")
          .attr("class", "brushes")
          .style("width", width)
          .style("height", height);
    };
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
                view._parentDom.select('#trendSplash').remove();
              });
        });
      }
    },

    initialize: function (family) {
      /* Initialize the chart and data dimensions */
      this.set_data_dimensions_sizes(family.data);
      this.set_chart_dimensions();
      this.set_proteins_per_view();
      this._backBufferHeight = this._model.getProteinCount() * this.residue_glyph_size;

      /* Find the width of the div */
      let width = (this.overviewImage) ? parseInt(this.width*1.1) : this.width;

      /* Set the DOM's width/height so it centers in it's parent */
      this._dom
          .style("width", width)
          .style("height", this.height);

      /* Add the canvas and brush svg to the trend image dom*/
      this.canvasContext = d3Utils.create_chart_canvas(this._dom,
          {width:width, height:this.height, id:"trendCanvas", class:"trendImage"})
          .getContext('2d');

      this.backBufferCanvas = d3Utils.create_chart_back_buffer({width:this.width, height: this._backBufferHeight});
      this.backBufferContext = this.backBufferCanvas.getContext('2d');

      this.set_chart_scales();
      d3Utils.clear_chart_dom(this._dom);

      this.brushSVG = this.set_brush_SVG(this._dom, width, this.height);
    },

    render: function (image, x,y) {
      let view = this;
      // view.canvasContext.clearRect(0, 0, view.width, view.height);
      return new Promise(function (resolve, reject) {
        view.canvasContext.drawImage(image, x, y, view.width, view.height, 0, 0, view.width, view.height);
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

    recolor: function(colorScale, x, y) {
      let view = this;
      view.initialize_back_buffer(view._model.getFamily().data, colorScale)
          .then(function(image){
            view.canvasContext.clearRect(0, 0, view.width, view.height);
            view.render(image,x,y)
                .then(view.render_overview.bind(view));
          });
    },

    attachBrushes: function(brushViews) {
      let view = this;
      /* Attach the brushes to the svg */
      brushViews.forEach(function(brushView){
        let brush = brushView.getBrush(),
            brushObj = view.brushSVG.append("g")
              .attr("class", brushView.brushObj.getBrushClass)
              .call(brush)
              .call(brush.move, brushView.getInitialPosition());
        /*render the brush */
        brushView.render(brushObj);
      });
    },

    getGlyphSize: function() { return this.residue_glyph_size; },

    getXDimensionSize: function() { return this.x_axis_length; },

    getYDimensionSize: function() { return this.y_axis_length; }

};
  return ProteinFamilyView;
})();
