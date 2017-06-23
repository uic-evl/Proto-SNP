"use strict";

var App = App || {};

const TertiaryStructureView = (function () {

  function colorProteinBy(colorMap) {
    let colorMapping = App.residueMappingUtility.getColor(colorMap);
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
    let p = d3.select(dom).select('#proteinName');
    /* Update the label */
    p.html(_.toUpper(title));
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

  /* The user has uploaded or downloaded a PDB file */
  self.fileUploaded = new EventNotification(this);
  self.fileUpdated = new EventNotification(this);
  self.residueSelected = new EventNotification(this);

  /* Clears the user input on the form */
  self.clear_splash = function() {
    /* Clear the input */
    self.splash.find('#files').empty();
    self.splash.find('#protein-name').val('');
    self.splash.find('#fileUploadInput').val('');
  };

  self.initialize_file_update = function(dom) {
    /* Display the upload icon by the viewer name */
    dom
      .classed('hidden', false)
      .select("#proteinName").classed("hidden", false);

    /* Setup the splash screen activation */
    $(dom.node()).click(function(){
      /* Hide the current 3D view */
      self._dom.find('#pvDiv')
        .find(".tertiaryViewer, .axisViewer, .static-label").hide();
      self._dom
        .find("#splashOverlay").addClass('open');
      /* Show the splash screen */
      self.splash.show();
    });

    /* Click outside of the splash screen */
    self._dom.find('#overlayBackground, #overlayClose').click(function () {
      /* Clear the input */
      self.clear_splash();

      /* Hide the overlay */
      self.splash.hide();

      /* Show the 3D viewers */
      self._dom.find(".tertiaryViewer, .axisViewer, .static-label").show();
    });

    /* Setup the upload callback for files */
    self.splash.find("#fileUploadInput").fileupload('destroy');
    App.fileUtilities.uploadSetup(self.splash.find("#fileUploadInput"), self.splash.find("#files"),
      function (metadata, result) {
        view.fileUpdated.notify({metaData: metadata, file: result});
        view.clear_splash();
      });
  };

  /* Attach the listeners */
  self._model.proteinAdded.attach(function (sender, protein) {
    /* Close the splash screen and remove the overlaid button */
    $('#' + self._id).find("#popup-trigger-molecule").remove();
    self.splash.hide();

    /* Initialize and render the view */
    self.initialize();
    self.render(protein.structure, protein.name);

    /* Enable the coloring menu */
    $("#coloring_list").find("li").removeClass("disabled");
    /* Create the legend */
    App.residueMappingUtility.createColorLegend();
  });

  /* Update the model once the selection has been added to the model */
  self._model.residueSelected.attach(function(sender, selection){
    self.picked.node().setSelection(selection);
    self.pvViewer.requestRedraw();
  });

  /* Update the coloring of the view */
  self._model.proteinColoringChanged.attach(function(sender, msg){
    self.recolor(msg.scheme);
  });

  /* Mixin the utilities */
  _.mixin(self, new pvUtils(self));
}

TertiaryStructureView.prototype = {

  show: function () {
    let view = this;
    view._dom = $('#' + view._id);

    // /* load the splash screen if there is no model data*/
    if (!view._model.isEmpty()) {
      /* Load the splash template */
      this._dom.find('#splash').load("./src/html/tertiarySplashTemplate.html", function () {
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
        App.fileUtilities.uploadSetup(splash.find("#fileUploadInput"), splash.find("#files"),
          function (metadata, result) {
            view.fileUploaded.notify({metaData: metadata, file: result});
            view.initialize_file_update(d3.select(view._dom[0]).select('i.settingsOpenPDB'));
            /* Clear the input */
            view.clear_splash();
          });
      });
    }
  },

  clear: function() {
    /* Remove all the items */
    this._dom.find('*').remove();
    /* Clear the internal variables */
    this.pvViewer = null;
    this.axis3D = null;
  },

  /* Accept the data from the download form. Called by the upload form */
  downloadPDB: function(formData) {
    this.fileUploaded.notify({metaData: {protein_name:$(formData).serialize().split('=')[1]}, file: null});

    /* Clear the input */
    this.clear_splash();

    /* initialize the upload button */
    if (!this._model.isEmpty()) {
      this.initialize_file_update(d3.select(this._dom[0]).select('i.settingsOpenPDB'));
    }
    return false;
  },

  initialize: function () {
    /* Store the pvView dom element */
    let $dom = this._dom.find('#pvDiv'),
        dom = $dom[0];

    /* create a label to display selections */
    this.staticLabel = document.createElement('div');
    this.staticLabel.innerHTML = '&nbsp;';
    this.staticLabel.className = 'static-label';
    /* Add the label to the model */
    dom.appendChild(this.staticLabel);

    /* Set the options for the PV viewer*/
    let options = {
      antialias: true,
      quality : 'medium',
      background: 'black',
      width : parseInt(d3.select(dom).style('width')),
      height : parseInt(d3.select(dom).style('height'))
    };

    /* insert the molecularViewer under the DOM element */
    this.pvViewer = pv.Viewer(dom, options);

    /* Set the canvas' position to absolute so we can overlay */
    $dom.find('canvas')
        .addClass('tertiaryViewer');

    /* Setup the event callbacks */
    dom.addEventListener('mousemove', this.mouseMoveEvent);
    this.pvViewer.on('click', this.mouseClickEvent);

    /* Create the div for the 3D axis */
    let axisDOM = document.createElement('div'),
        width = options.width/4.0,
        height = options.height/4.0;
    axisDOM.className = 'axisViewer';
    axisDOM.style.height = height;
    axisDOM.style.width = width;
    dom.append(axisDOM);

    this.axis3D = new AxisView3D({div: axisDOM, width: width, height: height})

    /* Register the enter key to reset the selections of the view */
    //keyboardUtilities.addKeyboardCallback(13, this.zoomToSelections);
  },

  render: function (structure, proteinName, renderingStyle) {
    /* Place the name of the protein above the viewer*/
    updateViewTitle(this._dom[0], proteinName);
    let geom = null;

    /* Display the protein in the specified rendering, coloring by the specified property */
    switch(renderingStyle){
      case "cartoon":
      default:
        geom = this.pvViewer.cartoon(proteinName, structure,
            {color: colorProteinBy.call(this, this._model.getProteinColoring())});
        break;
    }
    /* Save the geometry to the model */
    this._model.setGeometry(geom);

    /* center the structure in the view */
    this.pvViewer.centerOn(structure);
    // auto zoom to fit
    this.pvViewer.autoZoom();
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
  }
};

return TertiaryStructureView;
})();