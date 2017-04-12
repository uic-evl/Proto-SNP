"use strict";

// Global Application variable
var App = App || {};

function ResidueModel() {

  /*List of all the amino acid codes*/
  let aminoAcidCodes = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P",
    "Q", "R", "S", "T", "U", "V", "W", "Y", "Z", ".", "~", "X"
  ];

  let colorCodes = {
    white : {code: "#fbfff4", rgba: [251.0, 255.0, 244.0, 255.0] },
    red   : {code: "#ff3100", rgba: [255.0, 49.0,  0.0,   255.0] },
    orange: {code: "#ff8700", rgba: [255.0, 135.0, 0.0,   255.0] },
    blue  : {code: "#0772a1", rgba: [7.0,   114.0, 161.0, 255.0] },
    green : {code: "#00b74a", rgba: [0.0,   183.0, 74.0,  255.0] },
    tan   : {code: "#fddbc7", rgba: [253.0, 219.0, 199.0, 255.0] },
    black : {code: "#000000", rgba: [0.0,   0.0,   0.0,   255.0] }
  };

  let colorCodesBySideChain = {
    basic     : colorCodes.white,
    aliphatic : colorCodes.red,
    aromatic  : colorCodes.blue,
    hydroxyl  : colorCodes.orange,
    sulfuric  : colorCodes.orange,
    cyclic    : colorCodes.green,
    acid      : colorCodes.tan,
    amide     : colorCodes.tan,
    gap       : colorCodes.black
  };

  let colorCodesByPolarity = {
    basic     : colorCodes.white,
    nonpolar  : colorCodes.red,
    polar     : colorCodes.blue,
    acidic    : colorCodes.green,
    gap       : colorCodes.black
  };

  let residuePropertiesByLetter = [
    {abbr: "A", sideClass: "aliphatic", polarity: "nonpolar", name: "ALA"},
    {abbr: "R", sideClass: "basic",     polarity: "basic",    name:"ARG"},
    {abbr: "N", sideClass: "amide",     polarity: "polar",    name:"ASN"},
    {abbr: "D", sideClass:  "acid",     polarity: "acidic",   name:"ASP"},
    {abbr: "C", sideClass: "sulfuric",  polarity: "nonpolar", name:"CYS"},
    {abbr: "E", sideClass: "acid",      polarity: "acidic",   name:"GLU"},
    {abbr: "Q", sideClass: "amide",     polarity: "polar",    name:"GLN"},
    {abbr: "G", sideClass: "aliphatic", polarity: "nonpolar", name:"GLY"},
    {abbr: "H", sideClass: "aromatic",  polarity: "basic",    name:"HIS"},
    {abbr: "I", sideClass: "aliphatic", polarity: "nonpolar", name:"ILE"},
    {abbr: "L", sideClass: "aliphatic", polarity: "nonpolar", name:"LEU"},
    {abbr: "K", sideClass: "basic",     polarity: "basic",    name:"LYS"},
    {abbr: "M", sideClass: "sulfuric",  polarity: "nonpolar", name:"MET"},
    {abbr: "F", sideClass: "aromatic",  polarity: "nonpolar", name:"PHE"},
    {abbr: "P", sideClass: "cyclic",    polarity: "nonpolar", name:"PRO"},
    {abbr: "S", sideClass: "hydroxyl",  polarity: "polar",    name:"SER"},
    {abbr: "T", sideClass: "hydroxyl",  polarity: "polar",    name:"THR"},
    {abbr: "W", sideClass: "aromatic",  polarity: "nonpolar", name:"TRP"},
    {abbr: "Y", sideClass: "aromatic",  polarity: "polar",    name:"TYR"},
    {abbr: "V", sideClass: "aliphatic", polarity: "nonpolar", name:"VAL"},
    {abbr: ".", sideClass: "gap",       polarity: "gap",      name:"gap"},
    {abbr: "~", sideClass: "gap",       polarity: "gap",      name:"gap"}
    ];

  function colorBySideChainClass(residue) {
    let residueProperties = _.find(residuePropertiesByLetter, function(r) {
      return residue === r.abbr || residue === r.name;
    });
    return colorCodesBySideChain[residueProperties.sideClass];
  }

  function colorByPolarity(residue) {
    return colorCodesByPolarity[residuePropertiesByLetter[residue].polarity];
  }

  function getColorMapping(mapping, residue){
    switch(mapping){
      case "side chain":
        return colorBySideChainClass(residue);
      case "polarity":
        return colorByPolarity(residue);
    }
  }

  return {
    getResidueCodes : function() {   return aminoAcidCodes; },
    getColor        : getColorMapping
  }

}