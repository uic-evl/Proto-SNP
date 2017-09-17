"use strict";

// Global Application variable
var App = App || {};

var pvUtils = function (context) {

  let previousHovered = null;
  let self = context;

  return {
    zoomToSelections: function () {
      let allSelections = [];
      self.pvViewer.forEach(function (go) {
        if (go.selection !== undefined) {
          allSelections.push(go.selection());
        }
      });
      self.pvViewer.fitTo(allSelections);
    },

    linkInteractions: function() {
      let view = this;
      /* Inject a function to determine when the view has been moved */
      let redraw = this.pvViewer.__proto__.requestRedraw,
          mouse_down = this.pvViewer._mouseHandler.__proto__._mouseDown,
          mouse_up   = this.pvViewer._mouseHandler.__proto__._mouseUp;
      let zoom = view.pvViewer._cam.__proto__.zoom;

      this.pvViewer.__proto__.requestRedraw = function(){
        if(this._redrawRequested){
          let cam_rotation = this._cam._rotation;
          /* Calculate the x,y,z radians of the rotation*/
          let x = Math.atan2(cam_rotation[9], cam_rotation[10]),
              y = Math.atan2(-cam_rotation[8], Math.sqrt(cam_rotation[9]*cam_rotation[9]
                  + cam_rotation[10]*cam_rotation[10])),
              z = Math.atan2(cam_rotation[4], cam_rotation[0]);
          /* Rotate the cube */
          view.axis3D.setRotation(x,y,z);
          /* Notify the listeners of the change */
          view.modelRotated.notify({rotation: cam_rotation});
        }
        return redraw.apply(this, arguments);
      };

      view.pvViewer._cam.__proto__.zoom = function() {
        view.modelZoomed.notify({zoom: this._zoom});
        return zoom.apply(this, arguments);
      }

      // this.pvViewer._mouseHandler.__proto__._mouseDown = function() {
      //   console.log("down");
      //   return mouse_down.apply(this, arguments);
      // };
      //
      // this.pvViewer._mouseHandler.__proto__._mouseUp = function() {
      //   return mouse_up.apply(this, arguments);
      // };

    },

    setColorForAtom: function (go, atom, color) {
      let view = go.structure().createEmptyView();
      view.addAtom(atom);
      go.colorBy(pv.color.uniform(color), view);
    },

    mouseMoveEvent: function (event) {
      if(event){
        let rect = self.pvViewer.boundingClientRect();
        self.picked = self.pvViewer.pick({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });

        if (previousHovered !== null && self.picked !== null &&
            self.picked.target() === previousHovered.atom) {
          return;
        }
        /* If we're hovering over a molecule */
        if (previousHovered !== null) {
          // reset color of previously hovered atom.
          self.setColorForAtom(previousHovered.node, previousHovered.atom, previousHovered.color);
        }

        if (self.picked !== null) {
          let atom = self.picked.target();
          self.staticLabel.innerHTML = atom.qualifiedName();
          // get RGBA color and store in the color array, so we know what it was
          // before changing it to the highlight color.
          let color = [0, 0, 0, 0];
          self.picked.node().getColorForAtom(atom, color);
          previousHovered = {atom: atom, color: color, node: self.picked.node()};

          self.setColorForAtom(self.picked.node(), atom, 'red');
        }
        else {
          self.staticLabel.innerHTML = '&nbsp;';
          previousHovered = null;
        }
      }
      self.pvViewer.requestRedraw();
    },

    mouseClickEvent: function (picked, ev) {
      self.picked = picked;
      if (self.picked === null || self.picked.target() === null) {
        return;
      }
      // don't to anything if the clicked structure does not have an atom.
      if (self.picked.node().structure === undefined) {
        return;
      }
      // when the shift key is pressed, extend the selection, otherwise
      // only select the clicked atom.
      let extendSelection = ev.shiftKey;
      let sel, rem, residue;
      if (extendSelection) {
        sel = self.picked.node().selection();
      } else {
        sel = self.picked.node().structure().createEmptyView();
      }

      // in case atom was not part of the view, we have to add it, because
      // it wasn't selected before. Otherwise removeAtom took care of it
      // and we don't have to do anything.
      residue = self.picked.target()._residue;
      rem = sel.removeAtom(self.picked.target(), true);
      if (!rem) {
        residue._atoms.forEach(function(atom){
          sel.addAtom(atom);
        });
        /* Notify the controller that a residue has been clicked */
        self.residueSelected.notify({selection : sel, residue: residue, replace:!extendSelection});
      }
      else {
        self.residueDeselected.notify({selection : sel, residue: residue});
      }
    }
  }
};