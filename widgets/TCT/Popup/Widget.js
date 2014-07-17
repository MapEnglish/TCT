define(['dojo/_base/declare', 'jimu/BaseWidget', "dojo/_base/lang", 
  "dijit/layout/ContentPane","dijit/registry","dijit/layout/BorderContainer",
  "dojo/dom-style", 'dojo/_base/html', 'jimu/PanelManager', 'jimu/WidgetManager','dojo/_base/array', 'jimu/dijit/Popup',
  "dojox/mobile/Carousel",
    "dojox/mobile/CarouselItem",
    "dojox/mobile/SwapView",
    "dojox/mobile",
    "dojox/mobile/parser"],
function(declare, BaseWidget, lang, ContentPane, registry, BorderContainer, domStyle, html, PanelManager, WidgetManager,array,Popup,
  Carousel, CarouselItem, SwapView) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here 

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-demo',

    name: 'Demo',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
      this.numFeatures = 0;
      //this.map.infoWindow.set("popupWindow", false);
      //parser.parse();
    },

    startup: function() {
      this.inherited(arguments);

      //set the background images on the navbar - for multiple selected features
      domStyle.set(this.btnSelectPrevious,"background-image","url(" + this.folderUrl + "images/previous.png)");
      domStyle.set(this.btnSelectNext,"background-image","url(" + this.folderUrl + "images/next.png)");
      html.setStyle(this.multipleFeaturesNode, {display: 'none'});
      html.setStyle(this.btnPhotos, {display: 'none'});
      html.setStyle(this.btnPhotosPopup, {display: 'none'});

      //create a contentpane to hold infoWindow content object
      console.log('startup');
      this.cp = new ContentPane();
      this.cp.startup();

      // 1st time widget loads, is there a selected feature?
      if (this.map.infoWindow.getSelectedFeature() !== undefined)
      {
          this.displayPopupContent(this.map.infoWindow.getSelectedFeature());
          this.featuresSelected.innerHTML = this.map.infoWindow.features.length +  " " + this.nls.featuresSelected;
      }

      this.map.infoWindow.on("selection-change", lang.hitch (this,function() {

        if (this.map.infoWindow.features === null)
        {
          this.clearContent();
        }
        else
        {
          this.displayPopupContent(this.map.infoWindow.getSelectedFeature());
        }
            
      }));

      //Wait for all features to load in the infowindow before counting them
      this.map.infoWindow.on("set-features", lang.hitch (this,function() {
        if (this.map.infoWindow.features !== null){
          //console.log("set-features: " + this.map.infoWindow.features.length);
          this.featuresSelected.innerHTML = this.map.infoWindow.features.length +  " " + this.nls.featuresSelected;
        }
      }));

       //look for the shared widget that will contain popup info
        this.panelManager = PanelManager.getInstance();
        this.widgetManager = WidgetManager.getInstance();
        var sharedWidgetFound = array.some(this.widgetManager.appConfig.widgetPool.widgets, lang.hitch(this, function(widget) {
  
          if (widget.label === this.config.TCT.sharedWidget) {
            //console.log(widget)
            this.sharedWidget = widget;
            return true;
          }
        }));

    },

    onOpen: function(){
      console.log('onOpen');

      if (this.map.infoWindow.getSelectedFeature() !== undefined)
      {
          domStyle.set(this.messageNode, "display", "none");
      }
      else
      {
        domStyle.set(this.messageNode, "display", "block");
      }
      
    },

    onClose: function(){
      console.log('onClose');

      if (this.showPhotosClicked === true)
      {
        this.showPhotosClicked = false;
        return;
      }
      this.map.infoWindow.clearFeatures();

      this.clearContent();
      

    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    },

    displayPopupContent: function(feature){
      if (feature){
        html.setStyle(this.btnPhotos, {display: 'inline-block'});
        domStyle.set(this.messageNode, "display", "none");
        
        var fullPosition = registry.byId(this.id + "_panel").getFullPosition();
        if (fullPosition.width !== "100%")
          html.setStyle(this.btnPhotosPopup, {display: 'inline-block'});

        var content = feature.getContent();
        //console.log(content);

        if (this.map.infoWindow.features.length > 1)
        {
          html.setStyle(this.multipleFeaturesNode, {display: 'block'});

          //html.setStyle(this.multipleFeaturesNode, {visibility: 'visible'});
          //domStyle.set(this.featuresSelected, "visibility", "visible");
          //domStyle.set(this.navBar, "visibility", "visible");
          //this.featuresSelected.innerHTML = this.map.infoWindow.features.length +  " " + this.nls.featuresSelected; //content.innerHTML;
        }
        else
        {
          html.setStyle(this.multipleFeaturesNode, {display: 'none'});
          //html.setStyle(this.multipleFeaturesNode, {visibility: 'hidden'});
          //domStyle.set(this.featuresSelected, "visibility", "hidden");
          //domStyle.set(this.navBar, "visibility", "hidden");
        }
        
        this.mapIdNode.appendChild(this.cp.domNode);
        this.cp.set("content", content);

      }
    },
    resize: function() {
        var fullPosition = registry.byId(this.id + "_panel").getFullPosition();
        if (fullPosition.width === "100%")
        {
            //console.log('transparent');
            html.setStyle(this.btnPhotosPopup, {display: 'none'});
        }
        else
        {
            //console.log('opaque');
            html.setStyle(this.btnPhotosPopup, {display: 'inline-block'});
        }

    },

    selectPrevious: function (event){
      //console.log("selectPrevious");
      this.map.infoWindow.selectPrevious();
      //this.map.infoWindow.selectNext();
    },
     selectNext: function (event){
      //console.log("selectNext");
      this.map.infoWindow.selectNext();
    },
    clearContent: function(){
      domStyle.set(this.messageNode, "display", "block");
      this.mapIdNode.innerHTML = "";
      html.setStyle(this.multipleFeaturesNode, {display: 'none'});
      html.setStyle(this.btnPhotos, {display: 'none'});
      html.setStyle(this.btnPhotosPopup, {display: 'none'});
    },
    showPhotos: function(){
      this.showPhotosClicked = true;
      console.log("showPhotos");
      this.panelManager.showPanel(this.sharedWidget);
    },
    showPhotosInPopup: function(){
      //console.log("Popup Photos");

      var feature = this.map.infoWindow.getSelectedFeature();
      var popup = new Popup({
              content: '<div id="carousel1"></div>',
              titleLabel: "Photos"
      });

      var carouselTitle = feature.attributes[feature._layer.displayField];
      var view, item;
        var carousel1 = new Carousel({
            height:"300px",
            navButton:true,
            numVisible:2,
            title: carouselTitle
        }, "carousel1");

        // View #1
        view = new SwapView();
        carousel1.addChild(view);

        item = new CarouselItem({src:"images/EdmontonOffice.jpg", value:"dish", headerText:"dish"});
        item.placeAt(view.containerNode);

        item = new CarouselItem({src:"images/CalgaryOffice.jpg", value:"glass", headerText:"glass"});
        item.placeAt(view.containerNode);

        // View #2
        view = new SwapView();
        carousel1.addChild(view);

        item = new CarouselItem({src:"images/LondonOffice.jpg", value:"stone", headerText:"stone"});
        item.placeAt(view.containerNode);

        item = new CarouselItem({src:"images/OttawaOffice.jpg", value:"shell", headerText:"shell"});
        item.placeAt(view.containerNode);

        carousel1.startup();

        popup.domNode.appendChild(carousel1.domNode);

    }

  });
});