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
    acid: "#fddbc7",  amide: "#fddbc7"};

  let sideChains = {

    "A" : "aliphatic",  "R" : "basic",
    "N" : "amide",      "D" : "acid",
    "C" : "sulfuric",   "E" : "acid",
    "Q" : "amide",      "G" : "aliphatic",
    "H" : "aromatic",   "I" : "aliphatic",
    "L" : "aliphatic",  "K" : "basic",
    "M" : "sulfuric",   "F" : "aromatic",
    "P" : "cyclic",     "S" : "hydroxyl",
    "T" : "hydroxyl",   "W" : "aromatic",
    "Y" : "aromatic",   "V" : "aliphatic",

    };

  function colorBySideChain(residue) {
    return colorCodesSideChain[sideChains[residue]];
  }

  return {
    getResidueCodes : function() { return aminoAcidCodes; },
    getColor   : function(residue) { return colorBySideChain(residue) }
  }

}