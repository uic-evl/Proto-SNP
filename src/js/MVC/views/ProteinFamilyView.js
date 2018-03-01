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

    self._parentDom = d3.select("#" + self._id);
    self._container_width = d3.select('div.TrendImageView').node().clientWidth;

    self.spinnerDiv = null;
    /* The user has uploaded or downloaded an alignment file */
    self.fileUploaded = new EventNotification(this);
    self.fileUpdated = new EventNotification(this);
    self.imageRendered = new EventNotification(this);
    self.overviewRendered = new EventNotification(this);

    /* Bind the protein family listener */
    self._model.proteinFamilyAdded.attach(function (sender, msg) {
      let family = msg.family,
          colorMapping = App.residueMappingUtility.getColor(self._model.getProteinColoring(), "family");

      /* Initialize the trend image view*/
      self.initialize(msg);

      /* Initialize the back buffer with the family data */
      initialize_back_buffer(family.data, colorMapping)
      /* Render the family view */
          .then(self.render.bind(self, self._familyImage, 0, 0))
          .then(function () {
            /* Done initializing */
            // self.initialized_promise.resolve();
            /* Notify the controller that the image has been rendered */
            self.imageRendered.notify(build_brushes_and_viewers());
            /* Render the overview if one is needed */
            if (self.overviewImage) {
              self.render_overview(0, 0)
                  .then(function () {
                    // /* Notify the listens that the overview has been rendered and render the brush  */
                    self.overviewRendered.notify({brushSpec: build_overview_brush(self.overview_width, self.height)});
                    /* Render the context line to show to what the brush relates */
                    let contextPoints = [
                      [ {x:self.x_offset/2.0, y:0},{x:self.x_offset/2.0, y:self.height+self.y_offset*2.0}]
                    ];
                    d3Utils.render_context_lines(d3.select(self.overviewSVG.node().parentNode), contextPoints);
                    d3Utils.render_context_bars(d3.select(self.overviewSVG.node().parentNode),
                        {x:self.x_offset/4.0, y: self.brushPaddleSize/2.0, height: 1, width:self.x_offset/2.0});
                  });
            }
            /* Enable the coloring menu */
            $("#coloring_list").find("li").removeClass("disabled");
            /* Create the legend */
            //App.residueMappingUtility.createColorLegend("family");
          }).catch(console.log.bind(console));
    });

    function initialize_back_buffer(family, colorMapping) {
      return new Promise(function (resolve, reject) {
        let residue_data = [];
        /* Get the trend image rows from the data model */
        family.forEach(function (sequence, row) {
          sequence.forEach(function (residue, col) {
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
        let uniforms = {u_texture: texture};
        // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
        twgl.setUniforms(self.glProgramInfo, uniforms);
        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(self.gl, self.gl.TRIANGLES, self.glBufferInfo);

        /* Get the back buffer data */
        self._backBufferImage = self.backBufferCanvas.toDataURL();
        /* Create the family image */
        self._familyImage = new Image();
        /* Add the image to the canvas once it is loaded */
        self._familyImage.onload = function() { resolve(this); }
        ;
        /* Add the data to the image*/
        self._familyImage.src = self._backBufferImage;
      });
    }

    function initialize_file_open(dom) {
      /* Display the upload icon by the viewer name */
      dom.classed('hidden', false);

      /* Set the file upload size */
      let input = dom.node(),
          parent = input.parentNode;

      /* Setup the upload callback for files */
      App.fileUtilities.familyUploadSetup(d3.select("#fileupload-open-family").node(),
          function (data, extension, file_name) {
            self.fileUpdated.notify({data: data, type: extension, name: file_name});
          })
          .done(function () {
            input.style.width = parent.clientWidth;
            input.style.height = parent.clientHeight;
            input.style['z-index'] = 11;
          });
    }

    function setup_backbuffer_context() {
      /* Set the back buffer dimension */
      /* Create the back buffer to render the image */
      self.backBufferCanvas = d3Utils.create_chart_back_buffer({
        width: self._sequenceLength,
        height: self._proteinCount
      });

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
    }

    function initialize_overview_canvas() {
      self.overview_context = d3.select("#overviewCanvas").node().getContext('2d');
      /* Set context properties to disable image "smoothing" */
      self.overview_context.imageSmoothingQuality = "high";
      self.overview_context.webkitImageSmoothingEnabled = false;
      self.overview_context.mozImageSmoothingEnabled = false;
      self.overview_context.imageSmoothingEnabled = false;
    }

    function initialize_screen_context() {
      /* Add the canvas and brush svg to the trend image dom*/
      self.canvasContext = d3.select("#trendCanvas").node().getContext('2d');
      /* Set context properties to disable image "smoothing" */
      self.canvasContext.imageSmoothingQuality = "high";
      self.canvasContext.webkitImageSmoothingEnabled = false;
      self.canvasContext.mozImageSmoothingEnabled = false;
      self.canvasContext.imageSmoothingEnabled = false;
    }

    /*Creates the geometry selection menu */
    function initialize_menus() {
      /* Load the html menu templates */
      $.get("./src/html/familyViewer/familySortingListTemplate.html", function (data) {

        /* Add the elements to the list */
        $(self._parentDom.node()).find("#family_sorting_list a").after(data);

        let sortingModel = new FilteringMenuModel({
              items: ['Set Protein ...', 'Initial Ordering', 'Residue Frequency', 'Weighted Edit Distance',
                'Residue Commonality with', 'Normalized Residue Commonality with']
            }),
            sortingListView = new FilteringMenuView(sortingModel, {'list': $(self._parentDom.node()).find("#family_sorting_ul")}),
            sortingController = new FilteringMenuController({
              menu: "sorting",
              models: {list: sortingModel, connected: [self._model]},
              view: sortingListView,
              cb:
                  function (model, element) {
                    if (element === "set_protein") {
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
      $.get("./src/html/familyViewer/familyColoringListTemplate.html", function (data) {
        /* Add the elements to the list */
        $(self._parentDom.node()).find("#family_coloring_list a").after(data);
        let colorModel = new FilteringMenuModel({
              items: ['Side Chain Class', 'Side Chain Polarity', 'Frequency (Family Viewer)']
            }),
            colorView = new FilteringMenuView(colorModel, {'list': $(self._parentDom.node()).find('#family_coloring_ul')}),
            colorController = new FilteringMenuController({
              menu: "coloring",
              models: {list: colorModel, connected: [self._model]},
              view: colorView,
              cb:
                  function (model, element) {
                    model.setProteinColoring(element);
                    //App.residueMappingUtility.createColorLegend("family");
                  }
            });
        /* Show the view to bind the model */
        colorView.show();
      });

      /* Setup the help menu */
      // $("#" + self._id + " #molecularViewerHelp").click(helpMenu);
    }

    /* Render the title of the viewer */
    function updateViewTitle(dom, title) {
      let i = d3.select(dom).select('#familyFolder');
      /* Update the title tooltip  */
      i.attr("title", title);
    }

    function build_brushes_and_viewers() {

      let fv_parent = d3.select("div.residueSummaryView"),
          parent_height = parseInt(fv_parent.node().clientHeight),
          fv_height = (self.overviewImage) ? parent_height * 0.75 : parent_height,
          fv_width = self.width/2.0,
          bar_height = parseInt(fv_height * 0.3),
          bar_width = bar_height * 2.0,
          handles = "";

        let horizontalPaddleSize = 1,
            verticalPaddleSize = (bar_width * PADDLE_SIZE < fv_width) ? PADDLE_SIZE : 4,
            maxPaddleSize = (bar_width * MAX_PADDLE_SIZE < fv_width) ? MAX_PADDLE_SIZE : parseInt(fv_width/bar_width) - 1;

        /* if the brush min/max is the same size, remove the handles */
        if(maxPaddleSize === verticalPaddleSize) {
          handles = "no_handles";
        }

      return {
        brushes: [
          {
            orientation: App.HORIZONTAL_PADDLE,
            paddleSize: horizontalPaddleSize,
            class: "brush horizontal main no_handles",
            extent: [[0, self.y_offset], [self.width, self.height + self.y_offset]],
            helpText: "Use this paddle to select a protein in the alignment for observation.",
            helpPosition: "top",
            block_size: self.residue_glyph_size,
            position: [self.y_offset, self.residue_glyph_size + self.y_offset],
            semantic: "horizontal",
            tooltip: () => { return self._model.getSelectedProtein().name; }
          },
          {
            orientation: App.VERTICAL_PADDLE, paddleSize: verticalPaddleSize, maxPaddleSize: maxPaddleSize,
            class: "brush vertical-left " + handles, extent: [[0, self.y_offset], [self.width, self.height + self.y_offset]],
            helpText: "Use this paddle to select a subset of residues for closer observation in the frequency bars, below.",
            helpPosition: "right",
            block_size: self.residue_glyph_size, semantic: "left",
            position: [0, self.residue_glyph_size * verticalPaddleSize + self.y_offset]
          },
          {
            orientation: App.VERTICAL_PADDLE, paddleSize: verticalPaddleSize, maxPaddleSize: maxPaddleSize,
            class: "brush vertical-right " + handles, extent: [[0, self.y_offset], [self.width, self.height + self.y_offset]],
            block_size: self.residue_glyph_size, semantic: "right",
            helpText: "Use this paddle to select a subset of residues for closer observation in the frequency bars, below.",
            helpPosition: "left",
            position: [self.width - self.residue_glyph_size * verticalPaddleSize, self.width]
          }
        ],
        frequencyViewers : [
          {id: 'leftResidueSummaryViewer',  parent: fv_parent, semantic: "left",  max_items: maxPaddleSize,
            block_size: self.residue_glyph_size, offset: self.y_offset, class: "center-align", margin: 0, width: self.width,
            height: fv_height, bar_height: bar_height, bar_width:bar_width, overview: self.overviewImage, offset_x:0
          },
          {id: 'rightResidueSummaryViewer',  parent: fv_parent, semantic: "right", max_items: maxPaddleSize,
            block_size: self.residue_glyph_size, offset: self.y_offset, class: "center-align",  margin: 0, width: self.width,
            height: fv_height, bar_height: bar_height, bar_width:bar_width, overview: self.overviewImage, offset_x:0
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
              .range([self.y_offset, height + self.y_offset]);
      self.brushPaddleSize = Math.floor(self.ppv * block_size);
      /* Return the specs for the new */
      return {
        orientation: App.OVERVIEW_PADDLE,
        width: width,
        height: height,
        paddleSize: self.brushPaddleSize,
        maxPaddleSize: self.brushPaddleSize,
        scale: scale,
        class: "brush horizontal overview no_handles",
        block_size: block_size,
        helpText: "This paddle appears when the align is too large to render on one screen. Use this paddle to control " +
        "which part of the alignment is displayed. ",
        helpPosition: "top",
        semantic: "family",
        extent: [[self.x_offset, self.y_offset], [self.overview_width + self.x_offset, height + self.y_offset]],
        position: [self.y_offset, self.brushPaddleSize + self.y_offset],
        proteinsPerView: self.ppv,
        parent: d3.select(self.overviewSVG.node().parentNode)
      }
    }

    /* Set the dimensions of the data */
    function set_data_dimensions_sizes(family_data) {
      /* Get/store the length of the longest sequence */
      self.x_axis_length = parseInt(_.max(d3.set(family_data.map((residue) => {
        return residue.length;
      })).values()));
      /* Get/store the length of the y-axis -- i.e. how many proteins it contains */
      self.y_axis_length = self._model.getProteinNames().length;
    }

    /* Setter for the chart dimensions */
    function set_chart_dimensions() {

      let container_width = self._container_width,
          residue_width = Math.floor(container_width / self.x_axis_length),
          viewer_width = residue_width * self.x_axis_length,
          initialized_promise = $.Deferred();

          /* Make sure the height of the data does not exceed the height of the container */
      let protein_height = self.y_axis_length * residue_width,
          new_height = self._parentDom.node().clientHeight,
          proteins_per_view = protein_height / residue_width;

      /* The test to see if we need an overview */
      if (protein_height > new_height) {

        $.get("./src/html/familyViewer/familyViewerWithOverviewTemplate.html", function (data) {
          $("#" + self._id).append(data);

          self._dom = d3.select("#trendImageColumn");
          self._$dom = $("#trendImageColumn");

          self.overviewImage = true;

          self.width = self._dom.node().clientWidth;
          new_height = self._dom.node().clientHeight;

          residue_width = self.width / self.x_axis_length;
          proteins_per_view = Math.floor(new_height / residue_width);
          self.height = Math.floor(proteins_per_view * residue_width);

          /* Set the overview canvas width and height */
          self.overview_panel_width = Math.floor(d3.select("#overviewCanvas").node().parentNode.clientWidth);
          self.overview_width = Math.floor(self.overview_panel_width / 2.0);

          /* Set the canvases' width and height */
          d3Utils.set_chart_size("#trendCanvas", self.width, self.height);
          d3Utils.set_chart_size("#overviewCanvas", self.overview_panel_width, self.height);
          d3Utils.set_chart_size("#trendSVG", self.width, self.height);
          d3Utils.set_chart_size("#overviewSVG", self.overview_panel_width, self.height);

          /* Store the size variables for rendering */
          set_glyph_size(residue_width);
          set_proteins_per_view(proteins_per_view);
          set_offsets();
          set_chart_scales();

          /* Setup webGL */
          initialize_screen_context();
          initialize_overview_canvas();

          /* Setup the brush SVG */
          self.brushSVG    = set_brush_SVG("#trendSVG", self.width, self.height);
          self.overviewSVG = set_brush_SVG("#overviewSVG", self.overview_width, self.height);

          initialized_promise.resolve();
        });
      }
      else {
        $.get("./src/html/familyViewer/familyViewerTemplate.html", function (data) {
          $("#" + self._id).append(data);

          self._dom = d3.select("#trendImageColumn");
          self._$dom = $("#trendImageColumn");

          self.width = self._dom.node().clientWidth;
          self.height = protein_height;

          /* Remove reset the trend columns height*/
          self._dom.style("height", self.height);

          d3Utils.set_chart_size("#trendCanvas", self.width, self.height);
          d3Utils.set_chart_size("#trendSVG", self.width, self.height);

          /* Store the size variables for rendering */
          set_glyph_size(residue_width);
          set_proteins_per_view(proteins_per_view);
          set_chart_scales();

          /* Setup webGL */
          initialize_screen_context();

          /* Setup the brush SVG */
          self.brushSVG = set_brush_SVG("#trendSVG", self.width, self.height);

          initialized_promise.resolve();
        });
      }
      return initialized_promise;
    }

    /* Setter for the names of the proteins from the family */
    function set_glyph_size(size) {
      /* Get and save the size of each residue for the trend image based on the width of the screen */
      self.residue_glyph_size = (size) ? size : Math.floor(self.width / self.x_axis_length);
    }

    /* Setter size of the offsets */
    function set_offsets() {
      self.x_offset = Math.floor((self.overview_panel_width - self.overview_width) / 2.0);
    }

    /* Setter for the number of proteins we can display in a single view */
    function set_proteins_per_view(proteins_per_view) {
      self.ppv = (proteins_per_view) ? proteins_per_view : Math.floor(self.height / self.residue_glyph_size);
    }

    function set_y_scale(values) {
      /* construct the y-scale */
      self.yScale = d3.scaleBand()
          .domain(values)
          .range([self.y_offset, self.ppv * self.residue_glyph_size + self.y_offset]);
    }

    /* Setter for the trend image scales */
    function set_chart_scales() {
      /* construct the x-scale */
      self.xScale = d3.scaleLinear()
          .domain([0, self.x_axis_length])
          .range([0, Math.ceil((self.width) / self.residue_glyph_size) * self.residue_glyph_size]);
      /* Set the y scale with the protein names*/
      set_y_scale(_.slice(self._model.getProteinNames(), 0, self.ppv))
    }

    function set_brush_SVG(dom, width, height) {
      /* Multiple Brushes help: http://bl.ocks.org/jssolichin/54b4995bd68275691a23*/
      return d3.select(dom)
          .append("g")
          .attr("class", "brushes")
          .attr("width", width)
          .attr("height", height)
          .attr("x", 0)
          .attr("y", 0);
    }

    function load_menu_template(alignment_name) {
      let initialized_promise = $.Deferred();
      /* Load the geometry list */
      $.get("./src/html/familyViewer/familyMenuTemplate.html", function (data) {
        $(self._parentDom.node()).find("div.x_title").append(data);
        /* Setup the submenu */
        initialize_menus();
        updateViewTitle(self._parentDom.node(), alignment_name);
        /* enable the upload button*/
        initialize_file_open(d3.select('.settingsOpenFamily'));

        initialized_promise.resolve();
      });
      return initialized_promise;
    }

    self.file_loaded = function (data, extension, name) {
      /* Remove the splash screen */
      this._parentDom.select('#trendSplash').remove();
      /* Update the model */
      this.fileUploaded.notify({data: data, type: extension, name: name});
    };

    self.show = function () {
      let view = this;
      /* load the splash screen if there is no model data*/
      if (!view._model.isEmpty()) {
        $('#trendSplash').load("./src/html/familyViewer/familySplashTemplate.html", function () {
          let splash = $(this);
          /* Setup the upload callback for files */
          App.fileUtilities.familyUploadSetup(splash.find("#fileupload-family"), view.file_loaded.bind(view))
        });
      }
    };

    /* Clear the view */
    self.clear = function () {
      /* Remove all elements related to the trend image */
      this._parentDom.selectAll("*").remove();
      /* Reset the trendColumn's height to 35% */
      this._dom.style('height', "35%");

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
      $.contextMenu('destroy');
    };

    self.initialize = function (data) {

      let family = data.family;
      this._proteinCount = data.proteinCount;
      this._sequenceLength = data.sequenceLength;

      /* Initialize the chart and data dimensions */
      set_data_dimensions_sizes(family.data);
      set_chart_dimensions();

      setup_backbuffer_context();

      /* Setup the menu */
      load_menu_template(this._model.getFileName());

      /* Remove the black background */
      this._parentDom.classed("trend-viewer", false);
    };

    /* Renders the image overview onto the canvas */
    self.render_overview = function (x, y) {
      let view = this;
      return new Promise(function (resolve, reject) {
        /* Create the overview if the image runs off the page*/
        let overview = new Image();
        /* Add the image to the canvas once it is loaded */
        overview.onload = function () {
          view.overview_context.drawImage(overview, x + view.x_offset, y + view.y_offset, view.overview_width, view.height);
          resolve();
        };
        /* Add the data to the image*/
        overview.src = view._backBufferImage;
      });
    };

    self.render = function (image, x, y) {
      let view = this;
      return new Promise(function (resolve, reject) {
        view.canvasContext.drawImage(image, x, y / view.residue_glyph_size,
            view._model.getSequenceCount(), view.ppv,
            0, view.y_offset,
            view.width, view.height);
        resolve();
      });
    };

    self.reorder = function (options) {
      let view = this;
      initialize_back_buffer(options.family.data, options.color)
          .then(function (image) {
            view.canvasContext.clearRect(0, view.y_offset, view.width, view.height);
            view.render(image, options.x, options.y)
                .then(view.render_overview.bind(view,0,0))
                .then(function () {
                  /* Set the y scale with the protein updated name order */
                  set_y_scale(_.slice(view._model.getProteinNames(), 0, view.ppv))
                });
          });
    };

    self.recolor = function (options) {
      let view = this;
      initialize_back_buffer(view._model.getFamily().data, options.color)
          .then(function (image) {
            view.canvasContext.clearRect(0, view.y_offset, view.width, view.height);
            view.overview_context.clearRect(0,  0, view.overview_panel_width, view.height);
            view.render(image, options.x, options.y)
                .then(view.render_overview.bind(view,0,0));
          });
    };

    self.resize = function () {
      /* reset the width of the container */
      self._parentDom = d3.select("#" + self._id);
      self._parentDom.classed("trend-viewer", false);
      self._container_width = d3.select('div.TrendImageView').node().clientWidth;

      /* Initialize the chart and data dimensions */
      set_chart_dimensions()
          .then(load_menu_template.bind(self, self._model.getFileName()))
          .then(self.render.bind(self, self._familyImage, 0, 0))
          .then(function () {
            /* Notify the controller that the image has been rendered */
            self.imageRendered.notify(build_brushes_and_viewers());
            /* Render the overview if one is needed */
            if (self.overviewImage) {
              self.render_overview(0, 0)
                  .then(function () {
                    // /* Notify the listens that the overview has been rendered and render the brush  */
                    self.overviewRendered.notify({brushSpec: build_overview_brush(self.overview_width, self.height)});
                    /* Render the context line to show to what the brush relates */
                    let contextPoints = [
                      [{x: self.x_offset / 2.0, y: 0}, {x: self.x_offset / 2.0, y: self.height + self.y_offset * 2.0}]
                    ];
                    d3Utils.render_context_lines(d3.select(self.overviewSVG.node().parentNode), contextPoints);
                    d3Utils.render_context_bars(d3.select(self.overviewSVG.node().parentNode),
                        {x: self.x_offset / 4.0, y: self.brushPaddleSize / 2.0, height: 1, width: self.x_offset / 2.0});
                  });
            }
      });
    };

    self.attachBrushes = function (brushViews, svg) {
      /* Attach the brushes to the svg */
      brushViews.forEach(function (brushView) {
        let brush = brushView.getBrush(),
            brushObj = svg.append("g")
                .attr("class", brushView.brushObj.getBrushClass)
                .call(brush)
                .call(brush.move, brushView.getInitialPosition());
        /*render the brush */
        brushView.render(brushObj);
      });

      /* Render the left brush to initialize the correct overlays */
      if (brushViews.length > 1) {
        brushViews[1].redraw(App.VERTICAL_PADDLE, {semantic: brushViews[1]._semantic});
        brushViews[0].redraw(App.HORIZONTAL_PADDLE, {semantic: brushViews[0]._semantic});
      }

    };

    /* Getter for the x-Axis scale */
    self.getXAxisScale = function() {
      return self.xScale;
    };

    /* Getter for the y-Axis scale */
    self.getYAxisScale = function() {
      return self.yScale;
    };

    self.getGlyphSize = function () {
      return this.residue_glyph_size;
    };

    self.getWidth = function () {
      return this.width;
    };

    self.getXOffset = function () {
      return this.x_offset;
    };

    self.getXDimensionSize = function () {
      return this.x_axis_length;
    };

    self.getYDimensionSize = function () {
      return this.y_axis_length;
    };

    return self;
  }
  return ProteinFamilyView;
})();
