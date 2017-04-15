"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
const MolecularModelController = function(options) {

  /* Class private variable */
  let self = {
    prevPicked   : null
  };

  let viewer   = options.viewer;
  let dom      = options.dom;
  let label    = options.label;

  function zoomToSelections () {

    let allSelections = [];
    viewer.forEach(function(go) {
      if (go.selection !== undefined) {
        allSelections.push(go.selection());
      }
    });
    viewer.fitTo(allSelections);
  }

  function setColorForAtom(go, atom, color) {
    let view = go.structure().createEmptyView();
    view.addAtom(atom);
    go.colorBy(pv.color.uniform(color), view);
  }

  function mouseMoveEvent(event){

    let rect = viewer.boundingClientRect();
    let picked = viewer.pick({ x : event.clientX - rect.left,
      y : event.clientY - rect.top });

    if (self.prevPicked !== null && picked !== null &&
        picked.target() === self.prevPicked.atom) {
      return;
    }
    /* If we're hovering over a molecule */
    if (self.prevPicked !== null) {
      // reset color of previously picked atom.
      setColorForAtom(self.prevPicked.node, self.prevPicked.atom, self.prevPicked.color);
    }

    if (picked !== null) {

      let atom = picked.target();
      label.innerHTML = atom.qualifiedName();
      // get RGBA color and store in the color array, so we know what it was
      // before changing it to the highlight color.
      let color = [0,0,0,0];
      picked.node().getColorForAtom(atom, color);
      self.prevPicked = { atom : atom, color : color, node : picked.node() };

      setColorForAtom(picked.node(), atom, 'red');
    }

    else {
      label.innerHTML = '&nbsp;';
      self.prevPicked = null;
    }
    viewer.requestRedraw();
  }

  function mouseClickEvent(picked, ev){
    if (picked === null || picked.target() === null) {
      return;
    }
    // don't to anything if the clicked structure does not have an atom.
    if (picked.node().structure === undefined) {
      return;
    }
    // when the shift key is pressed, extend the selection, otherwise
    // only select the clicked atom.
    let extendSelection = ev.shiftKey;
    let sel;
    if (extendSelection) {
      sel = picked.node().selection();
    } else {
      sel = picked.node().structure().createEmptyView();
    }
    // in case atom was not part of the view, we have to add it, because
    // it wasn't selected before. Otherwise removeAtom took care of it
    // and we don't have to do anything.
    if (!sel.removeAtom(picked.target(), true)) {
      sel.addAtom(picked.target());
    }
    picked.node().setSelection(sel);
    viewer.requestRedraw();
  }

  /* Initialize the events attached to the 3D viewer */
  function initialize() {
    dom.addEventListener('mousemove', mouseMoveEvent);
    viewer.on('click', mouseClickEvent);

    /* Register the enter key to reset the selections of the view */
    App.ApplicationCallbackListener.addKeyboardCallback(13, zoomToSelections);

  }

  initialize();

};