"use strict";

// Global Application variable
var App = App || {};

function ResidueMappingUtility() {
    let self = { legend_svg: {}, residue_svg : null},

    colorCodes = {
        white : {code: "#fbfff4", rgba: [251.0, 255.0, 244.0, 255.0] },
        red   : {code: "#ff3100", rgba: [255.0, 49.0,  0.0,   255.0] },
        orange: {code: "#ff8700", rgba: [255.0, 135.0, 0.0,   255.0] },
        blue  : {code: "#0772a1", rgba: [7.0,   114.0, 161.0, 255.0] },
        green : {code: "#00b74a", rgba: [0.0,   183.0, 74.0,  255.0] },
        tan   : {code: "#fddbc7", rgba: [253.0, 219.0, 199.0, 255.0] },
        black : {code: "#000000", rgba: [0.0,   0.0,   0.0,   255.0] },
        gray  : {code: "#A9A9A9", rgba: [128.0, 128.0, 128.0, 255.0]}
    },

    colorCodesByFamilyConsensus = {
        mismatch : "#990000",
        match: "#D3D3D3"
    },

    colorCodesBySideChain = {
        basic     : colorCodes.white,
        aliphatic : colorCodes.red,
        aromatic  : colorCodes.blue,
        hydroxyl  : colorCodes.orange,
        sulfuric  : colorCodes.orange,
        cyclic    : colorCodes.green,
        acid      : colorCodes.tan,
        amide     : colorCodes.tan,
        gap       : colorCodes.gray
    },

    colorCodesByPolarity = {
        basic     : colorCodes.white,
        nonpolar  : colorCodes.red,
        polar     : colorCodes.blue,
        acidic    : colorCodes.green,
        gap       : colorCodes.gray
    },

    colorCodesByResidueFrequency = {
        match     : colorCodes.red,
        mismatch  : colorCodes.white,
        gap       : colorCodes.gray
    },

    colorCodesSelection = {
        all     : colorCodes.white
    },

    residuePropertiesByLetter = [
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
        {abbr: "X", sideClass: "gap",       polarity: "gap",      name:"gap"},
        {abbr: ".", sideClass: "gap",       polarity: "gap",      name:"gap"},
        {abbr: "~", sideClass: "gap",       polarity: "gap",      name:"gap"},
        {abbr: "-", sideClass: "gap",       polarity: "gap",      name:"gap"}
    ],

    /* The current color map*/
    currentColorMap = {};

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
        let residues = _.keys(highest_frequency),
            res = _.find(residuePropertiesByLetter, function(o) { return o.abbr === residue; });
        if(res.name === "gap"){
            return  colorCodesByResidueFrequency["gap"];
        }
        else if(_.indexOf(residues, residue) > -1){
            return  colorCodesByResidueFrequency["match"];
        }
        else {
            return  colorCodesByResidueFrequency["mismatch"];
        }
    }

    function colorBySelection(residue) {
        return colorCodesSelection["all"];
    }

    function get_color_mapping(mapping, id){
        switch(mapping.trim()){
            case "Side Chain Class":
            default:
                currentColorMap[id] = colorCodesBySideChain;
                return colorBySideChainClass;
            case "Side Chain Polarity":
                currentColorMap[id] = colorCodesByPolarity;
                return colorByPolarity;
            case "Selections Only":
                currentColorMap[id] = colorCodesSelection;
                return colorBySelection;
            case "Frequency (Family Viewer)":
                currentColorMap[id] = colorCodesByResidueFrequency;
                return colorByFrequency;
        }
    }

    /* Initialize the legend DOM */
    function initialize_legend(id) {
        self.legend = document.getElementById("trendSVG");

        /* Get the bounds of the nav bar and menu item */
        let nav_width = d3.select("#familySettings").node().clientWidth,
            nav_height = d3.select("#familySettings").node().clientHeight,
            settings_width = d3.select("#familyName").node().clientWidth,
            nav_offset = d3.select("#familySettings").node().getBoundingClientRect(),
            settings_offset = d3.select("#familyName").node().getBoundingClientRect();

        self.x = settings_offset.x + settings_width + nav_offset.x;
        self.legend_width = (nav_width - self.x) * 0.75;
        self.legend_height = nav_height;

        self.legend_svg[id] = d3.select(self.legend)
            .append("g")
            .attr("id", "frequencyLegend");

    }

    function residue_legend() {

        self.residueLegend = document.getElementById("residueColorLegend");
        d3.select(".legendRow").classed("hidden", false);

        let residue_elements    = _.toPairs(colorCodesByFamilyConsensus),
            legend_width        = self.residueLegend.clientWidth/2.0,
            legend_height       = legend_width/2.0,
            legendElementWidth  = legend_width / (residue_elements.length),
            legendElementHeight = legend_width / 10.0;

        d3.select(self.residueLegend)
            .style("width",legendElementWidth*2.0 + 2)
            .style("margin-left", "auto")
            .style("margin-right", "auto");

        self.residue_svg =
            d3.select(self.residueLegend).append("svg")
                // .classed("center-aligned", true)
                .style("width", legendElementWidth*2.0 + 2)
                .style("height", legend_height);

        let residue_bars = self.residue_svg
            .selectAll(".legendElement")
            .data(residue_elements);

        residue_bars
            .enter().append('g')
            .append('rect')
            /* Merge the old elements (if they exist) with the new data */
            .merge(residue_bars)
            .attr("class", "legendElement")
            .attr("width", legendElementWidth)
            .attr("height", legendElementHeight)
            .attr('x', (d, i) => { return legendElementWidth * i + 1 })
            .attr('y', (d) => { return 1; })
            .style("fill", (d) => { return d[1] });
        /* Add the text to the legend*/
        let residue_text = self.residue_svg
            .selectAll(".legendText")
            .data(residue_elements);

        residue_text.enter()
            .append("text")
            /* Merge the old elements (if they exist) with the new data */
            .merge(residue_text)
            .attr("class", "legendText")
            .text((d) => {return d[0]; })
            // .attr("transform", function(d,i){
            //     let font_family = utils.getComputedStyleValue(this, "font-family"),
            //         font = "0.6rem " + font_family,
            //         text_length = App.textUtilities.getTextWidth(font, d[0]),
            //         x = text_length/2.0 + legendElementWidth * i,
            //         y = legendElementHeight + App.textUtilities.fontSizeToPixels("10pt");
            //         console.log(App.textUtilities.translate(x,y));
            //     return App.textUtilities.translate(x,y);
            // })
            .attr("x", function(d, i) {
                let font_family = utils.getComputedStyleValue(this, "font-family"),
                    font = "0.6rem " + font_family,
                    text_length = App.textUtilities.getTextWidth(font, d[0]);
                return text_length/2.0 + legendElementWidth * i;
            })
            .attr("y", legendElementHeight + App.textUtilities.fontSizeToPixels("10pt"))
        ;

        /* Remove the unneeded bars/text */
        residue_bars.exit().remove();
        residue_bars.exit().remove();
    }

    /* Create the legend for the current coloring scheme */
    function create_legend(type){

        let id = (type === "3D") ? "tertiaryColorLegend" : "familyColorLegend",
            elements = _.toPairs(currentColorMap[type]);

        if(!self.legend_svg[id]){
            residue_legend(elements);
            initialize_legend(id);
        }

        let
            legendElementWidth  = self.legend_width / (elements.length),
            legendElementHeight = self.legend_height / 3.0,
            element_height = legendElementHeight + App.textUtilities.fontSizeToPixels("10pt"),
            offset_y = (self.legend_height - element_height) / 2.0;

        /* Add the color bands to the legend */
        let legend_bars = self.legend_svg[id]
            .selectAll(".legendElement")
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
            .attr('x', (d, i) => { return self.x + legendElementWidth * i + 1 })
            .attr('y', (d) => { return offset_y})
            .style("fill", (d) => { return d[1].code });

        /* Add the text to the legend*/
        let legend_text = self.legend_svg[id].selectAll(".legendText")
            .data(elements);

        legend_text.enter()
            .append("g")
            .append("text")
            /* Merge the old elements (if they exist) with the new data */
            .merge(legend_text)
            .attr("class", "legendText")
            .text((d) => { return App.textUtilities.truncate(d[0],6); })
            .attr("x", (d, i) => { return self.x + legendElementWidth * i + 5; })
            .attr("y", offset_y + legendElementHeight + App.textUtilities.fontSizeToPixels("10pt"));

        /* Remove the unneeded bars/text */
        legend_bars.exit().remove();
        legend_text.exit().remove();
    }

    function clear(type) {
        let id = (type === "3D") ? "tertiaryColorLegend" : "familyColorLegend";
        self.residue_svg.remove();
        self.legend_svg[id].remove();
        delete self.legend_svg[id];
        delete self.residue_svg;
    }

    return {
        createColorLegend : create_legend,
        getColor          : get_color_mapping,
        clear             : clear
    }
}