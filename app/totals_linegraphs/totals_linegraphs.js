function draw_multilinegraph(data) {
  var margin = {top: 0, right: 20, bottom: 2, left: 50},
      width = 600 - margin.left - margin.right,
      height = 110 - margin.top - margin.bottom;
  
  // Hardcode total distance, total number of days cycling and total elevation gain  
  var ttl_distance_hc = 2690.50;
  var ttl_day_no_hc = 28;
  var ttl_time_hc = "158:06:21"
  var ttl_elev_gain_hc = 25566.20;
  var ttl_avg_speed_hc = 19.45;

  // Define format of the text value on top of the moving circle
  var formatValue = d3.format(",.1f");

  // Define format for time
  var parseTime = d3.timeParse("%I:%M:%S");

  // Create a bisect to handle the position of the mouse in relation with the data on mousemove
  var bisect = d3.bisector(function(d){ return d.day_no; }).left; // NEW STAFF
  
  // variable to hold our yscales
  var yarray = ['total distance', 'elevation gain', 'avg. speed', 'max speed', 'heartrate'];
  
  // Intitialize new nested dataset
  var new_data_nest = [];

  // Create the nested dataset
  for ( var ix=0; ix<5; ix++) {
    // Create helper array to build the nested dataset 
    var tmp = []; 
    if (ix==0){
        for ( var i=0; i<data.length; i++) {
         tmp.push(
            {value : +data[i]['ttl_distance'],
             day : data[i]['day'],
             day_no : +data[i]['day_no'],
             time : data[i]['ttl_time'],
             symbol : yarray[ix]
          });
        }
    }
    else if (ix==1) {
        for ( var i=0; i<data.length; i++) {
         tmp.push(
            {value : +data[i]['elevation_gain'],
             day : data[i]['day'],
             day_no : +data[i]['day_no'],
             time : data[i]['ttl_time'],
             symbol : yarray[ix]
          });
        }
    }
    else if (ix==2) {
        for ( var i=0; i<data.length; i++) {
         tmp.push(
            {value : +data[i]['avg_speed'],
             day : data[i]['day'],
             day_no : +data[i]['day_no'],
             time : data[i]['ttl_time'],
             symbol : yarray[ix]
          });
        }
    }
    else if (ix==3) {
        for ( var i=0; i<data.length; i++) {
         tmp.push(
            {value : +data[i]['max_speed'],
             day : data[i]['day'],
             day_no : +data[i]['day_no'],
             time : data[i]['ttl_time'],
             symbol : yarray[ix]
          });
        }
    }
    else if (ix==4) {
        for ( var i=0; i<data.length; i++) {
         tmp.push(
            {value : +data[i]['avg_active_HR'],
             day : data[i]['day'],
             day_no : +data[i]['day_no'],
             time : data[i]['ttl_time'],
             symbol : yarray[ix]
          });
        }
    }
    new_data_nest.push({
        key : yarray[ix],
        values:tmp
    });
    }   
    // Create the header for the panel
    var stats_header = d3.select("#panel")
                        .append("div")
                        .attr("class","stats-header");

    stats_header.html("<h3>TOTAL STATS</h3>");

    // Create the stats on the panel showing the data stats on the right of the graphs
    var ttl_stats = d3.select("#panel")
                .append("div")
                .attr("class", "ttl-stats");
    
    ttl_stats.html("Total Trip Distance: <strong>" + ttl_distance_hc + "</strong> km <br>" + 
               "<br>Total Days Traveling: <strong>" + ttl_day_no_hc + "</strong> days <br>" +
               "<br>Total Biking Time: <strong>" + ttl_time_hc + "</strong> h:m:s <br>" +
               "<br>Total Elevation Gain: <strong>" + ttl_elev_gain_hc + "</strong> m <br>" +
               "<br>Average Biking Speed: <strong>" + ttl_avg_speed_hc + "</strong> km/h <br>");
    
    // disctionary to hold our yscales
    var ys = {};

    // Initialize the main area to put all graphs in
    var area = d3.area()
               .x(function(d) { return xScale(d.day_no);})
               .y0(height)
               .y1(function(d,i) {
                  return ys[d.symbol](d.value); //<-- call the y function matched to our symbol
                });

    // Initialize the line for each graph
    var line = d3.line()
               .x(function(d) { return xScale(d.day_no); })
               .y(function(d,i) {
                  return ys[d.symbol](d.value); //<-- call the y scale function matched to our symbol
               });

    // Build the x scale
    var xScale = d3.scaleLinear()
                 .rangeRound([0, width]);
                 
    // Build the x axis
    var xAxis = d3.axisBottom()
                .scale(xScale)
                .tickValues(d3.range(1, 29, 1));

    // Compute the maximum y-value per graph, needed for the y-domain.
    new_data_nest.forEach(function(s) {
    // Find the max value
    var maxValue = d3.max(s.values, function(d) { return d.value; });
    // Append the yscale of each line in the ys
    ys[s.key] = d3.scaleLinear() //<-- create a scale for each "symbol" (ie Sensor 1, etc...)
                  .range([height, 0])
                  .domain([1, maxValue]);
    });

    // Compute the minimum and maximum distance across y-elements.
    // We assume values are sorted
    xScale.domain([
    d3.min(new_data_nest, function(s) {
      return s.values[0].day_no-0.5; //-0.5 leaves a gap between the axis and the linegraph
    }),
    d3.max(new_data_nest, function(s) {
      return s.values[s.values.length - 1].day_no;
    })
    ]);
 
    // Add an SVG element for each symbol, with the desired dimensions and margin.
    var svg1 = d3.select("#linegraphs").selectAll("svg")
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
    .attr("height", 2*height  + margin.top);

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
      
    // Title for the y-axis
    svg.append("text")
     .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ (-margin.left/1.5) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
        .text(function(d) {
            return capitalizeFirstLetter(d.key);
        });  

    // The x-axis
    svg.append('g') // create a <g> element
    .attr('class', 'x axis') // specify classes
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis); // let the axis do its thing

    // Title of the x-axis
    svg.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (width/2) +","+(height+(margin.bottom*17))+")")  // centre below axis
            .text("Day#");

    // build 5 y axis
    var axisGs = svg.append("g"); //<-- create a collection of axisGs

    // Build the structure
    axisGs.attr("class", "y axis")
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 10)
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
    .on("mousemove", mousemove)
    .on("mouseout", mouseout);

    // append the vertical line for each 
    focus.append("line")
        .attr('id', 'focusLineX')
        .attr("class", "focusLine");

    function mouseout() {
        // Hide and show classes 
        $(".focus").hide();
        $(".ttl-stats").show();
        $(".stats").remove();
        stats_header.html("<h3>TOTAL STATS</h3>");
    }

    // function that handles the movement of the mouse on the linegraphs
    function mousemove() {
        var xnew, posit, coordinates;
        coordinates = d3.mouse(this);
        xnew = xScale.invert( coordinates[0] );

        // Select focus class of all linegraphs
        var focus = svg.selectAll(".focus");

        // /////////////////////////////////////////////////////////// Create a new stats panel

        // Remove previous stats panel or ttl_stats
        $(".ttl-stats").hide();
        $(".stats").remove();

        // Find the position of the array according to mouse move
        posit1 = bisect(new_data_nest[0].values, xnew, 0, new_data_nest[0].values.length);

        // Define the variables used to display
        var tmpdayno = new_data_nest[0].values[posit1]['day_no']
        var tmpdate = new_data_nest[0].values[posit1]['day']
        var tmptime = new_data_nest[0].values[posit1]['time']
        var tmpdistance = new_data_nest[0].values[posit1]['value']
        var tmpelevgain = new_data_nest[1].values[posit1]['value']
        var tmpavgspeed = new_data_nest[2].values[posit1]['value']
        var tmpmaxspeed = new_data_nest[3].values[posit1]['value']
        var tmphr = new_data_nest[4].values[posit1]['value']

        // Create the stats on the panel showing the data stats on the right of the graphs
        var stats = d3.select("#panel")
                .append("div")
                .attr("class", "stats");
    
        // Stats 
        stats.html("Day : <strong>" + tmpdayno + "</strong> " +
               "<br>Date : <strong>" + tmpdate + "</strong> " +
               "<br>Biking Time: <strong>" + tmptime + "</strong> h:m:s " +
               "<br>Biking Distance: <strong>" + tmpdistance + "</strong> km " +
               "<br>Elevation Gain: <strong>" + tmpelevgain + "</strong> m " +
               "<br>Avg Speed: <strong>" + formatValue(tmpavgspeed) + "</strong> km/h " + 
               "<br>Max Speed: <strong>" + tmpmaxspeed + "</strong> km/h " +
               "<br>Avg Heartrate: <strong>" + formatValue(tmphr) + "</strong> bpm ");
        
        stats_header.html("<h3>DAILY STATS</h3>");
        //////////////////////////////////////// END Panel

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


          // adjust mouseover to use appropriate scale
          return "translate(" + xScale(d.values[posit].day_no) + "," + ys[d.key](d.values[posit].value) + ")"
        }); // End transform - translate function
      } // End mousemove

}

function draw_lines(data) {
      draw_multilinegraph(data);
    }

// Function that capitalizes the first letter of a word
function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }