// The center must be updated whenever I put a new coordinate on the map
var center = [53.01,25.73]

// The token is for access to the mapbox API
var accessToken = 'pk.eyJ1Ijoib2lrb25hbmciLCJhIjoiY2ozM2RjcjIyMDBjODJ3bzh3bnRyOHBxMyJ9.nQH16WG-DcBB_TQEEJiuCA';

// Default guidelines from Leaflet
var mapboxTiles = L.tileLayer('https://api.mapbox.com/styles/v1/oikonang/cj33g56m9000k2roa18n92cr8/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoib2lrb25hbmciLCJhIjoiY2ozM2RjcjIyMDBjODJ3bzh3bnRyOHBxMyJ9.nQH16WG-DcBB_TQEEJiuCA', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
    maxZoom: 18,
    accessToken: accessToken
});

// Mapbox with leaflet
var map = L.map('realtime_map').addLayer(mapboxTiles).setView(center, 4);
            
//  Initialize the SVG layer (OLD CSS)
map._initPathRoot()    

/* We simply pick up the SVG from the map object (OLD CSS)*/
var svg = d3.select("#realtime_map").select("svg"),
g = svg.append("g");

// Define the div for the tooltip
var div = d3.select("#realtime_map")
            .append("div") 
            .attr("class", "tooltip")       
            .style("opacity", .9);

// Add a starting message
div.html("<h4>Realtime Location</h4>"+ "<br/>" + "Hover over a point");

// Define the div for the legend
var legend = d3.select("#realtime_map")
               .append("div")
               .attr("class", "legend")
               .style("opacity", .9);

// Add a starting message
legend.html('<i style="background: green"></i>' + 'Starting Point' + '<br/>' + 
            '<i style="background: yellow"></i>' + 'Daily Update' + '<br/>' +
            '<i style="background: red"></i>' + 'Finish Point');

// Create starting marker
var marker_start = L.marker([59.4167, 24.7992]).addTo(map);
marker_start.bindPopup("<b>Starting Point!</b>").openPopup();

// Create finishing marker
var marker_finish = L.marker([40.9977995, 28.9282999]).addTo(map);
marker_finish.bindPopup("<b>Finishing Point!</b>").openPopup();
    
    d3.csv("../data/geolocations.csv", function(collection) {

        // Stream transform. transforms geometry before passing it to
        // listener. Can be used in conjunction with d3.geoPath
        // to implement the transform.
        var transform = d3.geoTransform({point: projectPoint});

        //d3.geoPath translates GeoJSON to SVG path codes.
        //essentially a path generator. In this case it's
        // a path generator referencing our custom "projection"
        // which is the Leaflet method latLngToLayerPoint inside
        // our function called projectPoint
        var path = d3.geoPath().projection(transform);

        // Add a LatLng object to each item in the dataset
        collection.forEach(function(d) {
            d.LatLng = new L.LatLng(d.lat,
                                    d.lon)
        })

        // For simplicity I hard-coded this! I'm taking
        // the first object (the origin)
        // and destination and adding them separately to
        // better style them.
        // var startpoint = collection[0]
        // var endpoint = collection[collection.state==0]
        // console.log(endpoint)
        // Add the points of the days excluding the starting and finishing day
        var feature = g.selectAll("path")
            .data(collection)
            .enter().append("circle")
            .style("fill", function(d) {
                if(+d.state == 0){
                    return 'green'
                }
                else if(+d.state == 1){
                    return 'yellow'
                }
                else if(+d.state == 2){
                    return 'red'
                }
            })  
            .style("opacity", function(d) {
                if(+d.state == 0){
                    return 1
                }
                else if(+d.state == 1){
                    return 0.7
                }
                else if(+d.state == 2){
                    return 0.8
                }
            })   
            .attr("r", function(d) {
                if(+d.state == 0){
                    return 10
                }
                else if(+d.state == 1){
                    return 5
                }
                else if(+d.state == 2){
                    return 10
                }
            })
            .on("mouseover", mouseover)
            .on("mouseout" , mouseout);
             
        
        // Here we will make the points into a single
        // line/path. Note that we surround the featuresdata
        // with [] to tell d3 to treat all the points as a
        // single line. For now these are basically points
        // but below we set the "d" attribute using the 
        // line creator function from above.
        var linePath = g.selectAll(".lineConnect")
            .data([collection])
            .enter()
            .append("path")
            .attr("class", "lineConnect");

        // Here we're creating a FUNCTION to generate a line
        // from input points. Since input points will be in 
        // Lat/Long they need to be converted to map units
        // with applyLatLngToLayer
        var toLine = d3.line()
            .x(function(d) {
                return applyLatLngToLayer(d).x
            })
            .y(function(d) {
                return applyLatLngToLayer(d).y
            })
            .curve(d3.curveCardinal);


        map.on("viewreset", update);
        update();

        // Create a function to handle the layers on zoum in and out
        function update() {
            feature.attr("transform", 
            function(d) { 
                return "translate("+ 
                    map.latLngToLayerPoint(d.LatLng).x +","+ 
                    map.latLngToLayerPoint(d.LatLng).y +")";
                }
            )
            linePath.attr("d", toLine)
        } // close update

    }) // close csv   

// Create a function to handle the tip on mouseover
function mouseover(d){
        if(+d.state == 0){
            // Write staff on tooltip
            div.html("<h4>Realtime Location</h4>" + "<br/>" + "<strong>Starting point!</strong>"+ "<br/>" + "Date: " + d.date)  
        }
        else if(+d.state == 1){
            // Write staff on tooltip
            div.html("<h4>Realtime Location</h4>" + "<br/>" + "Day " + d.day + "<br/>" + "Date: " + d.date)  
        }
        else if(+d.state == 2){
            // Write staff on tooltip
            div.html("<h4>Realtime Location</h4>" + "<br/>" + "<strong>Finish point</strong>" + "<br/>" + "Total Days " + d.day + "<br/>" + "Date: " + d.date)  
        }
        // Show tooltip
        div.transition()    
           .duration(200)    
           .style("opacity", .9);

        // Place the tooltip
        // div.style("left", (d3.event.pageX) + "px")   
        //    .style("top", (d3.event.pageY - 28) + "px");
}// close mouseover
// Create a function to handle the tip on mouseout
function mouseout(d){
        // remove the tip
        div.transition()
           .duration(500)
           .style("opacity", .9); 

        div.html("<h4>Realtime Location</h4>"+ "<br/>" + "Hover over a point");
}// close mouseout
// Use Leaflet to implement a D3 geometric transformation.
// the latLngToLayerPoint is a Leaflet conversion method:
//Returns the map layer point that corresponds to the given geographical
// coordinates (useful for placing overlays on the map).
function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}  // close projectPoint  

// similar to projectPoint this function converts lat/long to
// svg coordinates except that it accepts a point from our 
// GeoJSON
function applyLatLngToLayer(d) {
    var y = d.lat
    var x = d.lon
    return map.latLngToLayerPoint(new L.LatLng(y, x));
} // close applyLatLngToLayer