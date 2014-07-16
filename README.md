TCT
===

Explore the Trail App - **changes to files outside of the widget framework**

MapManager.js line 92:

    resetInfoWindow: function() {
        return; //MATT - disable infowindow - using a widget instead

jimu.js/dijit/List.js line 62:

    //MATT - added icon support in the List
    var img = domConstruct.create("img");
    img.src = item.image;
    img.width = 24;
    img.height = 24;
    domConstruct.place(img, div);
