"use strict";

// Global Application variable
var App = App || {};

function ResidueMappingUtility() {

  let self = {};

  let colorCodes = {
    white : {code: "#fbfff4", rgba: [251.0, 255.0, 244.0, 255.0] },
    red   : {code: "#ff3100", rgba: [255.0, 49.0,  0.0,   255.0] },
    orange: {code: "#ff8700", rgba: [255.0, 135.0, 0.0,   255.0] },
    blue  : {code: "#0772a1", rgba: [7.0,   114.0, 161.0, 255.0] },
    green : {code: "#00b74a", rgba: [0.0,   183.0, 74.0,  255.0] },
    tan   : {code: "#fddbc7", rgba: [253.0, 219.0, 199.0, 255.0] },
    black : {code: "#000000", rgba: [0.0,   0.0,   0.0,   255.0] },
    gray  : {code: "#A9A9A9", rgba: [128.0, 128.0, 128.0, 255.0]}
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
    gap       : colorCodes.gray
  };

  let colorCodesByPolarity = {
    basic     : colorCodes.white,
    nonpolar  : colorCodes.red,
    polar     : colorCodes.blue,
    acidic    : colorCodes.green,
    gap       : colorCodes.gray
  };

  let colorCodesByResidueFrequency = {
    match     : colorCodes.red,
    mismatch  : colorCodes.white,
    gap       : colorCodes.gray
  };

  let residuePropertiesByLetter = [
    {abbr: "A", sideClass: "aliphatic", polarity: "nonpolar", name:"ALA"},
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
    {abbr: "~", sideClass: "gap",       polarity: "gap",      name:"gap"},
    {abbr: "-", sideClass: "gap",       polarity: "gap",      name:"gap"}
    ];


  /* The current color map*/
  let currentColorMap = null;

  function colorBySideChainClass(residue) {
    let residueProperties = _.find(residuePropertiesByLetter, function(r) {
      return residue === r.abbr || residue === r.name;
    });
    return colorCodesBySideChain[(residueProperties) ? residueProperties.sideClass : "gap"];
  }


  function colorByPolarity(residue) {
    let residueProperties = _.find(residuePropertiesByLetter, function(r) {
      return residue === r.abbr || residue === r.name;
    });
    return colorCodesByPolarity[(residueProperties) ? residueProperties.polarity : "gap"];
  }


  /* Coloring the sequences, the fragment in the same column with the largest frequency
   are colored with red for other fragment, if the adjacent fragment(in the column)
   are same, they will be colored in same color
 */
  function colorByFrequency(residue, highest_frequency) {
    let residues = _.keys(highest_frequency);
    if(residue === "gap"){
      return  colorCodesByResidueFrequency["gap"];
    }
    else if(_.indexOf(residues, residue) > -1){
      return  colorCodesByResidueFrequency["match"];
    }
    else {
      return  colorCodesByResidueFrequency["mismatch"];
    }
  }


  function get_color_mapping(mapping){
    switch(mapping.trim()){
      case "Side Chain Class":
      default:
        currentColorMap = colorCodesBySideChain;
        return colorBySideChainClass;
        break;
      case "Side Chain Polarity":
        currentColorMap = colorCodesByPolarity;
        return colorByPolarity;
        break;
      case "Frequency (Family Viewer)":
        currentColorMap = colorCodesByResidueFrequency;
        return colorByFrequency;
        break;
    }
  }


  /* Initialize the legend DOM */
  function initialize_legend() {
    self.legend        = document.getElementById('colorLegend');
    self.legend_width  = self.legend.clientWidth;
    self.legend_height = 2.0 * document.getElementsByClassName('view')[0].clientHeight / 2.0;

    /* Color map legend */
    self.legend_svg =
        d3.select(self.legend)
            .append("svg")
            .attr("width", self.legend_width);

  }

  /* Create the legend for the current coloring scheme */
  function create_legend(){

    if(!self.legend_svg){
      initialize_legend();
    }

    let elements = _.toPairs(currentColorMap),
        legendElementWidth  = self.legend_width / (elements.length),
        legendElementHeight = self.legend_height / 2.0;

    /* Add the color bands to the legend */
    let legend_bars = self.legend_svg.selectAll(".legendElement")
        .data(elements);

    // UPDATE: add new elements if needed
    legend_bars
        .enter().append('g')
        .append('rect')
        /* Merge the old elements (if they exist) with the new data */
        .merge(legend_bars)
        .attr("class", "legendElement")
        .attr("width", legendElementWidth)
        .attr("height", legendElementHeight)
        .attr('x', (d, i) => { return legendElementWidth * i + 1 })
        .attr('y', (d) => { return 1; })
        .style("fill", (d) => { return d[1].code });

    /* Add the text to the legend*/
    let legend_text = self.legend_svg.selectAll(".legendText")
        .data(elements);

    legend_text.enter()
        .append("g")
        .append("text")
        /* Merge the old elements (if they exist) with the new data */
        .merge(legend_text)
        .attr("class", "legendText")
        .text((d) => { return d[0]; })
        .attr("x", (d, i) => { return legendElementWidth * i + 5; })
        .attr("y", legendElementHeight + App.textUtilities.fontSizeToPixels("10pt"))
    ;

    /* Remove the unneeded bars/text */
    legend_bars.exit().remove();
    legend_text.exit().remove();
  }

  return {
    createColorLegend : create_legend,
    getColor          : get_color_mapping
  }
}

