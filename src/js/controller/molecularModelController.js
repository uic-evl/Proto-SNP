"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
const MolecularModelController = function(options) {

  /* Class private variable */
  let self = {
    prevPicked : null
  };

  let viewer   = options.viewer;
  let parent   = options.parent;

  let label   = options.label;

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
    } else {
      label.innerHTML = '&nbsp;';
      self.prevPicked = null;
    }
    viewer.requestRedraw();
  }

  /* Initialize the events attached to the 3D viewer */
  function initialize() {

    parent.addEventListener('mousemove', mouseMoveEvent);

  }

  initialize();

};