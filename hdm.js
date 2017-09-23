/********** TODO *****************************************

*********************************************************/

;(function ($, window, document, undefined) {

    // constructor
    var Formi = function (element, options) {
        this.ele 		= element;
        this.$ele 		= $(element);
        this.options 	= options;
        this.metadata 	= this.$ele.data('options');
      	this.model = {
          header : {
            ele 	: null,
            title 	: { text:"", ele : null },
            desc    : { text:"", ele : null },
            iconBar : {
            	icons 		: [],
                ele 		: null,
                arrow       : null
            }
          },
          pages 	: [],
          allPages  : null,
          pagesCon  : null,
          curPage   : 0,
          animating : false,
          buttons 	: {
             ele    : null,
             next 	: null,
             prev 	: null,
             submit : null,
             reset 	: null
          },
          theme : {
           	 colorsMap : {
              	 red 		: "#d6422c",
                 green 		: "#7ac673",
                 truegreen 	: "#34a853",
                 grey 		: "#ddd",
                 blue 		: "#27aae0",
                 darkblue 	: "#4c6972",
                 orange 	: "#f97352",
                 yellow 	: "#faaf40",
                 black 		: "#4a4948",
                 pink 		: "#e05363",
                 purple 	: "#8A2BE2"
             }
          }
        };
    }
    
    //Private methods:
    var _set = function() {
        var inst = this;
      	
      	//Get Header:
        inst.model.header.ele = inst.$ele.find(".formi-header");
      	if (inst.model.header.ele.length) {
          inst.model.header.title.ele = inst.model.header.ele.find("h3");
          inst.model.header.title.text = inst.model.header.title.ele.text();
          inst.model.header.desc.ele = inst.model.header.ele.find(".formi-desc");
          inst.model.header.desc.text = inst.model.header.desc.ele.text();
          //Set icon container:
          if (inst.config.headerIcons) {
            inst.model.header.iconBar.ele = $("<div class='formi-iconbar'><div></div></div>");
            inst.model.header.ele.append(inst.model.header.iconBar.ele);
            inst.model.header.iconBar.ele = inst.model.header.iconBar.ele.find("div");
            inst.model.header.iconBar.arrow = $("<div class='formi-arrow' />");
            inst.$ele.find(".formi-body").prepend(inst.model.header.iconBar.arrow);
          }
        }
      
      	//Get & Set buttons:
        inst.model.buttons.ele = inst.$ele.find(".formi-buttons");
      	inst.model.buttons.next = inst.model.buttons.ele.find(".formi-but-next");
        inst.model.buttons.prev = inst.model.buttons.ele.find(".formi-but-prev");
        inst.model.buttons.reset = inst.model.buttons.ele.find(".formi-but-reset");
        inst.model.buttons.submit = inst.model.buttons.ele.find(".formi-but-submit");
      
        //Get Pages:
      	inst.model.allPages = inst.$ele.find("ul.formi-sections > li");
        inst.model.allPages.each(function(i,p) {
          var $page = $(p);
          inst.model.pages.push({
          	index : i,
            page : $page,
            icon : $page.data("icon"),
            height : $page.outerHeight()
          });
        });
      
      	//Build Header Icons Nav:
      	_buildIconBar.call(inst);
      	
      	//Parse Required:
      	_addRequired.call(inst);
      
      	//Set the Form area:
      	inst.model.pagesCon = inst.$ele.find(".formi-sections");
      	inst.model.pagesCon.css({ 
          maxHeight : inst.config.maxFormHeight || "none",
          minHeight : inst.config.minFormHeight || "0",
          height : inst.model.pages[0].height
        });
      	
      	//Build Header Icons Nav:
      	_attachControls.call(inst);
      	
      	//Render Theme:
      	_themerender.call(inst);
      
      	//Display First:
      	inst.showPage(inst.config.first);
      
      	//Expose:
        //console.log(inst);
    };
  	var _addRequired = function() {
      	var inst = this;
      	if (inst.config.autoRequired != true) return;
      	var fields = inst.$ele.find("input,textarea,select").filter('[required]');
      	$.each(fields, function(i, ele) {
        	var $ele = $(ele);
          	var $label = $ele.prev("label");
          	if ($label.length) {
              $label.append($("<em class='formi-required-char'>" + inst.config.requiredChar + "</em>"));
            }
        });
    };
    var _buildIconBar = function() {
      var inst = this;
      $.each(inst.model.pages, function(i, p){
          if (typeof p.icon != "string") { 
              inst.model.pages[i].icon = inst.config.defaultIcon;
          }
          inst.model.header.iconBar.icons.push(
            $("<div><span class='glyphicon glyphicon-" + inst.model.pages[i].icon + "' aria-hidden='true'></span></div>")
            .css({ 
              "fontSize" : inst.config.headerIconsSize, 
              "color" : _translateColor(inst, inst.config.headerIconsColor.incomplete)
            })
          );
          inst.model.header.iconBar.ele.append(
            inst.model.header.iconBar.icons[i]
          );
      });
    };
  	var _themerender = function() {
      	var inst = this;
      	//Theme Color:
      	if (inst.config.theme.color) {
         	var theThemeColor = _translateColor(inst, inst.config.theme.color);
          	if (inst.model.header.title.ele.length) {
              	inst.model.header.title.ele.css({ backgroundColor : theThemeColor });
              	inst.model.pagesCon.closest(".formi-body")
                  	.css("border-top-color", theThemeColor)
                	.css("border-bottom-color", theThemeColor);
            }
          	if (inst.config.headerIcons) {
              inst.model.header.iconBar.arrow.css("border-bottom-color", theThemeColor)
            }
        }
      	//Text Color:
      	if (inst.config.theme.text.header && inst.model.header.title.ele.length) {
          console.log("in",_translateColor(inst, inst.config.theme.text.header));
          	inst.model.header.title.ele
              .css("color",_translateColor(inst, inst.config.theme.text.header));
        }
      	if (inst.config.theme.text.desc && inst.model.header.desc.ele.length) {
          	inst.model.header.desc.ele
              .css("color",_translateColor(inst, inst.config.theme.text.desc));
        }
      	if (inst.config.theme.text.labels && inst.model.pagesCon.length) {
          	inst.model.pagesCon.find("label")
              .css("color",_translateColor(inst, inst.config.theme.text.labels));
        }
      	//Buttons:
      	if (inst.config.theme.buttons.next && inst.model.buttons.next.length)
          	inst.model.buttons.next
              .addClass("btn-" + inst.config.theme.buttons.next);
      	if (inst.config.theme.buttons.prev && inst.model.buttons.prev.length)
          	inst.model.buttons.prev
              .addClass("btn-" + inst.config.theme.buttons.prev);
        if (inst.config.theme.buttons.reset && inst.model.buttons.reset.length)
          	inst.model.buttons.reset
              .addClass("btn-" + inst.config.theme.buttons.reset);
        if (inst.config.theme.buttons.submit && inst.model.buttons.submit.length)
          	inst.model.buttons.submit
              .addClass("btn-" + inst.config.theme.buttons.submit);
    };
    var _translateColor = function(inst, color) {
        var color_test = color.replace('-', "");
      	if ( inst.model.theme.colorsMap.hasOwnProperty(color_test) ) {
            return inst.model.theme.colorsMap[color_test];
        }
      	return color;
    };
    var _isFunction = function(f) {
        var getType = {};
        return f && getType.toString.call(f) === '[object Function]';
    }
    var _attachControls = function() {
      	var inst = this;
      
      	if (inst.model.buttons.next.length) {
          	inst.model.buttons.next.click(function(){
                if (inst.model.animating) return;
            	var plug = $(this).closest("form.formi").data("formi");
                var next = plug.model.curPage + 1;
              	if (next >= plug.model.pages.length) next = 0;
                $.when(inst.config.actions.buttons.nextBef()).then(function(){
                    plug.showPage(next, inst.config.actions.buttons.nextCb, inst.model.buttons.next);
                });
            });
        }
      	if (inst.model.buttons.prev.length) {
          	inst.model.buttons.prev.click(function(){
                if (inst.model.animating) return;
            	var plug = $(this).closest("form.formi").data("formi");
                var prev = plug.model.curPage - 1;
              	if (prev < 0) prev = plug.model.pages.length - 1;
                $.when(inst.config.actions.buttons.prevBef()).then(function(){
              	     plug.showPage(prev, inst.config.actions.buttons.prevCb, inst.model.buttons.prev);
                });
            });
        }
      	if (inst.model.buttons.reset.length) {
          
        }
      	if (inst.model.buttons.submit.length) {
          
        }
    };
    //The proto:
    Formi.prototype = {

        defaults : {
          headerIcons : true,
          headerIconsSize : "45px",
          defaultIcon : "star",
          headerIconsColor : { 
            incomplete : "#C8A8E8", 
            invalid : "#f0a19e", 
            done : "purple" 
          },
          actions : {
              buttons : {
                  nextCb    : function(e) { console.log(this, e, "next press cb");   },
                  prevCb    : function(e) { console.log(this, e, "next press cb");   },
                  resetCb   : function(e) { console.log(this, e, "next press cb");   },
                  submitCb  : function(e) { console.log(this, e, "next press cb");   },
                  nextBef    : function(e) { console.log(this, e, "next press bef"); },
                  prevBef    : function(e) { console.log(this, e, "next press bef"); },
                  resetBef   : function(e) { console.log(this, e, "next press bef"); },
                  submitBef  : function(e) { console.log(this, e, "next press bef"); }
              }
          },
          theme : {
          	color : "purple",
            text : {
              header : "white",
              desc   : "black",
              labels : "red"
            },
            buttons : {
             	reset : "orange",
                next  : "purple",
                prev  : "purple",
                submit : "true-green",
       
            }
          },
          maxFormHeight : "300px",
          minFormHeight : false,
          first			: 0,
          autoRequired  : true,
          requiredChar	: "*",
        },
        init: function() {
            this.config = $.extend({}, this.defaults, this.options, this.metadata);
            _set.call(this);
            return this;
        },
      	showPage : function(i, _cb, _e) {
          	var inst = this;
            var cb = _isFunction(_cb) ? _cb : false;
            var e = _e || null;
          	if (inst.model.pages.length <= i) return;
          	inst.model.animating = true;
          	inst.model.allPages.not(inst.model.pages[inst.model.curPage].page).hide();
          	inst.model.pages[inst.model.curPage].page.fadeOut(function(){
            	inst.model.pages[i].page.fadeIn(600,function(){
                	inst.model.animating = false;
                    //Call CB
                    if (cb !== false) {
                        cb.call( inst, e );
                    }
                });
              	inst.setDim(i);
              	inst.slideIconBar(i);
            });
          	inst.model.curPage = i;
        },
      	setDim :function(i) {
          	var inst = this;
          	if (inst.model.pages.length <= i) return;
            inst.model.pagesCon.animate({ height:inst.model.pages[i].height }, 400);
        },
      	slideIconBar : function(i) {
          var inst = this;
          if (inst.model.pages.length <= i) return;
          if (!inst.config.headerIcons) return;
          var $icon = inst.model.header.iconBar.icons[i];
          var rightIcon = ($icon.outerWidth() * (i + 1)),
          	  midIcon   = ($icon.outerWidth() / 2),
              midArrow  = (inst.model.header.iconBar.arrow.outerWidth() / 2);
          var theLeft = rightIcon - midIcon - midArrow;
          inst.model.header.iconBar.arrow.css({ left : theLeft });
        }
    };
    
    Formi.defaults = Formi.prototype.defaults;
    
    $.fn.formi = function(opt) {
        var options = opt || {};
        this.each(function(index, ele) {
            var inst = new Formi(ele, options).init();
            $(ele).data("formi", inst);
        });
    };
    
}(jQuery, window, document));

$(function(){
    
  $(".formi").formi();
    
});
