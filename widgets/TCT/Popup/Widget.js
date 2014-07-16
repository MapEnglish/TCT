define(['dojo/_base/declare', 'jimu/BaseWidget', "dojo/_base/lang", 
  "dijit/layout/ContentPane","dijit/registry","dijit/layout/BorderContainer",
  "dojo/dom-style", 'dojo/_base/html', 'jimu/PanelManager', 'jimu/WidgetManager','dojo/_base/array'],
function(declare, BaseWidget, lang, ContentPane, registry, BorderContainer, domStyle, html, PanelManager, WidgetManager,array) {
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
        html.setStyle(this.btnPhotos, {display: 'inline'});
        domStyle.set(this.messageNode, "display", "none");

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
    },
    showPhotos: function(){
      this.showPhotosClicked = true;
      console.log("showPhotos");
      this.panelManager.showPanel(this.sharedWidget);
    }

  });
});