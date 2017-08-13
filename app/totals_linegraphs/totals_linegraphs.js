function draw_multilinegraph(data) {
  var margin = {top: 0, right: 20, bottom: 2, left: 50},
      width = 600 - margin.left - margin.right,
      height = 110 - margin.top - margin.bottom;
  console.log(data);
  // Define format of the text value on top of the moving circle
  var formatValue = d3.format(",.1f");

  // Define format for time
  var parseTime = d3.timeParse("%I:%M:%S");
  
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
             symbol : yarray[ix]
          });
        }
    }
    new_data_nest.push({
        key : yarray[ix],
        values:tmp
    });
    }   

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
    console.log(xAxis);
      // The x-axis
      svg.append('g') // create a <g> element
        .attr('class', 'x axis') // specify classes
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis); // let the axis do its thing

      // build 5 y axis
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
        
}

function draw_lines(data) {
      draw_multilinegraph(data);
    }

// function convert(data) {
//     return {
//       day: new Date(d.day),
//       avg_speed: +d.avg_speed,
//       max_speed: +d.max_speed,
//       avg_active_HR: +d.avg_active_HR,
//       ttl_distance: +d.ttl_distance,
//       elevation_gain: +d.elevation_gain,
//       day_no: +d.day_no        // convert string to number
//     };
//   } 

// Function that capitalizes the first letter of a word
function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }