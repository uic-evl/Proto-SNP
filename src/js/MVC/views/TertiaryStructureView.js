"use strict";

var App = App || {};

const TertiaryStructureView = (function () {

  function colorProteinBy(colorMap) {
    let colorMapping = App.residueMappingUtility.getColor(colorMap, "3D");
    return new pv.color.ColorOp(function (atom, out, index) {
      /* Select the color corresponding to the residue and mapping*/
      let color = colorMapping(atom._residue._name).rgba;

      /*Set the RGBA output color */
      out[index + 0] = color[0] / 255.0;
      out[index + 1] = color[1] / 255.0;
      out[index + 2] = color[2] / 255.0;
      out[index + 3] = color[3] / 255.0;
    })
  }

  /* Render the title of the viewer */
  function updateViewTitle(dom, title) {
    let p = d3.select(dom).select('#proteinName p');
    /* Update the label */
    p.text(_.toUpper(title));
  }

  function selectionChanged(sender, args){
    if(args.selection){
      this.picked.node().setSelection(args.selection);
    }
    else {
      let sel = this.selectResidue(this._model.getGeometry().selection(), args.residue);
      this._model.getGeometry().setSelection(sel);
    }
    this.pvViewer.requestRedraw();
  }

function TertiaryStructureView(model, element) {
  let self = this;

  self._model = model;
  self._id = element.id;
  self._position = element.position;
  self._dom = null;

  self.pvViewer = null;
  self.axis3D = null;
  self.splash = null;
  self.staticLabel = '';

  function helpMenu() {
    hopscotch.startTour(App.tour_3D, 1);
  }

  /* The user has uploaded or downloaded a PDB file */
  self.fileUploaded = new EventNotification(this);
  self.fileUpdated = new EventNotification(this);
  /* The user has selected a new protein */
  self.residueSelected = new EventNotification(this);
  self.residueDeselected = new EventNotification(this);
  /* The user has interacted with the viewer */
  self.colorChanged = new EventNotification(this);
  self.modelRotated = new EventNotification(this);
  self.modelZoomed = new EventNotification(this);
  self.cameraChanged = new EventNotification(this);

  /* Clears the user input on the form */
  self.clear_splash = function() {
    /* Clear the input */
    self.splash.find('#files').empty();
    self.splash.find('#protein-name').val('');
    self.splash.find('#fileUploadInput').val('');
  };

  /* Clears the splash input form and re-initializes the splash*/
  self.clear_and_reinitialize = function() {
    /* Clear the input */
    self.clear_splash();
  };

  /* Reset the splash page to launch on 'folder icon' click */
  self.initialize_file_update = function(dom) {
    /* Display the upload icon by the viewer name */
    dom.select(".settingsOpenPDB").classed("hidden", false);

    /* Setup the splash screen activation */
    $(dom.node()).click(function(){
      /* Hide the current 3D view */
      self._dom.find('#pvDiv')
        .find(".tertiaryViewer, .axisViewer, .static-label").hide();
      self._dom
        .find("#splashOverlay").addClass('open');
      /* Hide the menu */
      self._dom.find('.x_title').hide();
      /* Show the splash screen */
      self.splash.show();
    });

    /* Click outside of the splash screen */
    self._dom.find('#overlayBackground, #overlayClose').click(function () {
      /* Clear the input */
      self.clear_splash();

      /* Hide the overlay */
      self.splash.hide();

      /* Show the menu */
      self._dom.find('.x_title').show();

      /* Show the 3D viewers */
      self._dom.find(".tertiaryViewer, .axisViewer, .static-label").show();
    });

    /* Setup the upload callback for files */
    self.splash.find("#fileUploadInput").fileupload('destroy');
    self.splash.find("#fileUploadInput").unbind( "fileuploadadd" );

    App.fileUtilities.uploadSetup(self.splash.find("#fileUploadInput"), self.splash.find("#files"),
      function (metadata, result) {
        self.clear();
        self.fileUpdated.notify({metaData: metadata, file: result});
        self.clear_splash();
      });
  };

  /*Creates the geometry/coloring selection menu */
  self.initialize_menus = function() {
    /* Load the html menu templates */
    $.get("./src/html/tertiaryViewer/proteinGeometryListTemplate.html", function (data) {
      /* Add the elements to the list */
      self._dom.find("#geometry_list a").after(data);
      let geometryListModel = new FilteringMenuModel({
            items: ['cartoon', 'tube', 'trace', 'sline', 'lines', 'lineTrace', 'spheres', 'points']
          }),
          geometryListView = new FilteringMenuView(geometryListModel, { 'list' : self._dom.find('#geometry_ul') }),
          geometryListController = new FilteringMenuController({
            menu : "geometry",
            models: { list: geometryListModel, connected: [self._model]},
            view: geometryListView,
            cb:
                function(model, element) {
                  self.pvViewer.rm(model.getName());
                  self.render(model.getStructure(), model.getName(), element);
                  self.pvViewer.requestRedraw();
            }
          });

      /* Show the view to bind the model */
      geometryListView.show();
    });

    /* Load the html menu templates */
    $.get("./src/html/tertiaryViewer/proteinColoringListTemplate.html", function (data) {
      /* Add the elements to the list */
      self._dom.find("#protein_coloring_list a").after(data);
      let coloringListModel = new FilteringMenuModel({
            items: ["Side Chain Class", "Side Chain Polarity", "Selections Only"]
          }),
          coloringListView = new FilteringMenuView(coloringListModel, { 'list' : self._dom.find('#protein_coloring_ul') }),
          coloringListController = new FilteringMenuController({
            menu : "coloring",
            models: { list: coloringListModel, connected: [self._model]},
            view: coloringListView,
            cb:
                function(model, element) {
                  self.recolor(element);
                  self.colorChanged.notify({color:element});
                  //App.residueMappingUtility.createColorLegend("3D");
                }
          });
      /* Show the view to bind the model */
      coloringListView.show();
    });

    /* Setup the help menu */
    $("#" + self._id + " #molecularViewerHelp").click(helpMenu);
  };

  /* Attach the listeners */
  self._model.proteinAdded.attach(function (sender, protein) {
    /* Close the splash screen and remove the overlaid button */
    $('#' + self._id).find("#popup-trigger-molecule").remove();
    self.splash.hide();

    /* Initialize and render the view */
    self.initialize(protein.name);
    self.render(protein.structure, protein.name, "tube");

    /* Show the menu */
    self._dom.find('.x_title').show();

    /* center the structure in the view */
    self.pvViewer.centerOn(protein.structure);
    // auto zoom to fit
    self.pvViewer.autoZoom();

    /* Enable the coloring menu */
    $("#coloring_list").find("li").removeClass("disabled");
    /* Create the legend */
    //App.residueMappingUtility.createColorLegend("3D");

    /* Load the tour if this is the first time a molecular viewer is generated */
    let state = hopscotch.getState();
    if (!state || state.indexOf('introduction_tour:') === 0){
      hopscotch.startTour(App.tour_3D);
    }

  });

  self._model.proteinColoringChanged.attach(function(sender, args){
    self.recolor(args.scheme);
    self.pvViewer.requestRedraw();
  });

  /* Update the model once the selection has been added/removed to/from the model */
  self._model.residueSelected.attach(selectionChanged.bind(self));
  self._model.residueDeselected.attach(selectionChanged.bind(self));

  // /* Update the rotation */
  self._model.rotateModel.attach(function(sender, msg){
    self.pvViewer._redrawRequested = false;
    self.pvViewer.setRotation(msg.rotation);
  });

  /* Update the zoom */
  self._model.zoomModel.attach(function(sender, msg){
    if(self.pvViewer._cam._zoom === msg.zoom) return;
    self.pvViewer.setZoom(msg.zoom);
    self.pvViewer._draw();
  });

  /* Update the panning */
  self._model.cameraChanged.attach(function(sender, msg) {
    self.pvViewer._redrawRequested = false;
      // self.pvViewer.setRotation(msg.rotation);
    self.pvViewer.setCamera(msg.rotation, msg.center, msg.zoom);
  });

  /* Mixin the utilities */
  _.mixin(self, new pvUtils(self));
}

TertiaryStructureView.prototype = {
  /* Callback fired when a file is loaded */
  file_loaded: function(metadata, result){
    this.fileUploaded.notify({metaData: metadata, file: result});
    /* Clear the splash and update */
    this.clear_and_reinitialize();
  },

  show: function () {
    /* Save the context's this */
    let view = this;
    /* Set the DOM selector */
    view._dom = $('#' + view._id);
    // /* load the splash screen if there is no model data*/
    if (!view._model.isEmpty()) {
      /* Load the splash template */
      this._dom.find('#splash').load("./src/html/tertiaryViewer/tertiarySplashTemplate.html", function () {
        /* Store a reference to the splash DOM*/
        let splash = $(this),
          splash_trigger = splash.find("#popup-trigger-molecule");
        // Launch the overlay
        splash_trigger.click(function () {
          // hide the select protein button
          splash
            .find("#splashOverlay").addClass('open')
            .find('.signup-form input:first').select();
          splash_trigger.hide();
        });
        // If the user clicks on the overlay or the 'X', close the overlay
        splash.find('#overlayBackground, #overlayClose').click(function () {
          // reshow the button
          splash.find('#splashOverlay').removeClass('open');
          if(splash_trigger[0]){
            splash_trigger.show();
          }
        });
        /* Save the reference to the splash screen for later use */
        view.splash = splash;
        /* Apply the bindings */
        ko.applyBindings(view, splash.find("#splashTemplate")[0]);
        /* Setup the upload callback for files */
        App.fileUtilities.uploadSetup(splash.find("#fileUploadInput"), splash.find("#files"), view.file_loaded.bind(view));
      });
    }
  },

  clear: function() {
    /* Remove all the items */
    this._dom.find('#pvView *:not(#splash*)').remove();
    this._dom.find('.x_title *').remove();
    /* Clear the internal variables */
    this.pvViewer = null;
    this.axis3D = null;
  },

  /* Accept the data from the download form. Called by the upload form */
  downloadPDB: function(formData) {
    let name = (typeof formData === "object")? $(formData).serialize().split('=')[1] : formData;

    if(!this._model.isEmpty()){
      this.fileUploaded.notify({metaData: {protein_name:name}, file: null});
    }
    else {
      this.fileUpdated.notify({metaData: {protein_name:name}, file: null});
    }

    /* Clear the splash and update */
    this.clear_and_reinitialize();
    return false;
  },

  initialize: function (protein_name) {
    /* Store the pvView dom element */
    let $dom = this._dom.find('#pvDiv'),
        dom = $dom[0], self = this;

    /* create a label to display selections */
    this.staticLabel = document.createElement('div');
    this.staticLabel.innerHTML = '&nbsp;';
    this.staticLabel.className = 'static-label';
    /* Add the label to the model */
    dom.appendChild(this.staticLabel);

    /* Set the options for the PV viewer*/
    let options = {
      antialias: true, outline: false,
      quality : 'medium',
      near: 0.1,
      background: "black",
      width : 'auto',
      height : 'auto',
      selectionColor: "#984ea3"
    };
    /* insert the molecularViewer under the DOM element */
    this.pvViewer = pv.Viewer(dom, options);

    this.linkInteractions();

    /* Set the canvas' position to absolute so we can overlay */
    $dom.find('canvas')
        .addClass('tertiaryViewer');

    /* Setup the event callbacks */
    dom.addEventListener('mousemove', this.mouseMoveEvent);
    this.pvViewer.on('click', this.mouseClickEvent);

    /* Create the div for the 3D axis */
    let axisDOM = document.createElement('div'),
        width = parseInt(d3.select(dom).style('width'))/4.0,
        height = parseInt(d3.select(dom).style('height'))/4.0;

    /* Set the axis' attributes */
    axisDOM.className = 'axisViewer';
    axisDOM.style.height = height;
    axisDOM.style.width = width;
    /* Append it to the dom */
    dom.append(axisDOM);

    /* Create the axis box */
    this.axis3D = new AxisView3D({div: axisDOM, width: width, height: height});

    /* Load the geometry list */
    $.get("./src/html/tertiaryViewer/tertiaryMenuTemplate.html", function (data) {
      self._dom.find("div.x_title").append(data);
      self.initialize_menus();
      /* Place the name of the protein above the viewer*/
      updateViewTitle(self._dom[0], protein_name);
      self.initialize_file_update(d3.select(self._dom[0]).select('#proteinName'));
    });
    /* Register the enter key to reset the selections of the view */
    //keyboardUtilities.addKeyboardCallback(13, this.zoomToSelections);
  },

  render: function (structure, proteinName, renderingStyle) {
    /* Display the protein in the specified rendering, coloring by the specified property */
    let geometry = this.pvViewer.renderAs(proteinName, structure, renderingStyle,
        {color: colorProteinBy.call(this, this._model.getProteinColoring())});
    /* Save the geometry to the model */
    this._model.setGeometry(geometry);
  },

  /* Recolor the protein according to the current coloring scheme */
  recolor : function(colorMap){
    let geometry = this._model.getGeometry(),
        viewer   = this.pvViewer;
    /* Check to make sure the view is active*/
    if(geometry){
      /* Recolor */
      geometry.colorBy(colorProteinBy.call(this, colorMap));
      /* Redraw */
      viewer.requestRedraw();
    }
  },

  resize : function() {
    if(this._model.isEmpty()) {
      /* Update the canvas width/height */
      this.pvViewer.fitParent();
    }
    else {
      /* Update the splash screen */
      this.clear();
    }
  }
};

return TertiaryStructureView;
})();