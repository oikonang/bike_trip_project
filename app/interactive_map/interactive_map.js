    ///////////////////////////// This is the barchart with ttl distances ///////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    function draw_distances(data) {
      
      var margin = {top: 20, right: 20, bottom: 20, left: 40},
          width = 600 - margin.left - margin.right,
          height = 100 - margin.top - margin.bottom;

      var flag = 0; //default = 0
      
      var x = d3.scaleBand()
                .domain(data.map(function(d,i) { return i; }))
                .rangeRound([0, width])
                .padding(0.1);

      var y = d3.scaleLinear()
                .domain([0, d3.max(data, function(d) { return d.ttl_dist; })])
                .range([height, 0]);
      
      var xAxis = d3.axisBottom()
                    .scale(x)
                    .tickFormat(function(d) {return data[d].day_no;});

      var yAxis = d3.axisLeft()
                    .scale(y)
                    .ticks(5);

      var svg = d3.select("#bar")
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top*2 + ")");
        
        // The x-axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        // The x-axis title
        svg.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (width/2) +","+(height+(margin.bottom*2))+")")  // centre below axis
            .text("Day");
         // The y-axis title
        svg.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (-margin.left/2) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
            .text("Distance in km");   
        
        // The bars
        svg.selectAll(".bar")
            .data(data)
          .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d, ix) { return x(ix); })
            .attr("width", x.bandwidth())
            .attr("y", function(d) { return y(d.ttl_dist); })
            .attr("height", function(d) { return height - y(d.ttl_dist); })

        var yTextPadding = 15;
        svg.selectAll(".bartext")
            .data(data)
            .enter().append("text")
            .attr("class", "bartext")
            .attr("text-anchor", "middle")
            .attr("fill", "#fef6cd")
            .attr("x", function(d,ix) { return x(ix)+x.bandwidth()/2; })
            .attr("y", function(d) { return y(d.ttl_dist)+yTextPadding; })
            .text(function(d){ return d.ttl_dist+" km"; });

        //Setting onMouseOver event handler for bars
        svg.selectAll(".bar").on("mouseover", function(d){  
          $(".active").removeClass("active");
          $(this).addClass("active");              
          draw_elevation(d);
          draw_map_route(d);
        });
    }
    
    ////////////////////////////////// This is the elevation linegraph ///////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    function draw_elevation(day_data) {
      var margin = {top: 20, right: 20, bottom: 30, left: 50},
          width = 600 - margin.left - margin.right,
          height = 150 - margin.top - margin.bottom;
      
      // Create new day_data to handle multi-use of both elevation and distance
      var new_data = [];
      for ( var i=0; i<day_data['elevation'].length; i++) {
          
          new_data.push({
            elevation: day_data['elevation'][i],
            distance: day_data['distance'][i]
          });
      }
      // Remove previous elevation graph if loaded
      var svg = d3.select("#elev").selectAll('*').remove();
      
      // Create elevation graph
      var svg = d3.select('#elev')
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      
      // Build the x scale
      var xScale = d3.scaleLinear()
                     .domain([0, d3.max(new_data, function(d) { return d.distance; })])
                     .rangeRound([0, width]);
      
      // Build the y scale
      var yScale = d3.scaleLinear()
                     .domain([0, d3.max(new_data, function(d) { return d.elevation; })])
                     .range([height, 0]);
      
      // Build the x axis
      var xAxis = d3.axisBottom()
                    .scale(xScale)
                    .tickFormat(d3.format(".1s"));
      
      // Build the y axis
      var yAxis = d3.axisLeft() 
                    .scale(yScale);
      
      // Plot the line
      var line = d3.line()
                    .x(function(d) { return xScale(d.distance); })
                    .y(function(d) { return yScale(d.elevation); });

      // Add x-axis
      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);
      // Add y-axis    
      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);
      // Title for the x-axis
      svg.append("text")
          .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
          .attr("transform", "translate("+ (width/2) +","+(140)+")")  // centre below axis
          .attr('dy', '.1em')
          .text("Distance in km");
      // Title for the y-axis
      svg.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (-margin.left/1.6) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
            .text("Elevation");
      
      // Draw the line 
      var path = svg.append("g")   
          .append("path")
          .attr("d", line(new_data))
          .attr("class", "line");

      // Create a bisect to handle the position of the mouse in relation with the data on mousemove
      var bisect = d3.bisector(function(d){ return d.distance; }).left; // NEW STAFF

      // Create a new class to put the focus circle on mousemove      
      var focus = svg.append("g")
                      .attr("class", "focus")
                      .style("display", "none");
          // The circle
          focus.append("circle")
               .style("stroke", "#47885e")
               .style("fill", "#fef6cd")
               .style("stroke-width", "1.5px")
               .attr("r", 4.5);
          // The text next to the circle
          focus.append("text")
              .attr("x", 9)
              .attr("dy", ".35em");

      // This is the black vertical line that follows the mouse
      var mouseG = svg.append("g")
                      .attr("class", "mouse-over-effects");

          // Draw the vertical line
          mouseG.append("path") 
              .attr("class", "mouse-line")
              .style("stroke", "black")
              .style("stroke-width", "1px")
              .style("opacity", "0");
          
          // Append a rect to catch mouse movements on canvas
          mouseG.append('svg:rect')  
                .attr('width', width) // can't catch mouse events on a g element
                .attr('height', height)
                .attr('fill', 'none')
                .attr('pointer-events', 'all')
                .on("mousemove", function(d) {
                    // Define the position of the mouse and find the accordinate x and y values
                    var coordinates = d3.mouse(this);
                    var xnew = xScale.invert( coordinates[0] );
                    var posit = bisect(new_data, xnew, 0, new_data.length);
                    var smaller = new_data[posit-1];
                    var larger = new_data[posit];
                    var match = xnew - smaller.distance < larger.distance - xnew ? smaller : larger;
                    
                    // Activate vertical line
                    d3.select(".mouse-line")
                      .style("opacity", "1")
                      .attr("d", function() {
                        var d = "M" + coordinates[0] + "," + height;
                        d += " " + coordinates[0] + "," + 0;
                        return d;
                      });
                    
                    // Activate circle with text
                    focus.style("display", null);
                    focus.attr("transform", "translate(" + xScale(match.distance) + "," + yScale(match.elevation) + ")");
                    focus.select("text").text(match.elevation+" m");
                    });
          
      }
      function draw_base_map() {
        // The center must be updated whenever I put a new coordinate on the map
        var center = [55.6716,12.5714]  //[53.01,25.73]->Eastern Europe,  [37.77, -122.45]->California

        // The token is for access to the mapbox API
        var accessToken = 'pk.eyJ1Ijoib2lrb25hbmciLCJhIjoiY2ozM2RjcjIyMDBjODJ3bzh3bnRyOHBxMyJ9.nQH16WG-DcBB_TQEEJiuCA';

        // Default guidelines from Leaflet
        var mapboxTiles = L.tileLayer('https://api.mapbox.com/styles/v1/oikonang/cj33g56m9000k2roa18n92cr8/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoib2lrb25hbmciLCJhIjoiY2ozM2RjcjIyMDBjODJ3bzh3bnRyOHBxMyJ9.nQH16WG-DcBB_TQEEJiuCA', {
            attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
            maxZoom: 18,
            accessToken: accessToken
        });
        // Mapbox with leaflet
        var map = L.map('map').addLayer(mapboxTiles).setView(center, 12);
                    
        // Initialize map 
        window.map = map 
      }

      // Draw lan lot on map
      function draw_map_route(day_data) {
        map = window.map;
        if (window.currentPath) {
          map.removeLayer(window.currentPath);
        };
        latlng = day_data['path'];
        var polyline = L.polyline(latlng, {color: 'red'}).addTo(map);
        window.currentPath = polyline;
      }

    function draw(data) {
      //data.reverse();
      draw_distances(data);
      draw_base_map();
    }