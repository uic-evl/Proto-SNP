"use strict";

var App = App || {};

const TertiaryStructureView = (function() {

  function TertiaryStructureView(model, element) {
    let _this = this;

    _this._model = model;
    _this._id = element.id;
    _this._position = element.position;
    _this._dom = null;



  }

  TertiaryStructureView.prototype = {
    show : function () {

      this._dom = $('#'+this._id);
      this._dom.find('#leftSplash').load("./src/html/splashTemplate.html", function(data){
        console.log(data);
      })

    }

  };

  return TertiaryStructureView;

})();