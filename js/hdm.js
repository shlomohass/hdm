/********** TODO *****************************************

*********************************************************/

;(function ($, window, document, undefined) {

    // constructor
    var Hdm = function (element, options) {
        this.ele 		= element;
        this.$ele 		= $(element);
        this.options 	= options;
        this.metadata 	= this.$ele.data('options');
      	this.model = {
          enabled : false,
          stopwatch : { of : null, watch : null},
          page : {
              baseSize : { width : 0, height : 0 },
              baseGrid : { col : 0, row : 0 },
              mousePos : { x : 0, y : 0 }
          },
          elem : [],
          text : []
        };
    }
    
    //Private methods:
    var _set = function() {
        var inst = this;
      	
        //Get base size:
        inst.model.page.baseSize.width = inst.$ele.outerWidth();
        inst.model.page.baseSize.height = inst.$ele.outerHeight();
        
        //Calculate base grid:
        inst.model.page.baseGrid.col = Math.floor(inst.model.page.baseSize.width / inst.config.map.resolution);
        inst.model.page.baseGrid.row = Math.floor(inst.model.page.baseSize.height / inst.config.map.resolution);
        
        //Get Elements to track:
        $.each(inst.config.map.containers, function(i, e){ 
            var $candid = $(e);
            if ($candid.length) {
                $.each($candid, function(j, ee){
                    var $ee = $(ee);
                    var eeWidth = $ee.outerWidth();
                    var eeHeight = $ee.outerHeight();
                    if (eeWidth > 0 && eeHeight > 0) {
                        var eeWratio = eeWidth / inst.model.page.baseSize.width;
                        var eeHratio = eeHeight / inst.model.page.baseSize.height;
                        inst.model.elem.push({ 
                            e        : $ee, 
                            baseSize : { width : eeWidth, height : eeHeight },
                            ratio    : { width : eeWratio, height : eeHratio },
                            grid     : { 
                                            col : Math.round(inst.model.page.baseGrid.col * eeWratio),
                                            row : Math.round(inst.model.page.baseGrid.row * eeHratio),
                                            obj : _createMat.call(
                                                    inst, 
                                                    Math.round(inst.model.page.baseGrid.col * eeWratio), 
                                                    Math.round(inst.model.page.baseGrid.row * eeHratio),
                                                    0
                                            )
                                        },
                            elem     : []
                        });
                        var id = inst.model.elem.length - 1;
                        $ee.data("reporthdm", {
                            id : id,
                            lastCell : { col : 0, row : 0 }
                        });
                        for (var t = 0; t < inst.config.map.elements.length; t++) {
                            var $found = $ee.find(inst.config.map.elements[t]);
                            if ($found.length) {
                                $.each($found, function(tt, eel){
                                    var path = _getXPathTo.call(inst, eel);
                                    inst.model.elem[inst.model.elem.length - 1].elem.push({
                                        path  : path,
                                        enter : 0
                                    });
                                    $(eel).data("reporthdm", {
                                        id     : inst.model.elem[inst.model.elem.length - 1].elem.length - 1,
                                        conid  : id,
                                        mypath : path
                                    });
                                });
                            }
                        }
                        $ee.data("reporthdm", {
                            id : inst.model.elem.length - 1,
                            lastCell : { col : 0, row : 0 }
                        });
                    }
                });
            }
        });
        
        //Attach Mouse tracking:
        $(document).mousemove(function(e){
             inst.model.page.mousePos.x = e.pageX;
             inst.model.page.mousePos.y = e.pageY;
             //console.log("X Axis : " + inst.model.page.mousePos.x + " Y Axis : " + inst.model.page.mousePos.y);
        });
        
        //Attach text highlighter:
        $(document).mouseup(function() {
            var res = _getSelectedText();
            var len = 0;
            if (res != '') {
                console.log("text captured: " + res);
                var words = res.split(" ");
                len = words.length;
                if (words.length > 4) {
                    words.splice(2, words.length - 4, "...");
                    res = [ words[0] + " " + words[1], words[2], words[3] + " " + words[4]];
                }
                console.log("text handled: " + (typeof res === "string" ? res : res.join(" ")));
                inst.model.text.push({ p : res, len : len });
                _findAndReplace(res, "<span class='hdm-marktext'style='background-color:rgba(250,230,0,0.3);'>$1</span>");
            }
        });
        
        //Attach reporter:
        $.each(inst.model.elem, function(i, ele){
            ele.e.mouseenter(function() {
                var $this = $(this);
                var id    = $this.data("reporthdm").id;
                console.log("mouse enter id -> ", id);
                clearInterval(inst.model.stopwatch.watch);
                inst.model.stopwatch.watch = setInterval(function(){
                    
                    //calculate sub grid mouse position:
                    var calc = _getRatioBasedGridAndPosition.call(inst, $this, id);
                    
                    //Save to grid:
                    if ($this.data("reporthdm").lastCell.col !== calc.targetCell.col || $this.data("reporthdm").lastCell.row !== calc.targetCell.row) {
                        inst.model.elem[id].grid.obj[calc.targetCell.col][calc.targetCell.row]++;

                        //Save recent pos:
                        $this.data("reporthdm").lastCell = jQuery.extend({}, calc.targetCell);
                        //count row:
                        console.log(
                                "ele id:" + id, 
                                "Base cell x:" + calc.baseCellsize.x + " y:" + calc.baseCellsize.y,
                                calc.newRatioSize,
                                calc.targetCell
                        );
                    }
                    
                }, inst.config.map.reportSpeed);
                
            }).mouseleave(function() {
                clearInterval(inst.model.stopwatch.watch);
                var $this = $(this);
                var id    = $this.data("reporthdm").id;
                //console.log("mouse leave id -> ", id); 
            });
            $.each(ele.elem, function(j, subele) {
                var $subele = _xpathEvaluate(subele.path);
                $subele.mouseenter(function() {
                    var $this = $(this);
                    var id    = $this.data("reporthdm").id;
                    var conid    = $this.data("reporthdm").conid;
                    console.log("mouse enter sub ele id -> ", id);
                    inst.model.elem[conid].elem[id].enter++;
                });
            });
        });
      	      
      	//Expose:
        console.log(inst);
    };
    var _createMat = function(rows, cols, defaultValue){
        var inst = this;
        var arr = [];
        // Creates all lines:
        for(var i=0; i < rows; i++){
            // Creates an empty line
            arr.push([]);
            // Adds cols to the empty line:
            arr[i].push( new Array(cols));
            for(var j=0; j < cols; j++){
                // Initializes:
                arr[i][j] = defaultValue;
            }
        }
        return arr;
    };
    var _getRatioBasedGridAndPosition = function(e, id) {
        //calculate sub grid mouse position:
        var inst = this;
        var eleOffset = e.offset(); 
        var relX = inst.model.page.mousePos.x - eleOffset.left;
        var relY = inst.model.page.mousePos.y - eleOffset.top;
        
        var baseCellsize = { 
            x : Math.round(inst.model.elem[id].baseSize.width / inst.model.elem[id].grid.col),
            y : Math.round(inst.model.elem[id].baseSize.height / inst.model.elem[id].grid.row)
        };
        var newRatioSize = {
            x : inst.model.elem[id].baseSize.width / e.outerWidth(),
            y : inst.model.elem[id].baseSize.height / e.outerHeight()
        };
        var targetCell = {
            col : Math.floor((relX / baseCellsize.x) * newRatioSize.x),
            row : Math.floor((relY / baseCellsize.y) * newRatioSize.y)
        };
        targetCell.col = targetCell.col < 0 ? 0 : targetCell.col;
        targetCell.col = targetCell.col > inst.model.elem[id].grid.col ? inst.model.elem[id].grid.col : targetCell.col;
        targetCell.row = targetCell.row < 0 ? 0 : targetCell.row;
        targetCell.row = targetCell.row > inst.model.elem[id].grid.row ? inst.model.elem[id].grid.row : targetCell.row;
        return {
            baseCellsize : baseCellsize,
            newRatioSize : newRatioSize,
            targetCell   : targetCell  
        };
    };
    var _isFunction = function(f) {
        var getType = {};
        return f && getType.toString.call(f) === '[object Function]';
    };
    var _getXPathTo = function(element) {
        if (element.id!=='')
            return 'id("'+element.id+'")';
        if (element===document.body)
            return element.tagName;

        var ix= 0;
        var siblings= element.parentNode.childNodes;
        for (var i= 0; i<siblings.length; i++) {
            var sibling= siblings[i];
            if (sibling===element)
                return _getXPathTo(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';
            if (sibling.nodeType===1 && sibling.tagName===element.tagName)
                ix++;
        }
    };
    var _getSelectedText = function() {
        if (window.getSelection) {
            return window.getSelection().toString();
        } else if (document.selection) {
            return document.selection.createRange().text;
        }
        return false;
    };
    var _matrixMax = function(id) {
        var inst = this;    
        var max = 0;
        for (var i = 0; i < inst.model.elem[id].grid.obj.length; i++) {
            for (var j = 0; j < inst.model.elem[id].grid.obj.length; j++) {
                if (inst.model.elem[id].grid.obj[i][j] > max) {
                   max = inst.model.elem[id].grid.obj[i][j];
                }
            }
        }
        return max;
    };
    var _createSvg = function(tagName) {
        var svgNS = "http://www.w3.org/2000/svg";
        return document.createElementNS(svgNS, tagName);
    };
    var _xpathEvaluate = function (xpathExpression) {
        // Evaluate xpath and retrieve matching nodes
        var xpathResult = $(document)[0].evaluate(xpathExpression, $(document)[0], null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var result = [];
        while (elem = xpathResult.iterateNext())
            result.push(elem);
        var $result = $([]).pushStack( result );
        return $result;
    }
    var _findAndReplace = function(searchText, replacement, searchNode) {
        if (!searchText || typeof replacement === 'undefined') {
            // Throw error here if you want...
            return;
        }
        var regex;
        var fla
        if (typeof searchText === "string") {
            regex = new RegExp("(" + searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ")", 'g');
        } else {
            regex = new RegExp(
                "((" + searchText[0].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ").{0,}" +
                "(" + searchText[2].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + "))"
            , 'g');
        }
        var childNodes = (searchNode || document.body).childNodes,
            cnLength = childNodes.length,
            excludes = 'html,head,style,title,link,meta,script,object,iframe';
        while (cnLength--) {
            var currentNode = childNodes[cnLength];
            if (currentNode.nodeType === 1 &&
                (excludes + ',').indexOf(currentNode.nodeName.toLowerCase() + ',') === -1) {
                arguments.callee(searchText, replacement, currentNode);
            }
            if (currentNode.nodeType !== 3 || !regex.test(currentNode.data) ) {
                continue;
            }
            var parent = currentNode.parentNode,
                frag = (function(){
                    var html = currentNode.data.replace(regex, replacement),
                        wrap = document.createElement('div'),
                        frag = document.createDocumentFragment();
                    wrap.innerHTML = html;
                    while (wrap.firstChild) {
                        frag.appendChild(wrap.firstChild);
                    }
                    return frag;
                })();
            parent.insertBefore(frag, currentNode);
            parent.removeChild(currentNode);
        }
    }
    //The proto:
    Hdm.prototype = {

        defaults : {
          map : {
              containers    : ["nav","section","footer"],
              elements      : ["a","img","h1", "h2", "h3", "h4", "h5", "h6", "h7", "input", "button"],
              resolution    : 5,
              reportSpeed   : 50
          },
          drawing : {
              heat : {
                maxOpacity : 0.7,
                colorRgb  : [255, 0, 0]
              },
              overlay : {
                  gridStroke : "gray",
                  gridOpacity : "0.3"
              }
          }
        },
        init: function() {
            this.config = $.extend({}, this.defaults, this.options, this.metadata);
            _set.call(this);
            return this;
        },
      	drawGrid : function(of) {
            
          	var inst = this;
        
            //Get params:
            var max  = _matrixMax.call(inst, of);
            var heatUnit = max > 0 ? inst.config.drawing.heat.maxOpacity / max : 0;
            var curCellSize = {
                x : inst.model.elem[of].e.outerWidth() / inst.model.elem[of].grid.col,
                y : inst.model.elem[of].e.outerHeight() / inst.model.elem[of].grid.row
            };
            var calc = _getRatioBasedGridAndPosition.call(inst, inst.model.elem[of].e, of);
            console.log(
                "max matrix: " + max,
                "max heatUnit: " + heatUnit,
                "Current Cell Size -> x:" + curCellSize.x + " y:" + curCellSize.y,
                calc
            );
            
            //Create canvas to dom with the needed sizes:
            var $can = $("<canvas />").css({ position: "absolute", top:0, left:0, "z-index" :1000 });
            console.log(inst.model.elem[of].e.css("position"));
            if (inst.model.elem[of].e.css("position") === "static") {
                inst.model.elem[of].e.css("position","relative").data("hdmrevert","static");
            } else {
                inst.model.elem[of].e.data("hdmrevert","static");
            }
            inst.model.elem[of].e.append($can);
            var canvas = $can[0];
            var ctx = canvas.getContext('2d');
            ctx.canvas.width  = inst.model.elem[of].e.outerWidth();
            ctx.canvas.height = inst.model.elem[of].e.outerHeight();
            
            //Draw Svg:
            var grider = _createSvg("svg");
            grider.setAttribute("width", "100%");
            grider.setAttribute("height", "100%");
            
            var defs = _createSvg("defs");
            
            var patternSmall = _createSvg("pattern");
            patternSmall.setAttribute("id", "smallGrid");
            patternSmall.setAttribute("width", curCellSize.x + "");
            patternSmall.setAttribute("height", curCellSize.y + "");
            patternSmall.setAttribute("patternUnits", "userSpaceOnUse");
            
            var pathSmall = _createSvg("path");
            pathSmall.setAttribute("d", "M " + curCellSize.x + " 0 L 0 0 0 " + curCellSize.y);
            pathSmall.setAttribute("fill", "none");
            pathSmall.setAttribute("stroke", inst.config.drawing.overlay.gridStroke);
            pathSmall.setAttribute("stroke-width", inst.config.drawing.overlay.gridOpacity);
            
            var whiteRect = _createSvg("rect");
            whiteRect.setAttribute("fill", "rgba(255,255,255,0.1)");
            whiteRect.setAttribute("width", "100%");
            whiteRect.setAttribute("height", "100%");
            
            var bigRect = _createSvg("rect");
            bigRect.setAttribute("fill", "url(#smallGrid)");
            bigRect.setAttribute("width", "100%");
            bigRect.setAttribute("height", "100%");
        
            patternSmall.appendChild(pathSmall)
            defs.appendChild(patternSmall)
            grider.appendChild(defs);
            grider.appendChild(whiteRect);
            grider.appendChild(bigRect);
            
            //Create heat:
            for (var i = 0; i < inst.model.elem[of].grid.obj.length; i++) {
                for (var j = 0; j < inst.model.elem[of].grid.obj.length; j++) {
                    var cellval = inst.model.elem[of].grid.obj[i][j];
                    if (cellval > 0) {
                        var box = _createSvg("rect");
                        box.setAttribute("width", curCellSize.x);
                        box.setAttribute("height", curCellSize.y);
                        box.setAttribute("x", curCellSize.x * i);
                        box.setAttribute("y", curCellSize.y * j);
                        box.setAttribute("fill", "rgba(" + (inst.config.drawing.heat.colorRgb.join(",")) + "," + (cellval * heatUnit) +")");
                        grider.appendChild(box);
                    }
                }
            }
            
            
            //Draw to container:
            var DOMURL = window.URL || window.webkitURL || window;
            var img = new Image();
            var svgData = new XMLSerializer().serializeToString(grider);
            var svg = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            var url = DOMURL.createObjectURL(svg);
            
            img.onload = function () {
              ctx.drawImage(img, 0, 0);
              DOMURL.revokeObjectURL(url);
            }
            img.src = url;
            
            //Draw the sub elements shadows:
            var maxSub = 0;
            var subOpacityUnit = 0;
            for (var i = 0; i < inst.model.elem[of].elem.length; i++) {
                if (inst.model.elem[of].elem[i].enter > maxSub)
                    maxSub = inst.model.elem[of].elem[i].enter;
            }
            subOpacityUnit = maxSub > 0 ? 0.8 / maxSub : 0;
            console.log(maxSub, subOpacityUnit);
            for (var i = 0; i < inst.model.elem[of].elem.length; i++) {
                console.log(inst.model.elem[of].elem[i].path);
                var $tar = _xpathEvaluate(inst.model.elem[of].elem[i].path);
                console.log($tar);
                $tar.css({ outline : "rgba(0,0,255," + (subOpacityUnit * inst.model.elem[of].elem[i].enter) + ")", outlineStyle : "solid", outlineWidth : "5px"});
            }
        }
    };
    
    Hdm.defaults = Hdm.prototype.defaults;
    
    $.fn.hdm = function(opt) {
        var options = opt || {};
        this.each(function(index, ele) {
            var inst = new Hdm(ele, options).init();
            $(ele).data("hdm", inst);
        });
    };
    
}(jQuery, window, document));

$(function(){
    
  $(document).hdm();
    
});
