// Global Application variable
var App = App || {};

/*** KO Class ***/
function Proteins() {

  // self reference
  var self = this;

  // array to hold the proteins
  self.proteins = {};

  // Left and Right Protein selectors
  self.leftProtien = ko.observable();
  self.rightProtien = ko.observable();

  /* Listen for input from the use on the left protein selection */
  self.leftProtien.subscribe(function(protein) {


  });

  /* Listen for input from the use on the left protein selection */
  self.rightProtien.subscribe(function(protein) {


  });

}

// /*** IFE to load the data and apply the KO bindings ***/
// (function(){
//
//   d3.json("data/rankings.json", function(error, json) {
//     if (error) return console.warn(error);
//
//     App.data = json;
//     ko.applyBindings(new Patients());
//
//   });
//
// })();