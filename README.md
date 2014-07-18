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
init.js:

    line 21 mblThemeFiles: ['base','Carousel','PageIndicator'],
    line 52 apiUrl + 'js/dojo/dojox/mobile/deviceTheme.js' //added to support picture carousel
index.html

    <!-- Go to www.addthis.com/dashboard to customize your tools -->
	<!--<script type="text/javascript" src="//s7.addthis.com/js/300/addthis_widget.js#pubid=ra-53c9578319685526"></script>-->
	<div id="main-page">
	    <div id="addthis_sharing_toolbox" class="addthis_sharing_toolbox" style="display:none;position:absolute;z-index:1;top:80px;left:64px"></div>
		<div id="jimu-layout-manager"></div>
	</div>	
