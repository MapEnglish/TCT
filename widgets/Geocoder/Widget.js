///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'jimu/BaseWidget',
    "esri/dijit/Geocoder",
    'dojo/_base/html',
    'dojo/on',
    'dojo/_base/lang',
    'dojo/Deferred',
    'jimu/portalUtils',
    'jimu/dijit/Message',
    'jimu/PanelManager',
    'jimu/WidgetManager'
  ],
  function(
    declare, array, BaseWidget, Geocoder,
    html, on, lang, Deferred, portalUtils, Message, PanelManager, WidgetManager) {
    var clazz = declare([BaseWidget], {

      name: 'Geocoder',
      baseClass: 'jimu-widget-geocoder',

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        this._initGeocoder();

        this.panelManager = PanelManager.getInstance();
        this.widgetManager = WidgetManager.getInstance();
        var a = array.some(this.widgetManager.appConfig.widgetPool.widgets, lang.hitch(this, function(widget) {
  
          if (widget.label === this.config.TCT.sharedWidget) {
            //console.log(widget)
            this.sharedWidget = widget;
            return true;
          }
        })); 


      },

      _initGeocoder: function() {
        //MATT
       // this._getGeocoders(this.appConfig.portalUrl).then(lang.hitch(this, function() {
          var json = this.config.geocoder;
          json.map = this.map;

          var geocoder = new Geocoder(json);

          if (this.config.geocoder.arcgisGeocoder.autoComplete === false)
          {
            on(geocoder, 'select', lang.hitch(this, "findComplete"));
          }
          else
          {
            on(geocoder, 'find-results', lang.hitch(this, "findResults"));
          }
         

          html.place(geocoder.domNode, this.domNode);
          geocoder.startup();
          /*
        }), lang.hitch(this, function(err) {
          console.error(err);
        }));*/
      },

      _getGeocodeName: function(geocodeUrl) {
        if (typeof geocodeUrl !== "string") {
          return "geocoder";
        }
        var strs = geocodeUrl.split('/');
        return strs[strs.length - 2] || "geocoder";
      },

      _getGeocoders: function(portalUrl) {
        var geoDef = new Deferred();

        if (this.config.geocoder && this.config.geocoder.geocoders && this.config.geocoder.geocoders.length) {
          geoDef.resolve('success');
          return geoDef;
        }
        portalUtils.getPortalSelfInfo(portalUrl).then(lang.hitch(this, function(response) {
          var geocoders = response.helperServices && response.helperServices.geocode;
          var portalGeocoders = [];
          if (geocoders && geocoders.length > 0) {
            for (var i = 0, len = geocoders.length; i < len; i++) {
              var geocode = geocoders[i];

              if (geocode.url.indexOf(this.defaultGeocodeUrl) >= -1) {
                geocode.singleLineFieldName = geocode.singleLineFieldName || "SingleLine";
                geocode.name = geocode.name || "Esri World Geocoder";
              }
              if (!geocode.singleLineFieldName) {
                continue;
              }

              var json = {
                name: geocode.name || this._getGeocodeName(geocode.url),
                url: geocode.url,
                singleLineFieldName: geocode.singleLineFieldName,
                placeholder: geocode.placeholder || geocode.name || this._getGeocodeName(geocode.url)
              };
              portalGeocoders.push(json);
            }

            this.config.geocoder.geocoders = portalGeocoders;
            this.config.geocoder.arcgisGeocoder = false;
            geoDef.resolve('success');
          }
        }), lang.hitch(this, function(err) {
          new Message({
            message: this.nls.portalConnectionError
          });
          geoDef.reject('error');
          console.error(err);
        }));

        return geoDef;
      },

      findComplete: function(response) {
        if (response && response.result) {
          var feature = response.result.feature,
            extent = response.result.extent;

          if (feature) {
            this.map.infoWindow.setTitle("Location");
            this.map.infoWindow.setContent(response.result.name || null);
            this.map.infoWindow.show(feature.geometry);
          } else if (extent) {
            this.map.setExtent(extent);
          }

          //Open the shared widget
          if (this.sharedWidget)
          {
            this.panelManager.showPanel(this.sharedWidget); //this.sharedWidgetConfig
          }

        }
      },

      findResults: function(response) {
        console.log(response);

        //Open the shared widget
          if (this.sharedWidget)
          {
            this.panelManager.showPanel(this.sharedWidget); //this.sharedWidgetConfig
          }

          var hydratedSharedWidget = this.widgetManager.getWidgetById(this.sharedWidget.id);
          //Send in the geocode result to use as geometry  
          if (hydratedSharedWidget !== undefined){
            this.publishData(response);
          }
          else
          {
            setTimeout(lang.hitch(this,function() {
              this.publishData(response);
              }), 1000);
          }
          
      }
    });
    return clazz;
  });