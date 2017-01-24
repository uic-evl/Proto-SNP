"use strict";

// Global Application variable
var App = App || {};

function ResidueModel() {

  /*List of all the amino acid codes*/
  let aminoAcidCodes = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P",
    "Q", "R", "S", "T", "U", "V", "W", "Y", "Z", ".", "~", "X"
  ];

  let colorCodes = [
    "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69","#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5","#ffed6f","#1f78b4",
    "#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f", "#ff7f00", "#cab2d6","#6a3d9a", "#ffff99", "#b15928", "#85929e", "#7B241C", "#000000", "#000000", "#FFFFFF"
  ];


  return {
    getResidueCodes : function() { return aminoAcidCodes; },
    getColor   : function(residue) { return colorCodes[aminoAcidCodes.indexOf(residue)] }
  }

}