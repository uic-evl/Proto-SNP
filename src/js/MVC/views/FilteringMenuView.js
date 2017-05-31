"use strict";

var App = App || {};

const FilteringMenuView = (function() {

  function FilteringMenuView(model, elements) {
    this._model = model;
    this._elements = elements;
    this.filters = ko.observableArray([]);

    this.selectionModified = new EventNotification(this);

    let _this = this;

    /* Create the click listener */
    this.elementSelected = function(obj, e) {
      _this.selectionModified.notify({ element : obj.filter });
    };
  }

  FilteringMenuView.prototype = {
    show : function () {
      this.rebuildList();
    },

    rebuildList : function () {
      let items, key;

      items = this._model.getItems();
      for (key in items) {
        this.filters.push({filter : items[key] });
      }
      /* Set the initial item */
      this._model.setSelectedElement(items[0]);
    }
  };

  return FilteringMenuView;

})();