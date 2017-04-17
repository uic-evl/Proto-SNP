"use strict";

// global application variable
var App = App || {};

//  Menu Controller "Class"
const MenuController = function() {

  /* Class private variable */
  let self = {};

  /* Set the callback for the coloring menu options */
  function init_color_on_click() {
    self.coloring_menu.click(function(e){
      e.preventDefault();

      /* Set the color scheme depending on the option the user selected */
      switch($(this).text()) {

        case "Side Chain Class":
          /*Set the new coloring scheme */
          App.colorMapping = "side chain";
          break;

        case "Side Chain Polarity":
          /*Set the new coloring scheme */
          App.colorMapping = "polarity";
          break;
      }

      /* Recolor the molecular viewers */
      App.leftMolecularViewer.recolor();
      App.rightMolecularViewer.recolor();

      /* Recolor the trend image*/
      App.trendImageViewer.recolor();
    });
  }

  /* Set the callback for the coloring menu options*/
  function init_sorting_on_click() {
    self.sorting_menu.click(function(e){
      e.preventDefault();

      /* Set the sorting algorithm depending on the option the user selected */
      switch($(this).text()) {
        case "Residue Frequency":
          /*Set the new coloring scheme */
          App.sorting = "residue_frequency";
          break;
        case "Edit Distance":
          /*Set the new coloring scheme */
          App.sorting = "edit_distance";
          break;
        case "Weighted Edit Distance":
          /*Set the new coloring scheme */
          App.sorting = "weighted_edit_distance";
          break;
      }
      /* Recolor the trend image*/
      App.trendImageViewer.reorder();
    });
  }

  function initialize_coloring_menu(id){
    /* Save the menu element*/
    self.coloring_menu = $(id);
    init_color_on_click();
  }

  function initialize_sorting_menu(id){
    /* Save the menu element*/
    self.sorting_menu = $(id);
    init_sorting_on_click();
  }

  return {
    initColoringMenu   : initialize_coloring_menu,
    initSortingMenu    : initialize_sorting_menu
  }

};