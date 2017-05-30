"use strict";

var App = App || {};

const FilteringMenuView = (function() {

  function FilteringMenuView(model, elements) {
    this._model = model;
    this._elements = elements;
    this.filters = ko.observableArray([]);

    this.listModified = new EventNotification(this);

    let _this = this;

    //attach listeners to HTML controls
    this._elements.list.change(function (e) {
      console.log("notify");
      _this.listModified.notify({ index : e.target.selectedIndex });
    });

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
      this._model.setSelectedIndex(-1);
    }
  };

  return FilteringMenuView;

})();