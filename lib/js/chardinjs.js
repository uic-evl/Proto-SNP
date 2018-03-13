"use strict";
(function() {
  /* Take from https://stackoverflow.com/questions/5996005/how-to-use-element-offsetparent-with-html-svg-elements*/
  function getBoundingBoxInArbitrarySpace(element,mat){
    let svgRoot = element.ownerSVGElement || element;
    let bbox = element.getBBox();

    let cPt1 =  svgRoot.createSVGPoint();
    cPt1.x = bbox.x;
    cPt1.y = bbox.y;
    cPt1 = cPt1.matrixTransform(mat);

    // repeat for other corner points and the new bbox is
    // simply the minX/minY  to maxX/maxY of the four points.
    let cPt2 = svgRoot.createSVGPoint();
    cPt2.x = bbox.x + bbox.width;
    cPt2.y = bbox.y;
    cPt2 = cPt2.matrixTransform(mat);

    let cPt3 = svgRoot.createSVGPoint();
    cPt3.x = bbox.x;
    cPt3.y = bbox.y + bbox.height;
    cPt3 = cPt3.matrixTransform(mat);

    let cPt4 = svgRoot.createSVGPoint();
    cPt4.x = bbox.x + bbox.width;
    cPt4.y = bbox.y + bbox.height;
    cPt4 = cPt4.matrixTransform(mat);

    let points = [cPt1,cPt2,cPt3,cPt4];

    //find minX,minY,maxX,maxY
    let minX=Number.MAX_VALUE;
    let minY=Number.MAX_VALUE;
    let maxX=0, maxY=0;
    for(let i=0;i<points.length;i++)
    {
      if (points[i].x < minX) {minX = points[i].x}
      if (points[i].y < minY) {minY = points[i].y}
      if (points[i].x > maxX) {maxX = points[i].x}
      if (points[i].y > maxY) {maxY = points[i].y}
    }

    //instantiate new object that is like an SVGRect
    return {"x":minX,"y":minY,"width":maxX-minX,"height":maxY-minY}
  }

  (function($, window) {
    // Define the plugin class
    let chardinJs = class chardinJs {
      constructor(el) {
        this.data_attribute = 'data-intro';
        this.chardinCssClasses = ["chardinjs-helper-layer", "chardinjs-show-element", "chardinjs-relative-position"];
        this.$el = $(el);
        this.isSVG = false;
        this.cb = null;
        // $(window).resize(() => {
        //   this.refresh(this.cb);
        // });
      }

      start(cb) {
        let el, i, len, ref, pos, svg_elements = [];
        if (this._overlay_visible()) {
          return false;
        }
          let _this = this;
          let recursive_search = function(el, nodes) {
              el.childNodes.forEach(function(child){
                  if(child.tagName === "g") {
                      recursive_search(child, nodes);
                  }
                  else {
                      let pos = _this._get_offset(child);
                      nodes.push({element: child, position: pos});
                  }
              });
          };

        ref = this.$el.find('*[' + this.data_attribute + ']:visible');
        for (i = 0, len = ref.length; i < len; i++) {
          el = ref[i];
          pos = this._get_offset(el);
          if(this._show_element(el,pos)) {
              svg_elements.push({element: el, position: pos});
          }
        }
        if(this.isSVG){
          this._add_svg_overlay_layer(svg_elements,cb)
        }
        else {
          this._add_overlay_layer(cb);
        }
        /* Start */
        this.$el.trigger('chardinJs:start');
      }

      toggle(cb) { return (!this._overlay_visible()) ? this.start(cb) : this.stop(); }

      refresh(cb) {
        let el, i, len, ref, results = [];
        if (this._overlay_visible()) {
          ref = this.$el.find('*[' + this.data_attribute + ']:visible');
          for (i = 0, len = ref.length; i < len; i++) {
            el = ref[i];
            results.push(this._position_helper_layer(el));
          }
          return results;
        }
      }

      stop() {
        let css, i, len, ref;

        if(this.isSVG){
          this.$el.find("svg.shape-overlays").fadeOut(function() { return $(this).remove(); });
        }
        else {
          this.$el.find(".chardinjs-overlay").fadeOut(function() { return $(this).remove(); });
        }

        this.$el.find('.chardinjs-helper-layer').remove();
        ref = this.chardinCssClasses;

        for (i = 0, len = ref.length; i < len; i++) {
          css = ref[i];
          this._remove_classes(css);
        }

        if (window.removeEventListener) {
          window.removeEventListener("keydown", this._onKeyDown, true);
        }
        else {
          if (document.detachEvent) {
            //IE
            document.detachEvent("onkeydown", this._onKeyDown);
          }
        }
        this.$el.trigger('chardinJs:stop');
      }

      _remove_classes(css) {
        return this.$el.find('.' + css).removeClass(css);
      }

      set_data_attribute(attribute) {
        return this.data_attribute = attribute;
      }

      _overlay_visible() {
        if(this.isSVG) return this.$el.find('.svgOverlay').length !== 0;
        else return this.$el.find('.chardinjs-overlay').length !== 0;
      }

      _add_svg_overlay_layer(elements,cb) {
        let element_position, overlay_layer, styleText = "", mask = "";
        if (this._overlay_visible()) {
          return false;
        }

        /* Create the SVG overlays */
        if (this.$el.prop('tagName') === "BODY") {
          overlay_layer =
            "<svg class=\"shape-overlays\"><defs><mask id=\"maskedElements\"><rect class=\"overlay-rect\"/>";
        }
        else {
          element_position = this._get_offset(this.$el.get()[0]);
          styleText = "width: " + element_position.width + "px; height:" + parseInt(element_position.height) +
            "px; top:" + element_position.top + "px;left: " + element_position.left + "px;";
          overlay_layer = "<svg class=\"shape-overlays\"><defs><mask id=\"maskedElements\"><rect style=\""+styleText+"\"/>";
        }

        /* Iterate over the svg elements and add them to the mask */
        elements.forEach(function(el){
          let svgEl = "";
          switch(el.element.tagName){
            case "rect":
            case "g":
            case "svg":
            case "UL":
              svgEl = "<rect x=\"" + el.position.left + "\" y=\"" + el.position.top + "\" width=\"" + el.position.width
                + "\" height=\"" + el.position.height + "\"></rect>";
              break;
            case "circle":
              //svgEl = '<circle cx="' + el.position.left + '" cy="' + el.position.top + '" r="' + el.element.get + '></circle>'
              break;
          }
          mask = mask + svgEl;
        });

        /* Append the masking elements to the mask */
        overlay_layer += mask + "</mask></defs><rect x=\"0\" y=\"0\" class=\"svgOverlay\"/></svg>";

        /* Add the overlay and set its click event */
        this.$el.append(overlay_layer);
        this.$el.find(".svgOverlay").on("click",() => {
            if(cb && typeof(cb)==="function") {
                cb.call(this)
            }
            this.stop();
        });
      }

      _add_overlay_layer(cb) {
        let element_position, overlay_layer, styleText = "";
        if (this._overlay_visible()) {
          return false;
        }
        /* Create the overlay div and set it's class */
        overlay_layer = document.createElement("div");
        overlay_layer.className = "chardinjs-overlay";

        //check if the target element is body, we should calculate the size of overlay layer in a better way
        if (this.$el.prop('tagName') === "BODY") {
          styleText += "top: 0;bottom: 0; left: 0;right: 0; position: fixed;";
          overlay_layer.setAttribute("style", styleText);
        }
        else {
          element_position = this._get_offset(this.$el.get()[0]);
          if (element_position) {
            styleText += "width: " + element_position.width + "px; height:" + element_position.height + "px; top:" + element_position.top + "px;left: " + element_position.left + "px;";
            overlay_layer.setAttribute("style", styleText);
          }
        }

        /* Add the overlay and set its click event */
        this.$el.get()[0].appendChild(overlay_layer);
        overlay_layer.onclick = () => {
            if(cb && typeof(cb)==="function") {
                cb.call(this)
            }
            this.stop();
        };

        setTimeout(function() {
          styleText += "opacity: .8;opacity: .8;-ms-filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=80)';filter: alpha(opacity=80);";
          return overlay_layer.setAttribute("style", styleText);
        }, 10);
      }

      _get_position(element) {
        return element.getAttribute('data-position') || 'bottom';
      }

      _get_width(element) {
          return element.getAttribute('data-width') || 0;
      }

      _get_css_attribute(element) {
        let css, cssClasses, i, len, value;
        value = element.getAttribute(this.data_attribute + "-css") || '';
        if (value && String(value).replace(/\s/g, "").length > 1) {
          cssClasses = (value.split(" ")).filter(function(css) {
            return css.length !== 0;
          });
          for (i = 0, len = cssClasses.length; i < len; i++) {
            css = cssClasses[i];
            this._add_css_attribute(css);
          }
        }
        return value;
      }

      _add_css_attribute(css) {
        if (!$.inArray(css, this.chardinCssClasses) > -1) {
          this.chardinCssClasses.push(css);
        }
      }

      _getStyle(el, styleProp, special) {
        if (window.getComputedStyle) {
          return window.getComputedStyle(el, special).getPropertyValue(styleProp);
        }
        else {
          return el.currentStyle[styleProp];
        }
      }

      _place_tooltip(element, target_position, tooltip_layer) {
        let my_height, offset, position, target_height, target_width, tooltipActualWidth, tooltipMaxWidth, tooltip_layer_position;
        tooltip_layer_position = this._get_offset(tooltip_layer);
        // Reset the old style
        tooltip_layer.style.top = null;
        tooltip_layer.style.right = null;
        tooltip_layer.style.bottom = null;
        tooltip_layer.style.left = null;
        position = this._get_position(element);
        switch (position) {
          case "top":
          case "bottom":
            target_width = target_position.width;
            tooltip_layer.style.left = `${(target_width / 2) - (tooltip_layer_position.width / 2)}px`;
            tooltip_layer.style[position] = "-" + tooltip_layer_position.height + "px";
            break;
          case "left":
          case "right":
            tooltipMaxWidth = parseFloat(this._getStyle(tooltip_layer, "max-width"));
            tooltip_layer.style[position] = "-" + tooltipMaxWidth + "px";
            target_height = target_position.height;
            my_height = parseFloat(this._getStyle(tooltip_layer, "height"));
            tooltip_layer.style.top = `${(target_height / 2) - (my_height / 2)}px`;
            tooltipActualWidth = parseFloat(this._getStyle(tooltip_layer, "width"));
            offset = 175 - (tooltipMaxWidth - tooltipActualWidth);
            tooltip_layer.style[position] = "-" + offset + "px";
        }
      }

      _position_helper_layer(element, position) {
        $(element).data('helper_layer')
          .setAttribute("style", `width: ${position.width}px; height:${position.height}px; top:${position.top}px; left: ${position.left}px;`);
      }

      _show_element(element, position) {
        let current_element_position = "", helper_layer, tooltip_layer, prev_className, data_width = this._get_width(element);

        /* Create the helper and tooltip elements */
        helper_layer = document.createElement("div");
        tooltip_layer = document.createElement("div");

        /* Append the helper layer and the tooltip layer */
        $(element)
          .data('helper_layer', helper_layer)
          .data('tooltip_layer', tooltip_layer);

        if (element.id) {
          helper_layer.setAttribute("data-id", element.id);
        }

        helper_layer.className = `chardinjs-helper-layer chardinjs-${this._get_position(element)}`;
        this._position_helper_layer(element, position);
        this.$el.get()[0].appendChild(helper_layer);

        /* Create the tooltip element */
        tooltip_layer.className = `chardinjs-tooltip chardinjs-${this._get_position(element)}`;
        if(data_width > 0){
            tooltip_layer.innerHTML = `<div class='chardinjs-tooltiptext' style='width:${data_width}'>${element.getAttribute(this.data_attribute)}</div>`;
        }
        else {
            tooltip_layer.innerHTML = `<div class='chardinjs-tooltiptext'>${element.getAttribute(this.data_attribute)}</div>`;
        }

        /* Add the tooltip to the helper */
        helper_layer.appendChild(tooltip_layer);
        /* Position the tooltip depending on the 'data-position' of the element */
        this._place_tooltip(element, position, tooltip_layer);

        /* Check if the element is an SVG */
        if(element instanceof SVGElement || element.tagName === "UL"){
          this.isSVG = true;
          return this.isSVG;
        }
        /* If not, add the chardinjs class to bring the element to the front */
        else {
          /* Save the element's current class name */
          prev_className = element.getAttribute("class");
          element.setAttribute("class", prev_className + " chardinjs-show-element " + this._get_css_attribute(element));

          if (element.currentStyle) { //IE
            current_element_position = element.currentStyle["position"];
          }
          else if (document.defaultView && document.defaultView.getComputedStyle) { //Firefox
            current_element_position = document.defaultView.getComputedStyle(element, null).getPropertyValue("position");
          }

          current_element_position = current_element_position.toLowerCase();
          if (current_element_position !== "absolute" && current_element_position !== "relative") {
            element.setAttribute("class", prev_className + " chardinjs-show-element");
          }
        }
      }

      _get_offset(element) {
        let bBox, element_position;
        if(element instanceof SVGElement){
          bBox = getBoundingBoxInArbitrarySpace(element,element.getScreenCTM())
        }
        else {
          bBox = element.getBoundingClientRect();
        }
        /* Assign the positioning based on the bounding box*/
        element_position = {
          width: bBox.width,
          height: bBox.height,
          top: bBox.y,
          left: bBox.x
        };
        return element_position;
      }

    };
    return $.fn.extend({
      chardinJs: function(option, ...args) {
        let $this, data;
        $this = $(this[0]);
        data = $this.data('chardinJs');
        if (!data) {
          $this.data('chardinJs', (data = new chardinJs(this, option)));
        }
        if (typeof option === 'string') {
          data[option].apply(data, args);
        }
        else if (typeof option === 'object') {
          if (typeof option['attribute'] === 'string') {
            data.set_data_attribute(option['attribute']);
          }
          if (typeof option['method'] === 'string') {
            data[option['method']].apply(data, args);
          }
        }
        return data;
      }
    });
  })(window.jQuery, window);

}).call(this);
