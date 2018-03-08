"use strict";

// global application variable
var App = App || {};

// Utilities class generic operations and conversions
const TextUtilities = function(){

    let fontSize_PixelsHeight = {
            "6pt"   :{pixels: 8,  EM: "0.5em"},
            "7pt"   :{pixels: 9,  EM: "0.55em"},
            "7.5pt" :{pixels: 10, EM: "0.625em"},
            "8pt"   :{pixels: 11, EM: "0.7em"},
            "9pt"   :{pixels: 12, EM: "0.75em"},
            "10pt"  :{pixels: 13, EM: "0.8em"},
            "10.5pt":{pixels: 14, EM: "0.875em"},
            "11pt"  :{pixels: 15, EM: "0.95em"},
            "12pt"  :{pixels: 16, EM: "1em"},
            "13pt"  :{pixels: 17, EM: "1.05em"},
            "13.5pt":{pixels: 18, EM: "1.125em"},
            "14pt"  :{pixels: 19, EM: "1.2em"},
            "14.5pt":{pixels: 20, EM: "1.25em"},
            "15pt"  :{pixels: 21, EM: "1.3em"},
            "16pt"  :{pixels: 22, EM: "1.4em"},
            "17pt"  :{pixels: 23, EM: "1.45em"},
            "18pt"  :{pixels: 25, EM: "1.5em"},
            "20pt"  :{pixels: 26, EM: "1.6em"},
            "22pt"  :{pixels: 29, EM: "1.8em"},
            "24pt"  :{pixels: 32, EM: "2em"},
            "26pt"  :{pixels: 35, EM: "2.2em"},
            "27pt"  :{pixels: 36, EM: "2.25em"},
            "28pt"  :{pixels: 37, EM: "2.3em"},
            "29pt"  :{pixels: 38, EM: "2.35em"},
            "30pt"  :{pixels: 40, EM: "2.45em"},
            "32pt"  :{pixels: 42, EM: "2.55em"},
            "34pt"  :{pixels: 45, EM: "2.75em"},
            "36pt"  :{pixels: 48, EM: "3em"}
        },

        textContext = d3Utils.create_chart_back_buffer({width: 50, height: 50}).getContext("2d");

    function font_size_to_pixel_height(font_size) {
        return fontSize_PixelsHeight[font_size].pixels;
    }

    function get_text_width(font, txt){
        textContext.font = font;
        return textContext.measureText(txt).width;
    }

    function em_to_pixel_height(em){
        return _.find(fontSize_PixelsHeight, {"EM":em}).pixels
    }

    function translate(x,y) {
        return "translate(" + x + "," + y + ")"
    }

    function truncate(string, length){
        if (string.length > length)
            return string.substring(0,length)+'...';
        else
            return string;
    }

    function wrap(text, width) {
        text.each(function() {
            let text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }


    /** Function that count occurrences of a substring in a string;
     * @param {String} string               The string
     * @param {String} subString            The sub string to search for
     * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
     *
     * @author Vitim.us https://gist.github.com/victornpb/7736865
     * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
     * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
     */
   function occurrences(string, subString, allowOverlapping) {

        string += "";
        subString += "";
        if (subString.length <= 0) return (string.length + 1);

        let n = 0,
            occurrences = [],
            pos = 0,
            step = allowOverlapping ? 1 : subString.length;

        while (true) {
            pos = string.indexOf(subString, pos);
            if (pos >= 0) {
                ++n;
                occurrences.push(pos);
                pos += step;
            } else break;
        }
        return occurrences;
    }

    return {
        fontSizeToPixels : font_size_to_pixel_height,
        emToPixels       : em_to_pixel_height,
        translate        : translate,
        truncate         : truncate,
        occurrences      : occurrences,
        getTextWidth     : get_text_width,
        wordWrap         : wrap
    }

};

App.textUtilities = new TextUtilities();