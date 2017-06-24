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
  };

  function font_size_to_pixel_height(font_size) {
    return fontSize_PixelsHeight[font_size].pixels;
  }

  function test_rendered(element) {
    return new Promise((resolve, reject)=>{
      if (!$(element).size()) {
        window.requestAnimationFrame(test_rendered);
      }else {
        console.log("rendered");
        resolve();
      }
    });
  }

  function translate(x,y) {
    return "translate(" + x + "," + y + ")"
  }

  return {
    fontSizeToPixels : font_size_to_pixel_height,
    testIfRendered   : test_rendered,
    translate        : translate
  }

};

App.textUtilities = new TextUtilities();