"use strict";

var App = App || {};

const ProteinFamilyView = (function() {

  let PADDLE_SIZE = 6,
      MAX_PADDLE_SIZE = 10;

  function ProteinFamilyView(model, element) {
    let self = this;

    self._model = model;
    self._id = element.id;
    self.overviewImage = false;

    /* Set according to the glyph size */
    self.x_offset = 0;
    self.y_offset = 0;

    self._parentDom = d3.select("#"+self._id);
    self._dom = self._parentDom.append("div")
        .classed("trendDiv", true)
        .classed("center-aligned", true);

    /* The user has uploaded or downloaded an alignment file */
    self.fileUploaded = new EventNotification(this);
    self.imageRendered = new EventNotification(this);
    self.overviewRendered = new EventNotification(this);

    function build_brushes_and_viewers() {
      let verticalPaddleSize   = PADDLE_SIZE,
          horizontalPaddleSize = 1,
          maxPaddleSize = MAX_PADDLE_SIZE;

      /* Get the calculated margin of the family viewer to align the frequency viewer */
      let margin = parseInt(window.getComputedStyle(self._dom.node())["margin-left"]);

      return {
        brushes : [
          {
            orientation: App.HORIZONTAL_PADDLE, paddleSize: horizontalPaddleSize, class:"brush horizontal",
            extent: [[0, self.y_offset], [self.width, self.height+self.y_offset]], block_size: self.residue_glyph_size,
            position: [self.y_offset, self.residue_glyph_size+self.y_offset]
          }, {
            orientation: App.VERTICAL_PADDLE, paddleSize: verticalPaddleSize, maxPaddleSize: maxPaddleSize,
            class:"brush vertical-left", extent: [[0, self.y_offset], [self.width, self.height+self.y_offset]],
            block_size: self.residue_glyph_size, semantic: "left",
            position: [0, self.residue_glyph_size * verticalPaddleSize + self.y_offset]
          }, {
            orientation: App.VERTICAL_PADDLE, paddleSize: verticalPaddleSize, maxPaddleSize: maxPaddleSize,
            class:"brush vertical-right", extent: [[0, self.y_offset], [self.width, self.height+self.y_offset]],
            block_size: self.residue_glyph_size, semantic: "right",
            position: [self.width - self.residue_glyph_size * verticalPaddleSize, self.width]}
        ],
            frequencyViewers : [
        {id: 'leftResidueSummaryViewer',  parent: "residueSummaryView", semantic: "left",  max_items: maxPaddleSize,
          block_size: self.residue_glyph_size, offset: self.y_offset, class: "center-align", margin: margin, width: self.width,
          overview: self.overviewImage},
        {id: 'rightResidueSummaryViewer',  parent: "residueSummaryView", semantic: "right", max_items: maxPaddleSize,
          block_size: self.residue_glyph_size, offset: self.y_offset, class: "center-align",  margin: margin, width: self.width,
          overview: self.overviewImage
        }
      ]
      };
    }

    /* Builds the brush that lies on top of the overview */
    function build_overview_brush(width, height) {
      let count = self._model.getProteinCount(),
          block_size = height / count,
          scale = d3.scaleLinear()
              .domain([0, count])
              .range([self.y_offset, height+self.y_offset]);
      self.brushPaddleSize = Math.round(self.ppv * block_size);
      /* Return the specs for the new */
      return {
        orientation: App.OVERVIEW_PADDLE,
        width:  width,
        height: height,
        paddleSize : self.brushPaddleSize,
        scale      : scale,
        class      : "brush horizontal",
        block_size: block_size,
        extent: [[self.width+self.x_offset, self.y_offset], [self.width+width, height+self.y_offset]],
        position: [self.y_offset, self.brushPaddleSize],
        proteinsPerView: self.ppv,
        parent: d3.select(self.brushSVG.node().parentNode)
      }
    }

    /* Renders the image overview onto the canvas */
    self.render_overview = function() {
      return new Promise(function(resolve, reject){
        /* Create the overview if the image runs off the page*/
        let overview_width = self._dom.node().parentNode.clientWidth * 0.1,
            /* The overview will be 1/10th of the view */
            overview = new Image();
        /* Add the image to the canvas once it is loaded */
        overview.onload = function(){
          self.canvasContext.drawImage(overview, self.width+self.x_offset, self.y_offset, overview_width, self.height);
          resolve();
        };
        /* Add the data to the image*/
        overview.src = self._backBufferImage;
      });
    };

    /* Bind the protein family listener */
    self._model.proteinFamilyAdded.attach(function(sender, msg){
      let family = msg.family,
          colorMapping = App.residueMappingUtility.getColor(self._model.getProteinColoring()),
      /* Initialize the trend image view*/
      width = self.initialize(family);
      /* Initialize the back buffer with the family data */
      self.initialize_back_buffer(family.data, colorMapping)
          /* Render the family view */
          .then(self.render.bind(self,self._familyImage,0,0))
          .then(function(){
            /* Notify the controller that the image has been rendered */
            self.imageRendered.notify(build_brushes_and_viewers());
            /* Render the overview if one is needed */
            if (self.overviewImage) {
              self.render_overview()
                  .then(function(){
                    /* Notify the listens that the overview has been rendered and render the brush  */
                    self.overviewRendered.notify({brushSpec: build_overview_brush(width, self.height)});
                    /* Render the context line to show to what the brush relates */
                    let contextPoints = [
                      [ {x:self.width+self.x_offset/2.0, y:0},{x:self.width+self.x_offset/2.0, y:self.height+self.y_offset*2.0}],
                      [ {x:self.width+self.x_offset/2.0-1, y: 1}, { x: self.width, y:1} ],
                      [ {x:self.width+self.x_offset/2.0-1, y: self.height+self.y_offset*2.0-1},{ x: self.width, y:self.height+self.y_offset*2.0-1} ],
                      ];
                    d3Utils.render_context_lines(d3.select(self.brushSVG.node().parentNode), contextPoints);
                    d3Utils.render_context_bars(d3.select(self.brushSVG.node().parentNode),
                        {x:self.width+self.x_offset/4.0, y: self.brushPaddleSize/2.0, height: 1, width:self.x_offset/2.0});
                  });
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
      self.backBufferContext.clearRect(0, 0, width, self._backBufferHeight);
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

      /* Remove the template class so that the div fits to our new sizes */
      self._parentDom.classed("proteinFamilyViewer", false);
      /* Resize the DOM elements to accommodate our family view*/
      document.getElementById('trendImageViewer').parentNode.style.height = self.height+self.y_offset;
      document.getElementById('trendImageViewer').style.height = self.height+self.y_offset;
      document.getElementById('trendImageViewer').parentNode.style.width = container_width;
      document.getElementsByClassName('TrendImageView')[0].style.width = container_width;
    };

    /* Setter for the names of the proteins from the family */
    self.set_glyph_size = function(size) {
      /* Get and save the size of each residue for the trend image based on the width of the screen */
      self.residue_glyph_size = (size)?size:Math.round( self.width /self.x_axis_length);
      self.set_offsets(self.residue_glyph_size);
    };

    /* Setter size of the offsets */
    self.set_offsets = function(size) {
      self.x_offset = size * PADDLE_SIZE;
      self.y_offset = size * 2.0;
    };

    /* Setter for the number of proteins we can display in a single view */
    self.set_proteins_per_view = function(proteins_per_view) {
      self.ppv = (proteins_per_view)?proteins_per_view:Math.floor(self.height/self.residue_glyph_size);
    };

    self.set_y_scale = function(values) {
      /* construct the y-scale */
      self.yScale = d3.scaleBand()
          .domain(values)
          .range([self.y_offset, self.ppv * self.residue_glyph_size+self.y_offset]);
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
      return d3Utils.create_brush_svg(dom, {width:width, height:height, y: self.y_offset})
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
      let width = ((this.overviewImage) ? parseInt(this.width*1.1): this.width);

      /* Set the DOM's width/height so it centers in it's parent */
      this._dom
          .style("width", width+this.x_offset)
          .style("height", this.height + 2.0*this.y_offset);

      /* Add the canvas and brush svg to the trend image dom*/
      this.canvasContext = d3Utils.create_chart_canvas(this._dom,
          {width:width, height:this.height+ 2.0*this.y_offset, id:"trendCanvas", class:"trendImage"})
          .getContext('2d');

      this.backBufferCanvas = d3Utils.create_chart_back_buffer({width:this.width, height:this._backBufferHeight});
      this.backBufferContext = this.backBufferCanvas.getContext('2d');

      this.set_chart_scales();
      d3Utils.clear_chart_dom(this._dom);
      this.brushSVG = this.set_brush_SVG(this._dom, width, this.height+2.0*this.y_offset);
      /* let the caller know the width */
      return width;
    },

    render: function (image, x,y) {
      let view = this;
      return new Promise(function (resolve, reject) {
        view.canvasContext.drawImage(image, x, y, view.width, view.height, 0, view.y_offset, view.width, view.height);
        resolve();
      });
    },

    reorder: function (options) {
      let view = this;
      view.initialize_back_buffer(options.family.data, options.color)
          .then(function(image){
            view.canvasContext.clearRect(0, view.y_offset, view.width, view.height);
            view.render(image,options.x,options.y)
                .then(view.render_overview.bind(view))
                .then(function(){
                  /* Set the y scale with the protein updated name order */
                  view.set_y_scale(_.slice(view._model.getProteinNames(), 0, view.ppv))
                });
          });
    },

    recolor: function(options) {
      let view = this;
      view.initialize_back_buffer(view._model.getFamily().data, options.color)
          .then(function(image){
            view.canvasContext.clearRect(0, view.y_offset, view.width, view.height);
            view.render(image,options.x,options.y)
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

    getWidth: function() { return this.width; },

    getXOffset: function() { return this.x_offset; },

    getXDimensionSize: function() { return this.x_axis_length; },

    getYDimensionSize: function() { return this.y_axis_length; }

};
  return ProteinFamilyView;
})();
