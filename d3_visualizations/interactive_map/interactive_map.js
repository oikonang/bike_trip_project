    ///////////////////////////// This is the barchart with ttl distances ///////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    function draw_distances(data) {
      
      var margin = {top: 20, right: 20, bottom: 20, left: 40},
          width = 600 - margin.left - margin.right,
          height = 100 - margin.top - margin.bottom;

      var yTextPadding = 12; // For the bar tip on top
      
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

      // The tooltip on top of bars
      var tip = d3.tip()
                  .attr('class', 'd3-tip')
                  .offset([-10, 0])
                  .html(function(d) {
                    return "<strong>Day#" + d.day_no + " distance:</strong> <span style='color:#47885e'>" + d.ttl_dist + " km</span>";
                  })

      var svg = d3.select("#bar")
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top*2 + ")");
      
      // Call the tooltip inside svg
      svg.call(tip);

        // The x-axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        // The x-axis title
        svg.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (width/2) +","+(height+(margin.bottom*2))+")")  // centre below axis
            .text("Day#");
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
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        //Setting onMouseOver event handler for bars
        svg.selectAll(".bar").on("click", function(d){  
          $(".active").removeClass("active");
          $(this).addClass("active"); 

          draw_graphs(d);
          draw_map_route(d);
        });
    }
    
    ////////////////////////////////// These are the linegraphs /////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    function draw_graphs(day_data) {
      var margin = {top: 20, right: 20, bottom: 30, left: 50},
          width = 600 - margin.left - margin.right,
          height = 150 - margin.top - margin.bottom;
     
      // Define format of the text value on top of the moving circle
      var formatValue = d3.format(",.1f");

      // Define format for time
      var parseTime = d3.timeParse("%I:%M:%S");
      
      // Create a bisect to handle the position of the mouse in relation with the data on mousemove
      var bisect = d3.bisector(function(d){ return d.distance; }).left; // NEW STAFF
      
      // variable to hold our yscales
      var yarray = ['elevation','speed','heartrate'];
      
      // Intitialize new nested dataset
      var new_data_nest = [];

      // Create the nested dataset
      for ( var ix=0; ix<3; ix++) {
        // Create helper array to build the nested dataset 
        var tmp = []; 

         for ( var i=0; i<day_data['elevation'].length; i++) {
         tmp.push(
            {distance : day_data['distance'][i],
              time : day_data['time_form'][i],
              value : day_data[yarray[ix]][i],
              lat : day_data['path'][i][0],
              long : day_data['path'][i][1],
              symbol : yarray[ix],
          });
        }
        new_data_nest.push({
            key : yarray[ix],
            values:tmp
        });
      }
      // Add the SI symbol in the nested dataset for each metric
      for ( var ix=0; ix<3; ix++) {
        if (new_data_nest[ix].key=='elevation'){
          new_data_nest[ix]['elev_gain'] = day_data['elev_gain'] // adds elevation gain for elevation
          for ( var i=0; i<new_data_nest[0].values.length; i++) {
              new_data_nest[ix].values[i]['si'] = 'm'
          }
        }
        else if (new_data_nest[ix].key=='speed'){
          new_data_nest[ix]['avg_speed'] = day_data['avg_speed'] // adds avg speed for speed
          new_data_nest[ix]['max_speed'] = day_data['max_speed'] // adds max speed for speed
          for ( var i=0; i<new_data_nest[0].values.length; i++) {
              new_data_nest[ix].values[i]['si'] = 'km/h'
          }
        }
        else if (new_data_nest[ix].key=='heartrate'){
          new_data_nest[ix]['avg_active_HR'] = day_data['avg_active_HR'] // adds avg active HR for heartrate
          for ( var i=0; i<new_data_nest[0].values.length; i++) {
              new_data_nest[ix].values[i]['si'] = 'bpm'
          }
        }
      }
      
      // disctionary to hold our yscales
      var ys = {};
      
      // Remove previous elevation graph if loaded
      d3.select("#graphs").selectAll('*').remove();

      // Initialize the main are to put all graphs in
      var area = d3.area()
                   .x(function(d) { return xScale(d.distance);})
                   .y0(height)
                   .y1(function(d,i) {
                      return ys[d.symbol](d.value); //<-- call the y function matched to our symbol
                      //ys[yarray[i]](d.yarray);
                    });
      // Initialize the line for each graph
      var line = d3.line()
                   .x(function(d) { return xScale(d.distance); })
                   .y(function(d,i) {
                      return ys[d.symbol](d.value); //<-- call the y scale function matched to our symbol
                      //ys[d.symbol](d.price);
                   });
      
      // Build the x scale
      var xScale = d3.scaleLinear()
                     .rangeRound([0, width]);
      
      // Build the x axis
      var xAxis = d3.axisBottom()
                    .scale(xScale)
                    .tickFormat(d3.format(".2s"));

      // Compute the maximum y-value per graph, needed for the y-domain.
      new_data_nest.forEach(function(s) {
        // Find the max value
        var maxValue = d3.max(s.values, function(d) { return d.value; });
        // Append the yscale of each line in the ys
        ys[s.key] = d3.scaleLinear() //<-- create a scale for each "symbol" (ie Sensor 1, etc...)
                      .range([height, 0])
                      .domain([0, maxValue]);
      });

      // Compute the minimum and maximum distance across y-elements.
      // We assume values are sorted
      xScale.domain([
        d3.min(new_data_nest, function(s) {
          console.log(s.values[0].distance);
          return s.values[0].distance;
        }),
        d3.max(new_data_nest, function(s) {
          console.log(s.values[s.values.length - 1].distance);
          return s.values[s.values.length - 1].distance;
        })
      ]);

      // Add an SVG element for each symbol, with the desired dimensions and margin.
      var svg1 = d3.select("#graphs").selectAll("svg")
        .data(new_data_nest) 
        .enter().append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
      
      // Create the rect for the mouse to be tracked 
      svg1.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("id", "clip-rect")
        .attr("x", "-40")
        .attr("y", "-10")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height  +margin.top-10);

      // Add all svg1 in the main svg
      var svg = svg1.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Add the area path elements. Note: the y-domain is set per element.
        svg.append("path")
          .attr("class", "area")
          .attr("d", area);

        // Add the line path elements. Note: the y-domain is set per element.
        svg.append("path")
          .attr("class", "line")
          .attr("d", function(d) {
            return line(d.values);
          });

      // Add the area path elements. Note: the y-domain is set per element.
      svg.append("path")
        .attr("class", "area")
        .attr("d", area);

      // Title for the y-axis
      svg.append("text")
         .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (-margin.left/1.6) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
            .text(function(d) {
                return capitalizeFirstLetter(d.key);
            });  

      // Averages and more on the background of the graphs
      svg.append("text")
         .attr("text-anchor", "middle")  
            .attr("transform", "translate("+ (margin.left*5) +","+(height/1.2)+")") 
            .text(function(d) {
              if (d.key == 'elevation'){
                return 'Elevation gain : ' + formatValue(d.elev_gain);
              }
              else if (d.key == 'speed'){
                return 'Avg. speed : ' + formatValue(d.avg_speed) + ' | Max speed : ' + formatValue(d.max_speed);
              }
              else if (d.key == 'heartrate'){
                return 'Avg. HR: ' + formatValue(d.avg_active_HR);
              }
            })
            .style('opacity', 0.5);  

      // The x-axis
      svg.append('g') // create a <g> element
        .attr('class', 'x axis') // specify classes
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis); // let the axis do its thing

      // build 4 y axis
      var axisGs = svg.append("g"); //<-- create a collection of axisGs
        
        // Build the structure
        axisGs.attr("class", "y axis")
              .append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .text(function(d) {
                return d.values[d.values.length - 1].value;
              });
        // For each axisG create an axis with it's scale
        axisGs.each(function(d, i) {
          var self = d3.select(this);
          self.call(
            d3.axisLeft()
            .scale(ys[d.key])
            .ticks(4)
          );
        });
      // Place each graph one after the other
      svg = svg.append("g").attr("clip-path", "url(#clip)");

      // Create a class for the mouse-move event
      var focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");
        
        // Add the circle
        focus.append("circle")
              .style("stroke", "#47885e")
              .style("fill", "#fef6cd")
              .style("stroke-width", "1.5px")
              .attr("r", 4.5);

        // Add text on top of moving circle
        focus.append("text")
          .attr("x", 0)
          .attr("dy", "-.90em")
          .style("font-size", "12px")
          .style("fill", "grey")
          .style("text-anchor", "middle");

      // Create the area where the mouse will be tracked
      svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() {
          focus.style("display", null);
        })
        // .on("mouseout", function() {
        //   focus.style("display", "none");
        // })
        .on("mousemove", mousemove);

      // append the vertical line for each 
      focus.append("line")
        .attr('id', 'focusLineX')
        .attr("class", "focusLine");

      function mousemove() {
        var xnew, posit, coordinates;
        coordinates = d3.mouse(this);
        xnew = xScale.invert( coordinates[0] );
        
        // Select focus class of all linegraphs
        var focus = svg.selectAll(".focus");

        /////////////////////////////////////////////////////////// Create the moving marker on map
        // Select map
        map = window.map;

        // Remove previous marker on move
        $(".marker").remove();
         
        // Create a new layer on map for the marker
        var svg2 = d3.select("#map").select("svg"),
        g2 = svg2.append("g").attr("class", "marker");

        // Find the position of the array according to mouse move
        posit1 = bisect(new_data_nest[0].values, xnew, 0, new_data_nest[0].values.length);
        
        var tmplat = new_data_nest[0].values[posit1]['lat']
        var tmplon = new_data_nest[0].values[posit1]['long']
        var tmptime = new_data_nest[0].values[posit1]['time']
        
        LatLng = new L.LatLng(tmplat,tmplon);

        // Sava coords into a variable object
        var coords2 = [{tmplat,tmplon,LatLng,tmptime}]
         
        // This is the market point
        var feature = g2.selectAll("path")
             .data(coords2)
             .enter().append("circle")
             .style("stroke", "#47885e")
             .style("fill", "#fef6cd")
             .style("stroke-width", "1.5px")
             .attr("r", 4.5);

         // The text next to the marker circle indicating the biking hours spent
        var circletext = g2.selectAll("text")
            .data(coords2)
            .enter()
            .append("text")
            .attr("class", "locnames")
            .text( tmptime + " cycling time")
            .attr("y",  -10)
            .style("font-size", "12px")
            .style("fill", "grey");
        
        // Up until here it is correct
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
            circletext.attr("transform",
                function(d) {
                  return "translate("+ 
                    map.latLngToLayerPoint(d.LatLng).x +","+ 
                    map.latLngToLayerPoint(d.LatLng).y +")";
                });

        } // close update
        
        //////////////////////////////////////// END Marker

        // Start the transform - translate function
        focus.attr("transform", function(d) {
            // Define the position of the mouse
            posit = bisect(d.values, xnew, 0, d.values.length);
            
            //Define the limits of the y-vertical mouseover axis with yDomain
            var yDomain = d3.extent(d.values, function(d) {
              return d.value;
            });
            // Define the position of the y-vertical line
            focus.select('#focusLineX')
              .attr("x1", 0)
              .attr("y1", 0)
              .attr("x2", 0)
              .attr("y2", ys[d.key](yDomain[0]-height));

            // Activate the text on top of the moving circle
            focus.selectAll("text").text(function(d) {
              return ("" + formatValue(d.values[posit].value)  + "" + d.values[posit].si)
            });

          // adjust mouseover to use appropriate scale
          return "translate(" + xScale(d.values[posit].distance) + "," + ys[d.key](d.values[posit].value) + ")"
        }); // End transform - translate function
      } // End mousemove
      
          
      } // End draw elevation
      function draw_base_map(data) {
        // The center must be updated whenever I put a new coordinate on the map
        var center = [53.01,25.73]  //[53.01,25.73]->Eastern Europe,  [37.77, -122.45]->California

        // The token is for access to the mapbox API
        var accessToken = 'pk.eyJ1Ijoib2lrb25hbmciLCJhIjoiY2ozM2RjcjIyMDBjODJ3bzh3bnRyOHBxMyJ9.nQH16WG-DcBB_TQEEJiuCA';

        // Default guidelines from Leaflet
        var mapboxTiles = L.tileLayer('https://api.mapbox.com/styles/v1/oikonang/cj33g56m9000k2roa18n92cr8/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoib2lrb25hbmciLCJhIjoiY2ozM2RjcjIyMDBjODJ3bzh3bnRyOHBxMyJ9.nQH16WG-DcBB_TQEEJiuCA', {
            attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
            maxZoom: 18,
            accessToken: accessToken
        });
        // Mapbox with leaflet
        var map = L.map('map').addLayer(mapboxTiles).setView(center, 4);

        // Initialize map 
        window.map = map 

        // Pick the map and apply the 
        map = window.map;
        
        // Create an empty array to hold the coordinates
        var all_latlng = [];

        // Create an array of all coordinates of all days and concatenate into a sigle array
        for ( var i=0; i<data.length; i++) {
          tmparray = data[i]['path'];
          all_latlng = all_latlng.concat( tmparray );
        }
        // Keep the polyline of the whole route in the same position with red color
        var polyline = L.polyline(all_latlng, {color: 'red'}).addTo(map); 
        
        // Load weather data
        d3.csv("weather.csv", function(weather) {
          // Create an empty list of variables to fit the weather markers
          var markers = [];
          var windmarkers = []; 

          // Create weather icons options(sizes)
          var WeatherIcon = L.Icon.extend({
            options: {
                iconSize:     [40, 40],
                iconAnchor:   [16, 16],
                popupAnchor:  [0, -18]
                }
          });

          
          // Create dynamically variables from weather data
          for (var i=0; i<weather.length; i++){
            markers[i] = L.marker([+weather[i].lat,+weather[i].lon], {icon: new WeatherIcon({iconUrl: 'weather_icons/'+weather[i].icon+'.png'})})
                          .bindPopup('<table><tr><td>Day: </td><td>' + weather[i].day_no + '</td></tr>' +
                                     '<tr><td>Date: </td><td>' + weather[i].date + '</td></tr>' +
                                     '<tr><td>Time: </td><td>' + weather[i].time + '</td></tr>' +
                                     '<tr><td>Temp: </td><td>' + weather[i].tempC + ' Co </td></tr>'+
                                     '<tr><td>Humidity: </td><td>' + weather[i].humidity + '% </td></tr></table>');
          } // Close for loop for weather data

          // Create dynamically variables from wind data 
          for (var i=0; i<weather.length; i++){
            // Convert wind speed from km/h to knots by multiplying with 0.5399565
            // Use windbarb leaflet plugin
            windmarkers[i] = L.marker([+weather[i].lat,+weather[i].lon], {icon: L.WindBarb.icon({deg: +weather[i].windDeg, speed: +weather[i].windSpeed*0.5399565, pointRadius: 5, strokeLength: 20})})
                          .bindPopup('<table><tr><td>Day: </td><td>' + weather[i].day_no + '</td></tr>' +
                                     '<tr><td>Date: </td><td>' + weather[i].date + '</td></tr>' +
                                     '<tr><td>Time: </td><td>' + weather[i].time + '</td></tr>' +
                                     '<tr><td>Wind Direction: </td><td>' + degToCompass(+weather[i].windDeg) + '</td></tr>' +
                                     '<tr><td>Wind Speed: </td><td>' + weather[i].windSpeed + 'km/h </td></tr></table>');
          } // Close for loop for weather data

          // Create a markers group for weather data
          var markers_group = L.layerGroup(markers);

          // Create a wind markers group for wind data
          var wind_markers_group = L.layerGroup(windmarkers)

          var overlayMaps = {
            "Weather": markers_group,
            "Wind" : wind_markers_group
          };
          // add layers to the map
          L.control.layers(null,overlayMaps).addTo(map);
        }) // End csv sourcing of weather data


      } // End draw_base_map

      // Draw lan lot on map
      function draw_map_route(day_data) {
        map = window.map;
        if (window.currentPath) {
          map.removeLayer(window.currentPath);
        };
        latlng = day_data['path'];
        var polyline2 = L.polyline(latlng, {color: '#47885e'}).addTo(map);
        window.currentPath = polyline2;
      }

    function draw(data) {
      draw_distances(data);
      draw_base_map(data);
    }
    // Function that capitalizes the first letter of a word
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    // Function that converts wind degrees to compass North, South, etc..
    function degToCompass(num) {
      var val = Math.floor((num / 22.5) + 0.5);
      var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
      return arr[(val % 16)];
    }