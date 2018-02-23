"use strict";

var App = App || {};

const ProteinFamilyView = (function() {

  let PADDLE_SIZE = 6,
      MAX_PADDLE_SIZE = 10;

  function ProteinFamilyView(model, element) {
    let self = this;

    self.initialized_promise = $.Deferred();

    self._model = model;
    self._id = element.id;

    self.overviewImage = false;
    self._overview_percentage = 0.1;

    self._proteinCount = 0;
    self._sequenceLength = 0;

    /* WebGL Variables */
    self.glProgramInfo = null;
    self.gl = null;
    self.glBufferInfo = null;

    /* Set according to the glyph size */
    self.x_offset = 0;
    self.y_offset = 0;

    self._parentDom = d3.select("#"+self._id);
    self._container_width = d3.select('div.TrendImageView').node().clientWidth;

    self.spinnerDiv = null;
    /* The user has uploaded or downloaded an alignment file */
    self.fileUploaded  = new EventNotification(this);
    self.fileUpdated   = new EventNotification(this);
    self.imageRendered = new EventNotification(this);
    self.overviewRendered = new EventNotification(this);

    function build_brushes_and_viewers() {
      let verticalPaddleSize   = PADDLE_SIZE,
          horizontalPaddleSize = 1,
          maxPaddleSize = MAX_PADDLE_SIZE;

      /* Get the calculated margin of the family viewer to align the frequency viewer */
      // let margin = parseInt(window.getComputedStyle(self._dom.node())["margin-left"]);

      return {
        brushes : [
          {
            orientation: App.HORIZONTAL_PADDLE, paddleSize: horizontalPaddleSize, class:"brush horizontal main",
            extent: [[0, self.y_offset], [self.width, self.height+self.y_offset]], block_size: self.residue_glyph_size,
            position: [self.y_offset, self.residue_glyph_size+self.y_offset], semantic: "horizontal",
            tooltip: function(d) { return self._model.getSelectedProtein().name; }
          },
          {
            orientation: App.VERTICAL_PADDLE, paddleSize: verticalPaddleSize, maxPaddleSize: maxPaddleSize,
            class:"brush vertical-left", extent: [[0, self.y_offset], [self.width, self.height+self.y_offset]],
            block_size: self.residue_glyph_size, semantic: "left",
            position: [0, self.residue_glyph_size * verticalPaddleSize + self.y_offset]
          },
          {
            orientation: App.VERTICAL_PADDLE, paddleSize: verticalPaddleSize, maxPaddleSize: maxPaddleSize,
            class:"brush vertical-right", extent: [[0, self.y_offset], [self.width, self.height+self.y_offset]],
            block_size: self.residue_glyph_size, semantic: "right",
            position: [self.width - self.residue_glyph_size * verticalPaddleSize, self.width]
          }
        ],
        // frequencyViewers : [
        //   {id: 'leftResidueSummaryViewer',  parent: "residueSummaryView", semantic: "left",  max_items: maxPaddleSize,
        //     block_size: self.residue_glyph_size, offset: self.y_offset, class: "center-align", margin: margin, width: self.width,
        //     overview: self.overviewImage, offset_x:10},
        //   {id: 'rightResidueSummaryViewer',  parent: "residueSummaryView", semantic: "right", max_items: maxPaddleSize,
        //     block_size: self.residue_glyph_size, offset: self.y_offset, class: "center-align",  margin: margin, width: self.width,
        //     overview: self.overviewImage, offset_x:10
        //   }
        // ]
      };
    }

    /* Builds the brush that lies on top of the overview */
    function build_overview_brush(width, height) {
      /* Get the calculated margin of the family viewer to align the frequency viewer */
      let //margin = parseInt(window.getComputedStyle(self._dom.node())["margin-right"]),
          count = self._model.getProteinCount(),
          block_size = height / count,
          scale = d3.scaleLinear()
              .domain([0, count])
              .range([self.y_offset, height+self.y_offset]);
      self.brushPaddleSize = Math.floor(self.ppv * block_size);
      /* Return the specs for the new */
      return {
        orientation: App.OVERVIEW_PADDLE,
        width:  width,
        height: height,
        paddleSize : self.brushPaddleSize,
        maxPaddleSize : self.brushPaddleSize,
        scale      : scale,
        class      : "brush horizontal overview",
        block_size: block_size,
        semantic: "family",
        extent: [[self.x_offset, self.y_offset], [ self.overview_width + self.x_offset, height + self.y_offset]],
        position: [self.y_offset, self.brushPaddleSize+self.y_offset],
        proteinsPerView: self.ppv,
        parent: d3.select(self.brushSVG.node().parentNode)
      }
    }

    /* Renders the image overview onto the canvas */
    self.render_overview = function(x,y) {
      return new Promise(function(resolve, reject){
        /* Create the overview if the image runs off the page*/
        let overview = new Image();
        /* Add the image to the canvas once it is loaded */
        overview.onload = function(){
          self.overview_context.drawImage(overview, x+self.x_offset, y+self.y_offset, self.overview_width, self.height);
          resolve();
        };
        /* Add the data to the image*/
        overview.src = self._backBufferImage;
      });
    };

    self.initialize_back_buffer = function(family, colorMapping) {
      return new Promise(function(resolve, reject) {
        let residue_data = [];
        /* Get the trend image rows from the data model */
        family.forEach(function(sequence,row){
          sequence.forEach(function(residue, col){
            let mostFreq = self._model.getSequenceFrequencyAt(col),
                color = colorMapping(residue, mostFreq).rgba;
            residue_data.push(color[0], color[1], color[2], color[3])
          });
        });

        /* Format the pixels into an unsigned array and create the texture */
        let pixels = new Uint8Array(residue_data),
            texture = self.gl.createTexture();
        /* Bind the texture and flip the pixels */
        self.gl.bindTexture(self.gl.TEXTURE_2D, texture);
        // Flip the image's Y axis to match the WebGL texture coordinate space.
        self.gl.pixelStorei(self.gl.UNPACK_FLIP_Y_WEBGL, true);
        /* Set the texture parameters */
        self.gl.texParameteri(self.gl.TEXTURE_2D, self.gl.TEXTURE_WRAP_S, self.gl.CLAMP_TO_EDGE);
        self.gl.texParameteri(self.gl.TEXTURE_2D, self.gl.TEXTURE_WRAP_T, self.gl.CLAMP_TO_EDGE);
        self.gl.texParameteri(self.gl.TEXTURE_2D, self.gl.TEXTURE_MIN_FILTER, self.gl.NEAREST);

        /* Create the data texture */
        self.gl.texImage2D(
            self.gl.TEXTURE_2D, // target
            0, // mip level
            self.gl.RGBA, // internal format
            self._sequenceLength, self._proteinCount, // width and height
            0, // border
            self.gl.RGBA, //format
            self.gl.UNSIGNED_BYTE, // type
            pixels // texture data
        );

        /* Set the uniforms */
        let uniforms = { u_texture: texture };
        // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
        twgl.setUniforms(self.glProgramInfo, uniforms);
        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(self.gl, self.gl.TRIANGLES, self.glBufferInfo);

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

    self.set_chart_attributes = function(div, width, height){
      /* Set the width/height attributes of the canvas for webGL*/
      d3.select(div)
          .attr("width", width)
          .attr("height", height);
    };

    /* Setter for the chart dimensions */
    self.set_chart_dimensions = function() {

      let container_width = self._container_width,
          residue_width = Math.floor(container_width / self.x_axis_length),
          viewer_width = residue_width * self.x_axis_length;

      /* Make sure the height of the data does not exceed the height of the container */
      let protein_height = self.y_axis_length * residue_width,
          new_height = self._parentDom.node().clientHeight,
          proteins_per_view = protein_height / residue_width;

      /* The test to see if we need an overview */
      if(protein_height > new_height) {

        $.get("./src/html/familyViewerWithOverviewTemplate.html", function(data){
          $("#"+self._id).append(data);

          self.overviewImage = true;

          self._dom = d3.select("#trendImageColumn");
          self._$dom = $("#trendImageColumn");
          self.width = self._dom.node().clientWidth;
          new_height = self._dom.node().clientHeight;

          residue_width = Math.floor(self.width / self.x_axis_length);
          proteins_per_view = Math.floor(new_height / residue_width);
          self.height = proteins_per_view * residue_width;


          /* Set the overview canvas width and height */
          self.overview_panel_width = Math.floor(d3.select("#overviewCanvas").node().parentNode.clientWidth);
          self.overview_width = Math.floor(self.overview_panel_width/2.0);

          /* Set the canvases' width and height */
          self.set_chart_attributes("#trendCanvas", self.width, self.height);
          self.set_chart_attributes("#overviewCanvas", self.overview_panel_width, self.height);
          self.set_chart_attributes("#trendSVG", self.width, self.height);
          self.set_chart_attributes("#overviewSVG", self.overview_panel_width, self.height);

          /* Store the size variables for rendering */
          self.set_glyph_size(residue_width);
          self.set_proteins_per_view(proteins_per_view);
          self.set_offsets();
          self.set_chart_scales();

          /* Setup webGL */
          self.setup_screen_context();
          self.initialize_overview_canvas();

          /* Setup the brush SVG */
          self.brushSVG = self.set_brush_SVG("#trendSVG", self.width, self.height);
          self.overviewSVG = self.set_brush_SVG("#overviewSVG", self.overview_width, self.height);
        });
      }

      else {
        $.get("./src/html/familyViewerTemplate.html", function(data) {
          $("#" + self._id).append(data);

          self.width = viewer_width;
          self.height = protein_height;

          self.set_chart_attributes("#trendCanvas", self.width, self.height);
          self.set_chart_attributes("#trendSVG", self.width, self.height);

          /* Store the size variables for rendering */
          self.set_glyph_size(residue_width);
          self.set_proteins_per_view(proteins_per_view);
          self.set_chart_scales();

          /* Setup webGL */
          self.setup_screen_context();

          /* Setup the brush SVG */
          self.brushSVG = self.set_brush_SVG("#trendSVG", self.width, self.height);
        });
      }

    };

    /* Setter for the names of the proteins from the family */
    self.set_glyph_size = function(size) {
      /* Get and save the size of each residue for the trend image based on the width of the screen */
      self.residue_glyph_size = (size)?size:Math.floor( self.width /self.x_axis_length);
    };

    /* Setter size of the offsets */
    self.set_offsets = function() {
      self.x_offset = Math.floor((self.overview_panel_width - self.overview_width) / 2.0);
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
      return d3.select(dom)
          .append("g")
          .attr("class", "brushes")
          .attr("width", width)
          .attr("height", height)
          .attr("x", 0)
          .attr("y", 0);
    };

    self.initialize_file_open = function(dom) {
      /* Display the upload icon by the viewer name */
      dom.classed('hidden', false);

      /* Set the file upload size */
      let input = d3.select("#fileupload-open").node(),
          parent = input.parentNode;

      /* Setup the upload callback for files */
      App.fileUtilities.familyUploadSetup(input,
          function (data, extension) {
            self.fileUpdated.notify({data: data, type: extension});
           })
        .done(function(){
          input.style.width = parent.clientWidth;
          input.style.height = parent.clientHeight;
          input.style['z-index'] = 11;
        });
    };

    self.setup_backbuffer_context = function() {
      /* Set the back buffer dimension */
      /* Create the back buffer to render the image */
      self.backBufferCanvas = d3Utils.create_chart_back_buffer({
        width:self._sequenceLength,
        height:self._proteinCount});

      /* create the webgl object */
      self.gl = self.backBufferCanvas.getContext('webgl');
      // compiles and links the shaders and looks up uniform and attribute locations
      self.glProgramInfo = twgl.createProgramInfo(self.gl, ['vs', 'fs']);
      let arrays =
          {
            position: [
              -1, -1, 0, 1, -1, 0, -1, 1, 0,
              -1, 1, 0, 1, -1, 0, 1, 1, 0,
            ]
          };
      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
      self.glBufferInfo = twgl.createBufferInfoFromArrays(self.gl, arrays);
      /* Initialize the program */
      self.gl.useProgram(self.glProgramInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(self.gl, self.glProgramInfo, self.glBufferInfo);
    };

    self.initialize_overview_canvas = function() {

      self.overview_context = d3.select("#overviewCanvas").node().getContext('2d');

      /* Set context properties to disable image "smoothing" */
      self.overview_context.imageSmoothingQuality = "high";
      self.overview_context.webkitImageSmoothingEnabled = false;
      self.overview_context.mozImageSmoothingEnabled = false;
      self.overview_context.imageSmoothingEnabled = false;
    };

    self.setup_screen_context = function() {
      /* Add the canvas and brush svg to the trend image dom*/
      self.canvasContext = d3.select("#trendCanvas").node()
      // d3Utils.create_chart_canvas(self._dom,
      // {width: Math.ceil(width + self.x_offset)+1, height:self.height+ 2.0*self.y_offset,
      //   id:"trendCanvas", class:"trendImage"})
          .getContext('2d');

      /* Set context properties to disable image "smoothing" */
      self.canvasContext.imageSmoothingQuality = "high";
      self.canvasContext.webkitImageSmoothingEnabled = false;
      self.canvasContext.mozImageSmoothingEnabled = false;
      self.canvasContext.imageSmoothingEnabled = false;
    };

    /*Creates the geometry selection menu */
    self.initialize_menus = function() {
      /* Load the html menu templates */
      $.get("./src/html/familySortingListTemplate.html", function (data) {

        /* Add the elements to the list */
        $(self._parentDom.node()).find("#family_sorting_list a").after(data);

        let sortingModel = new FilteringMenuModel({
            items: ['Set Protein ...', 'Initial Ordering','Residue Frequency', 'Weighted Edit Distance',
              'Residue Commonality with', 'Normalized Residue Commonality with']
          }),
          sortingListView = new FilteringMenuView(sortingModel, { 'list' : $(self._parentDom.node()).find("#family_sorting_ul") }),
          sortingController = new FilteringMenuController({
            menu : "sorting",
            models: { list: sortingModel, connected: [self._model]},
            view: sortingListView,
            cb:
              function(model, element) {
                if(element === "set_protein"){
                  model.setSortingProtein();
                }
                else {
                  model.setProteinSorting(element);
                }
              },
          });

        /* Show the view to bind the model */
        sortingListView.show();
      });

      /* Load the html menu templates */
      $.get("./src/html/familyColoringListTemplate.html", function (data) {
        /* Add the elements to the list */
        $(self._parentDom.node()).find("#family_coloring_list a").after(data);
        let colorModel = new FilteringMenuModel({
            items:['Side Chain Class', 'Side Chain Polarity', 'Frequency (Family Viewer)']
          }),
          colorView = new FilteringMenuView(colorModel, { 'list' : $(self._parentDom.node()).find('#family_coloring_ul') }),
          colorController = new FilteringMenuController({
            menu : "coloring",
            models: { list: colorModel, connected : [self._model]},
            view: colorView,
            cb:
              function(model, element) {
                model.setProteinColoring(element);
                //App.residueMappingUtility.createColorLegend("family");
              }
          });
        /* Show the view to bind the model */
        colorView.show();
      });

      /* Setup the help menu */
      // $("#" + self._id + " #molecularViewerHelp").click(helpMenu);
    };

    self.setup_menu = function() {
      /* Load the geometry list */
      $.get("./src/html/familyMenuTemplate.html", function (data) {
        $(self._parentDom.node()).find("div.x_title").append(data);
        /* Setup the submenu */
        self.initialize_menus();
      });
    };

    /* Bind the protein family listener */
    self._model.proteinFamilyAdded.attach(function(sender, msg){
      let family = msg.family,
          colorMapping = App.residueMappingUtility.getColor(self._model.getProteinColoring(), "family");
      /* Initialize the trend image view*/
      //let width =
          self.initialize(msg);

      /* Load the tour if this is the first time a trend image is generated */
      let state = hopscotch.getState();
      if (!state ||  state.indexOf('introduction_tour:') === 0){
        hopscotch.startTour(App.tour_family);
      }
      /* Initialize the back buffer with the family data */
      self.initialize_back_buffer(family.data, colorMapping)
      /* Render the family view */
          .then(self.render.bind(self,self._familyImage,0,0))
          .then(function(){
            /* Done initializing */
            self.initialized_promise.resolve();
            /* Notify the controller that the image has been rendered */
            self.imageRendered.notify(build_brushes_and_viewers());
            /* Render the overview if one is needed */
            if (self.overviewImage) {
              self.render_overview(0,0)
                  .then(function(){
                    // /* Notify the listens that the overview has been rendered and render the brush  */
                    self.overviewRendered.notify({brushSpec: build_overview_brush(self.overview_width, self.height)});
                    // /* Render the context line to show to what the brush relates */
                    //
                    // let contextPoints = [
                    //   [ {x:self.width+self.x_offset/2.0, y:0},{x:self.width+self.x_offset/2.0, y:self.height+self.y_offset*2.0}],
                    //   [ {x:self.width+self.x_offset/2.0-1, y: 1}, { x: self.width, y:1} ],
                    //   [ {x:self.width+self.x_offset/2.0-1, y: self.height+self.y_offset*2.0-1},{ x: self.width, y:self.height+self.y_offset*2.0-1} ],
                    // ];
                    // d3Utils.render_context_lines(d3.select(self.brushSVG.node().parentNode), contextPoints);
                    // d3Utils.render_context_bars(d3.select(self.brushSVG.node().parentNode),
                    //     {x:self.width+self.x_offset/4.0, y: self.brushPaddleSize/2.0, height: 1, width:self.x_offset/2.0});
                  });
            }
            /* Enable the coloring menu */
            $("#coloring_list").find("li").removeClass("disabled");
            /* Create the legend */
            //App.residueMappingUtility.createColorLegend("family");
          }).catch(console.log.bind(console));
    });
  }

  ProteinFamilyView.prototype = {

    file_loaded: function (data, extension) {
        /* Remove the splash screen */
        this._parentDom.select('#trendSplash').remove();
        /* Update the model */
        this.fileUploaded.notify({data: data, type: extension});
        /* enable the upload button*/
        return this.initialize_file_open(d3.select('#family_upload_li'));
      },

    show: function () {
      let view = this;
      /* load the splash screen if there is no model data*/
      if (!view._model.isEmpty()) {
        $('#trendSplash').load("./src/html/familySplashTemplate.html", function () {
          let splash = $(this);
          /* Setup the upload callback for files */
          App.fileUtilities.familyUploadSetup(splash.find("#fileupload-family"), view.file_loaded.bind(view))
        });
      }
    },

    /* Clear the view */
    clear: function() {
      /* Remove all elements related to the trend image */
      this._parentDom.selectAll("*").remove();
      // this._dom.find('.x_title *').remove();

      /*Reset the parent dom width/heights */
      this._parentDom.classed("trend-viewer", true)
          .classed("proteinFamilyViewer", false);

      /* Remove the previous stylings */
      this._parentDom.node().removeAttribute("style");
      this._parentDom.node().parentNode.removeAttribute("style");
      document.getElementsByClassName('TrendImageView')[0].removeAttribute("style");

      /* Reset the overview flag */
      this.overviewImage = false;
      /* Destroy the context menu */
      $.contextMenu( 'destroy' );
    },

    initialize: function (data) {

      let family = data.family;
      this._proteinCount = data.proteinCount;
      this._sequenceLength = data.sequenceLength;

      /* Initialize the chart and data dimensions */
      this.set_data_dimensions_sizes(family.data);
      this.set_chart_dimensions();
      this.set_proteins_per_view();

      this.setup_backbuffer_context();

      /* Clear the canvas*/
      //d3Utils.clear_chart_dom(this._dom);

      /* Setup the menu */
      console.log("initialize");
      this.setup_menu();

      /* Remove the black background */
      this._parentDom.classed("trend-viewer", false);
    },

    render: function (image, x,y) {
      let view = this;
      return new Promise(function (resolve, reject) {
        view.canvasContext.drawImage(image, x, y/view.residue_glyph_size,
            view._model.getSequenceCount(), view.ppv,
            0, view.y_offset,
            view.width, view.height);
        resolve();
      });
    },

    reorder: function (options) {
      let view = this;
      view.initialize_back_buffer(options.family.data, options.color)
          .then(function(image){
            view.canvasContext.clearRect(0, view.y_offset, view.width, view.height);
            view.render(image,options.x,options.y)
                .then(view.render_overview.bind(view, 0, 0))
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

    attachBrushes: function(brushViews, svg) {
      let view = this;

      /* Attach the brushes to the svg */
      brushViews.forEach(function(brushView){
        let brush = brushView.getBrush(),
            brushObj = svg.append("g")
                .attr("class", brushView.brushObj.getBrushClass)
                .call(brush)
                .call(brush.move, brushView.getInitialPosition());
        /*render the brush */
        brushView.render(brushObj);
      });

      /* Render the left brush to initialize the correct overlays */
      if(brushViews.length > 1){
        brushViews[1].redraw(App.VERTICAL_PADDLE, {semantic:brushViews[1]._semantic});
      }

    },

    getPromise: function() { return this.initialized_promise.promise(); },

    getGlyphSize: function() { return this.residue_glyph_size; },

    getWidth: function() { return this.width; },

    getXOffset: function() { return this.x_offset; },

    getXDimensionSize: function() { return this.x_axis_length; },

    getYDimensionSize: function() { return this.y_axis_length; }
  };
  return ProteinFamilyView;
})();
