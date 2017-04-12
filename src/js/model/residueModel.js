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
    "#C0D0FF", "#B0FFB0", "#FFC0C8", "#FFFF80", "#FFC0FF", "#B0F0F0", "#FFD070","#F08080", "#F5DEB3", "#00BFFF", "#CD5C5C","#66CDAA",
    "#9ACD32","#EE82EE","#00CED1","#00FF7F","#3CB371", "#00008B", "#BDB76B","#006400", "#800000", "#808000", "#800080", "#B8860B", "#B22222", "#000000", "#008080"
  ];

  let colorCodesHEAT = [
    "#90A0CF", "#80CF98", "#CF90B0", "#CFCF70", "#CF90CF", "#80C0C0", "#CFA060","#C05070", "#C5AE83", "#00A7CF",
    "#B54C4C","#56B592", "#8AB52A","#BE72BE", "#00B6A1","#00CF6F","#349B61", "#0000BB", "#A59F5B","#009400",
    "#B00000", "#B0B000", "#B000B0", "#B8860B", "#E8B613", "#000000", "#00B0B0"
  ];

  let colorCodesSideChain = {
    basic: "#fbfff4", aliphatic: "#ff3100", aromatic: "#0772a1",
    hydroxyl: "#ff8700", sulfuric: "#ff8700", cyclic: "#00b74a",
    acid: "#fddbc7",  amide: "#fddbc7", gap: "#000000"
  };

  let colorCodesPolarity = {
    basic: "#fbfff4", nonpolar:"#ff3100", polar: "#0772a1", acidic: "#00b74a", gap: "#000000"
  };

  let aminoAcidProperties = {
    "A" : {sideClass: "aliphatic", polarity: "nonpolar"},  "R" : {sideClass: "basic", polarity: "basic"},
    "N" : {sideClass: "amide", polarity: "polar"},         "D" : {sideClass: "acid", polarity: "acidic"},
    "C" : {sideClass: "sulfuric", polarity: "nonpolar"},   "E" : {sideClass: "acid", polarity: "acidic"},
    "Q" : {sideClass: "amide", polarity: "polar"},         "G" : {sideClass: "aliphatic", polarity: "nonpolar"},
    "H" : {sideClass: "aromatic", polarity: "basic"},      "I" : {sideClass: "aliphatic", polarity: "nonpolar"},
    "L" : {sideClass: "aliphatic", polarity: "nonpolar"},  "K" : {sideClass: "basic", polarity: "basic"},
    "M" : {sideClass: "sulfuric", polarity: "nonpolar"},   "F" : {sideClass: "aromatic", polarity: "nonpolar"},
    "P" : {sideClass: "cyclic", polarity: "nonpolar"},     "S" : {sideClass: "hydroxyl", polarity: "polar"},
    "T" : {sideClass: "hydroxyl", polarity: "polar"},      "W" : {sideClass: "aromatic", polarity: "nonpolar"},
    "Y" : {sideClass: "aromatic", polarity: "polar"},      "V" : {sideClass: "aliphatic", polarity: "nonpolar"},
    "." : {sideClass: "gap", polarity: "gap"},             "~" : {sideClass: "gap", polarity: "gap"}
    };

  function colorBySideChain(residue) {
    return colorCodesSideChain[aminoAcidProperties[residue].sideClass];
  }

  function colorByPolarity(residue) {
    return colorCodesSideChain[aminoAcidProperties[residue].polarity];
  }

  return {
    getResidueCodes : function() { return aminoAcidCodes; },
    getColor   : function(residue) { return colorBySideChain(residue) }
  }

}