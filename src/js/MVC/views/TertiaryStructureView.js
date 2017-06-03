"use strict";

var App = App || {};

const TertiaryStructureView = (function () {

function TertiaryStructureView(model, element) {

  let self = this;

  self._model = model;
  self._id = element.id;
  self._position = element.position;
  self._dom = null;

  self.pvViewer = null;
  self.residueMappingUtility = new ResidueMappingUtility();

  /* The user has uploaded or downloaded a PDB file */
  this.fileUploaded = new EventNotification(this);
  this.residueSelected = new EventNotification(this);

  /* Attach the listeners */
  this._model.proteinAdded.attach(function (sender, protein) {
    /* Close the splash screen */
    $('#' + self._id)
      .find('#splash').remove();

    self.initialize();
    self.render(protein.structure, protein.name)
  });

  /* Update the model once the selection has been added to the model */
  self._model.residueSelected.attach(function(sender, selection){
    self.picked.node().setSelection(selection);
    self.pvViewer.requestRedraw();
  });

  /* Mixin the utilities */
  _.mixin(self, new pvUtils(self));
}

TertiaryStructureView.prototype = {

  show: function () {

    let view = this;
    view._dom = $('#' + view._id);

    /* load the splash screen if there is no model data*/
    if (!view._model.isEmpty()) {
      /* Load the splash template */
      this._dom.find('#splash').load("./src/html/tertiarySplashTemplate.html", function () {

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
          splash_trigger.show();
        });

        /* Setup the upload callback for files */
        App.fileUtilities.uploadSetup(splash.find("#fileUploadInput"),
          function (metadata, result) {
            view.fileUploaded.notify({metaData: metadata, file: result});
          });

        ko.applyBindings(view, splash.find("#splashTemplate")[0]);

      });
    }
  },

  /* Accept the data from the download form  */
  downloadPDB: function(formData) {
    this.fileUploaded.notify({metaData: {protein_name:$(formData).serialize().split('=')[1]}, file: null});
    return false;
  },

  initialize: function () {

    let dom = this._dom.find('#pvDiv')[0];

    /* Remove the black background*/
    d3.select(this._dom[0]).classed("black-background", false);

    /* create a label to display selections */
    this.staticLabel = document.createElement('div');
    this.staticLabel.innerHTML = '&nbsp;';
    this.staticLabel.className = 'static-label';
    /* Add the label to the model */
    dom.appendChild(this.staticLabel);

    /* set the options for the PV viewer*/
    let options = {
      antialias: true,
      quality : 'medium',
      background: 'black',
      width : parseInt(d3.select(dom).style('width')),
      height : parseInt(d3.select(dom).style('height'))
    };

    /* insert the molecularViewer under the DOM element */
    this.pvViewer = pv.Viewer(dom, options);

    /* Setup the event callbacks */
    dom.addEventListener('mousemove', this.mouseMoveEvent);
    this.pvViewer.on('click', this.mouseClickEvent);

    /* Register the enter key to reset the selections of the view */
    keyboardUtilities.addKeyboardCallback(13, this.zoomToSelections);
  },

  /* Render the title of the viewer */
  updateViewTitle: function (dom, title) {
    d3.select(dom).select('p.view')
      .html(_.toUpper(title));
  },

  colorProteinBy: function () {
    let colorMapping = this.residueMappingUtility.getColor("side chain");
    return new pv.color.ColorOp(function (atom, out, index) {
      /* Select the color corresponding to the residue and mapping*/
      let color = colorMapping(atom._residue._name).rgba;

      /*Set the RGBA output color */
      out[index + 0] = color[0] / 255.0;
      out[index + 1] = color[1] / 255.0;
      out[index + 2] = color[2] / 255.0;
      out[index + 3] = color[3] / 255.0;
    })
  },

  render: function (structure, proteinName) {

    /* Place the name of the protein above the viewer*/
    this.updateViewTitle(this._dom[0], proteinName);

    /* Display the protein in the specified rendering, coloring by the specified property */
    // switch(App.renderingStyle){
    //   case "cartoon":
    this.geom = this.pvViewer.cartoon(proteinName, structure, {color: this.colorProteinBy()});
    //     break;
    // }

    /* center the structure in the view */
    // center in molecularViewer
    this.pvViewer.centerOn(structure);
    // auto zoom to fit
    this.pvViewer.autoZoom();
  },

  /* Recolor the protein according to the current coloring scheme */
  recolor : function(){

    let geometry = this.geom(),
        viewer   = this.pvViewer;

    /* Check to make sure the view is active*/
    if(geometry){
      /* Recolor */
      geometry.colorBy(this.colorProteinBy());
      /* Redraw */
      viewer.requestRedraw();
    }
  }
};

return TertiaryStructureView;
})();