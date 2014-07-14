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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/dijit/TabContainer',
    'jimu/dijit/List',
    'jimu/dijit/Message',
    'jimu/utils',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'esri/graphic',
    'esri/geometry/Point',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/PictureMarkerSymbol',
    'esri/geometry/Polyline',
    'esri/symbols/SimpleLineSymbol',
    'esri/geometry/Polygon',
    'esri/symbols/SimpleFillSymbol',
    'esri/toolbars/draw',
    'esri/InfoTemplate',
    'esri/request',
    'dijit/ProgressBar',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/promise/all',
    'dijit/form/Select',
    'dijit/form/TextBox',
    'jimu/dijit/DrawBox',
    'jimu/dijit/LoadingShelter',
    'jimu/PanelManager',
    'jimu/WidgetManager',
    "dijit/registry"

  ],
  function(
    declare, _WidgetsInTemplateMixin, BaseWidget,TabContainer, List, Message, utils, Query, QueryTask, GraphicsLayer, FeatureLayer,
    Graphic, Point, SimpleMarkerSymbol, PictureMarkerSymbol, Polyline, SimpleLineSymbol, Polygon, SimpleFillSymbol, Draw, InfoTemplate,
    esriRequest,ProgressBar, lang, on, html, array, all, Select, TextBox, DrawBox,LoadingShelter, PanelManager,WidgetManager,registry) {/*jshint unused: false*/
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Search',
      baseClass: 'jimu-widget-search',
      resultLayers:[],
      layerIndex1: 0,
      layerIndex2: 0,
      progressBar: null,
      searchResults: null,
      tabContainer: null,
      list: null,

      postCreate:function(){
        this.inherited(arguments);
        this.resultLayers = [];
        this._initTabContainer();
        this._initLayerSelect();
        this._initProgressBar();
        this._initDrawBox();
        this.panelManager = PanelManager.getInstance();
        this.widgetManager = WidgetManager.getInstance();
      },

      onClose: function() {
        this.drawBox.deactivate();
        this._hideInfoWindow();
        this.inherited(arguments);
      },

      destroy:function(){
        if(this.drawBox){
          this.drawBox.destroy();
          this.drawBox = null;
        }
        while(this.resultLayers.length > 0){
          var layer = this.resultLayers[0];
          if(layer){
            this.map.removeLayer(layer);
            this.resultLayers.splice(0,1);
          }
        }
        this.resultLayers = [];
        this._hideInfoWindow();
        this.inherited(arguments);
      },

      onChange1: function(newValue) {
        this.layerIndex1 = newValue;
      },

      onChange2: function(newValue) {
        this.layerIndex2 = newValue;
        this.labelSearchName.textContent = this.config.layers[newValue].textsearchlabel;
        this.inputSearchName.set("placeHolder", this.config.layers[newValue].textsearchhint);
      },

      _initTabContainer:function(){
        this.tabContainer = new TabContainer({
          tabs: [{
            title: this.nls.selectFeatures,
            content: this.tabNode1
          }, {
            title: this.nls.selectByAttribute,
            content: this.tabNode2
          }, {
            title: this.nls.results,
            content: this.tabNode3
          }],
          selected: this.nls.conditions
        }, this.tabSearch);
        this.tabContainer.startup();
        utils.setVerticalCenter(this.tabContainer.domNode);
      },

      _initLayerSelect:function(){
        var options = [];
        var len = this.config.layers.length;
        for (var i = 0; i < len; i++) {
          var option = {
            value:i,
            label:this.config.layers[i].name
          };
          options.push(option);
          if (i === 0) {
            options[i].selected = true;
          }
        }

        if (len > 0) {
          this.selectLayer1.addOption(options);
          this.selectLayer2.addOption(options);
          this.labelSearchName.textContent = this.config.layers[0].textsearchlabel;
          this.inputSearchName.set("placeHolder", this.config.layers[0].textsearchhint);

          if(this.config.shareResult){
            this.shelter.show();
            var defs = array.map(this.config.layers,lang.hitch(this,function(layerConfig){
              var def = esriRequest({
                url:layerConfig.url,
                content:{f:'json'},
                handleAs:'json',
                callbackParamName:'callback',
                timeout:30000
              },{
                useProxy:false
              });
              return def;
            }));
            all(defs).then(lang.hitch(this,function(results){
              this.shelter.hide();
              array.forEach(results,lang.hitch(this,function(response,j){
                response.name = this.nls.searchResult + " : " + response.name;
                var layerConfig = this.config.layers[j];
                var names = array.map(layerConfig.fields.field,lang.hitch(this,function(item){
                  return item.name;
                }));
                var objectIdFieldInfo = (array.filter(response.fields,lang.hitch(this,function(fieldInfo){
                  return fieldInfo.type === 'esriFieldTypeOID';
                })))[0];
                if(objectIdFieldInfo){
                  layerConfig.objectIdField = objectIdFieldInfo.name;
                }
                layerConfig.existObjectId = array.indexOf(layerConfig.objectIdField) >= 0;
                response.fields = array.filter(response.fields,lang.hitch(this,function(fieldInfo){
                  return fieldInfo.type === 'esriFieldTypeOID' || array.indexOf(names,fieldInfo.name) >= 0;
                }));
                layerConfig.fields.field = response.fields;
                var layer = new FeatureLayer({
                  layerDefinition:response,
                  featureSet:null
                });
                this.resultLayers.push(layer);
                this.map.addLayer(layer);
              }));
            }),lang.hitch(this,function(err){
              this.shelter.hide();
              console.error(err);
              for(var j=0;j<this.config.layers.length;j++){
                var layer = new GraphicsLayer();
                this.resultLayers.push(layer);
                this.map.addLayer(layer);
              }
            }));
          }
          else{
            for (var j = 0; j < this.config.layers.length; j++) {
              var layer = new GraphicsLayer();
              this.resultLayers.push(layer);
              this.map.addLayer(layer);
            }
          }
        }
        this.own(on(this.selectLayer1, "change", lang.hitch(this, this.onChange1)));
        this.own(on(this.selectLayer2, "change", lang.hitch(this, this.onChange2)));
      },

      _initProgressBar:function(){
        this.progressBar = new ProgressBar({
          indeterminate: true
        }, this.progressbar);
        html.setStyle(this.progressBar.domNode,'display','none');
      },

      _initDrawBox:function(){
        this.drawBox.setMap(this.map);
        this.own(on(this.drawBox,'DrawEnd',lang.hitch(this,function(graphic){
          this.map.enableMapNavigation();
          this.search(graphic.geometry, this.layerIndex1);
        })));
        this.own(on(this.btnClear, "click", lang.hitch(this, this.clear)));
      },

      onSearch: function(geocodedContent) {
       this.search(null, this.layerIndex2, geocodedContent);
      },

      search: function(geometry, layerIndex, geocodedContent) {
        if(!this.config.layers){
          return;
        }
        if(this.config.layers.length === 0){
          return;
        }
        var content;
        var query = new Query();
        this.list.clear();
        this.tabContainer.selectTab(this.nls.results);

        if (geometry) {
          query.geometry = geometry;
        } else {
          this._clearLayers();
          //content = this.inputSearchName.value.toUpperCase();

          content = geocodedContent ? geocodedContent.toUpperCase() : this.inputSearchName.value.toUpperCase();
          if (!content || !this.config.layers.length) {
            return;
          }
          var where = this.config.layers[layerIndex].expression;
          where = where.replace(/\[value\]/gi, content);
          query.where = where;
        }

        html.setStyle(this.progressBar.domNode,'display','block');
        html.setStyle(this.divResult,'display','none');
        var fields = [];
        if (this.config.layers[layerIndex].fields.all) {
          fields[0] = "*";
        } else {
          for (var i = 0, len = this.config.layers[layerIndex].fields.field.length; i < len; i++) {
            fields[i] = this.config.layers[layerIndex].fields.field[i].name;
          }
        }
        var url = this.config.layers[layerIndex].url;
        query.outSpatialReference = this.map.spatialReference;
        query.returnGeometry = true;
        query.outFields = fields;
        var queryTask = new QueryTask(url);
        queryTask.execute(query, lang.hitch(this, this._onSearchFinish, layerIndex), lang.hitch(this, this._onSearchError));
      },

      clear: function() {
        this._hideInfoWindow();
        this._clearLayers();
        this.list.clear();
        this.divResultMessage.textContent = this.nls.noResults;
        this.drawBox.clear();
        return false;
      },

      _clearLayers:function(){
        array.forEach(this.resultLayers,lang.hitch(this,function(layer){
          if(layer){
            layer.clear();
          }
        }));
      },

      _onSearchError: function(error) {
        this.clear();
        html.setStyle(this.progressBar.domNode,'display','none');
        html.setStyle(this.divResult,'display','block');
        new Message({
          message: this.nls.searchError
        });
        console.debug(error);
      },

      _onSearchFinish: function(layerIndex, results) {
        var layerConfig = this.config.layers[layerIndex];
        this.clear();
        html.setStyle(this.progressBar.domNode,'display','none');
        html.setStyle(this.divResult,'display','block');
        this.searchResults = results;

        var title = "";
        var titlefield = layerConfig.titlefield;
        var objectIdField = layerConfig.objectIdField;
        var existObjectId = layerConfig.existObjectId;
        var len = results.features.length;
        if (len === 0) {
          
          if (this.geocodeResults){
            this._addGeocodeResultsToList(this.geocodeResults);
          }
          else
          {
            this.divResultMessage.textContent = this.nls.noResults;
          }

          return;
        } else {
          this.divResultMessage.textContent = this.nls.featuresSelected + results.features.length;
        }
        for (var i = 0; i < len; i++) {
          var attributes = results.features[i].attributes;
          var line = "",br = "",label = "",content = "";
          for (var fieldName in attributes) {
            if(!existObjectId && fieldName === objectIdField){
              continue;
            }
            var fieldInfo = this._getFieldInfo(fieldName,layerIndex);
            var fieldValue = attributes[fieldName];
            if(fieldInfo && fieldInfo.type === 'esriFieldTypeDate'){
              var date = new Date(parseInt(fieldValue,10));
              fieldValue = date.toLocaleDateString();
            }
            var alias = (fieldInfo && fieldInfo.alias)||fieldName;
            label = label + line + alias + ": " + fieldValue;
            line = ", ";
            var isTitleField = titlefield && (typeof titlefield === 'string') && (fieldName.toLowerCase() === titlefield.toLowerCase());
            if (isTitleField) {
              title = fieldValue;
            } else {
              content = content + br + alias + ": " + fieldValue;
              br = "<br>";
            }
          }
          this.list.add({
            id: "id_" + i,
            label: label,
            title: title,
            content: content
          });
        }
        this._drawResults(layerIndex, results);
      },

      _getFieldInfo:function(name, layerIndex){
        var layerConfig = this.config && this.config.layers && this.config.layers[layerIndex];
        var fieldInfos = layerConfig && layerConfig.fields && layerConfig.fields.field;
        if(fieldInfos){
          for(var i=0;i<fieldInfos.length;i++){
            var fieldInfo = fieldInfos[i];
            if(fieldInfo.name === name){
              return lang.mixin({},fieldInfo);
            }
          }
        }
        return null;
      },

      _drawResults: function(layerIndex, results) {
        var currentLayer = this.resultLayers[layerIndex];
        var features = results.features;
        for (var i = 0, len = features.length; i < len; i++) {
          var feature = features[i];
          if(!feature.geometry){
            continue;
          }
          var listItem = this.list.items[i];
          var type = feature.geometry.type;
          var geometry, symbol, centerpoint;
          switch (type) {
          case "multipoint":
          case "point":
            if (this.config.symbols &&　this.config.symbols.simplemarkersymbol) {
              symbol = new SimpleMarkerSymbol(this.config.symbols.simplemarkersymbol);
            } else {
              if (this.config.symbols　&& this.config.symbols.picturemarkersymbol) {
                symbol = new PictureMarkerSymbol(this.config.symbols.picturemarkersymbol);
              }
              else{
                symbol = new SimpleMarkerSymbol();
              }
            }
            centerpoint = feature.geometry;
            break;
          case "polyline":
            if (this.config.symbols && this.config.symbols.simplelinesymbol) {
              symbol = new SimpleLineSymbol(this.config.symbols.simplelinesymbol);
            } else {
              symbol = new SimpleLineSymbol();
            }
            centerpoint = feature.geometry.getPoint(0, 0);
            break;
          case "extent":
          case "polygon":
            if (this.config.symbols && this.config.symbols.simplefillsymbol) {
              symbol = new SimpleFillSymbol(this.config.symbols.simplefillsymbol);
            } else {
              symbol = new SimpleFillSymbol();
            }
            centerpoint = feature.geometry.getPoint(0, 0);
            break;
          default:
            break;
          }
          
          listItem.centerpoint = centerpoint;
          listItem.graphic = feature;
          var title = listItem.title;
          var content = listItem.content;
          if(!feature.symbol){
            feature.setSymbol(symbol);
          }
          if(!feature.infoWindow){
            var it = new InfoTemplate(title, title + "<br>" + content);
            feature.setInfoTemplate(it);
          }
          currentLayer.add(feature);
        }
        if (this.geocodeResults){
          this._addGeocodeResultsToList(this.geocodeResults);
        }
        
      },

      _selectResultItem: function(index, item) {
        
        var fullPosition = registry.byId(this.id + "_panel").getFullPosition();
        if (fullPosition.width === "100%")
          registry.byId(this.id + "_panel").onTitleClick();
       // if (window.innerWidth < 515)
       //   registry.byId(this.id + "_panel").onTitleClick();
        //console.log(window);

        if (item.centerpoint && item.graphic) {
          //this.map.setExtent(item.graphic._extent); 

          if (item.graphic.hasOwnProperty('_extent')){
            this.map.setExtent(item.graphic._extent)
          } 
          else{
            this.map.centerAndZoom(item.centerpoint, 12);
          }

          //this.map.centerAt(item.centerpoint).then(lang.hitch(this, function() {
          /*
          this.map.setExtent(item.graphic._extent).then(lang.hitch(this, function() {
            return;
            if (this.map.infoWindow) {
              this.map.infoWindow.setFeatures([item.graphic]);
              this.map.infoWindow.setTitle(item.title);
              this.map.infoWindow.setContent(item.content);

              if (this.map.infoWindow.reposition) {
                this.map.infoWindow.reposition();
              }
              this.map.infoWindow.show(item.centerpoint);
            }
          }));*/
        }
      },

      _hideInfoWindow:function(){
        if(this.map &&　this.map.infoWindow){
          this.map.infoWindow.hide();
        }
      },
      resize: function() {
        var fullPosition = registry.byId(this.id + "_panel").getFullPosition();
        if (fullPosition.width === "100%")
        {
            console.log('transparent');
        }
        else
        {
            console.log('opaque');
        }

      },
      onReceiveData: function(name, widgetId, data){
        console.log(data);
        this.tabContainer.selectTab('Results');
        
        //this._addGeocodeResultsToList(data.results.results);
        this.geocodeResults = data.results.results;
        this.onSearch(data.results.value);
      },

      _addGeocodeResultsToList: function(results){
        
        for (var i = 0, len = results.length; i < len; i++) {
          var result = results[i];

          var geometry, symbol, centerpoint;
          if (this.config.symbols &&　this.config.symbols.simplemarkersymbol) {
            symbol = new SimpleMarkerSymbol(this.config.symbols.simplemarkersymbol);
          } else {
            if (this.config.symbols　&& this.config.symbols.picturemarkersymbol) {
              symbol = new PictureMarkerSymbol(this.config.symbols.picturemarkersymbol);
            }
            else{
              symbol = new SimpleMarkerSymbol();
            }
          }
          centerpoint = result.feature.geometry;

          this.list.add({
            id: "id_" + this.list.items.length + i,
            label: result.name,
            title: result.name,
            content: result.name,
            centerpoint: centerpoint,
            graphic: result.feature
          });

          //console.log(result);
        }

       // array.forEach(results,lang.hitch(this,function(result){
        //  console.log(result);
          /*
           this.list.add({
            id: "id_" + result.feature.name,
            label: result.feature.name,
            title: result.feature.name,
            content: result.feature.name
          });*/

        //}));

       
      }


    });
  });