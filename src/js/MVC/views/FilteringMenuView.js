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

    /*  Bind the view with knockoutJS */
    ko.applyBindings(this, this._elements.list[0]);
  }

  FilteringMenuView.prototype = {
    show : function () {
      this.rebuildList();
    },

    rebuildList : function () {
      let list, items, key;

      list = this._elements.list;
      list.html('');

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