define(['dojo/_base/declare', 'jimu/BaseWidget', "dojo/_base/lang", 
  "dijit/layout/ContentPane","dijit/registry","dijit/layout/BorderContainer",
  "dojo/dom-style"],
function(declare, BaseWidget, lang, ContentPane, registry, BorderContainer, domStyle) {
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
      //this.map.infoWindow.set("popupWindow", false);
      //parser.parse();
    },

    startup: function() {
      this.inherited(arguments);
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      console.log('startup');
      this.cp = new ContentPane();
      this.cp.startup();
      //this.mapIdNode.appendChild(this.cp.domNode);

      if (this.map.infoWindow.getSelectedFeature() !== undefined)
      {
        this.displayPopupContent(this.map.infoWindow.getSelectedFeature());
      }

      this.map.infoWindow.on("selection-change", lang.hitch (this,function() {
        console.log("selection-change");
        //console.log(this.map.infoWindow.getSelectedFeature());
        this.displayPopupContent(this.map.infoWindow.getSelectedFeature());
        //this._getPopupPrintContents();
        //listen to this event and display directions link if selected feature has the required attributes
        //this._displayDirectionsLinkInPopup();
     
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
      this.map.infoWindow.clearFeatures();
      this.mapIdNode.innerHTML = "";

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

        domStyle.set(this.messageNode, "display", "none");

        var content = feature.getContent();
        console.log(content);
        //registry.byId(this.id).set("content", content);
        this.mapIdNode.innerHTML = ""; //content.innerHTML;
        //var cp = new ContentPane();
        //cp.startup();
        this.mapIdNode.appendChild(this.cp.domNode);
        this.cp.set("content", content);
        //this.popupNode.set("content", content);
        //this.set("content", content);
      }
    }
  });
});