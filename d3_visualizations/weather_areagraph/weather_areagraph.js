function areagraph(data) {
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 1200 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    // Define the colors
    var color = ["#ff7f0e","#1f77b4"]
    
    // Define format of the text value on top of the moving circle
    var formatValue = d3.format(",.1f");

    // Create a bisect to handle the position of the mouse in relation with the data on mousemove
    var bisect = d3.bisector(function(d){ return +d.day_no; }).left; // NEW STAFF

    // variable to hold our yscales
    var yarray = ['temperature', 'wind'];

    // Intitialize new nested dataset
    var new_data_nest = [];

    // Create the nested dataset
    for ( var ix=0; ix<2; ix++) {
    // Create helper array to build the nested dataset 
    var tmp = []; 
    if (ix==0){
        for ( var i=0; i<data.length; i++) {
         tmp.push(
            {value : +data[i]['mean_temp'],
             symbol : yarray[ix]
          });
        }
    }
    else if (ix==1) {
        for ( var i=0; i<data.length; i++) {
         tmp.push(
            {value : +data[i]['mean_wind'],
             symbol : yarray[ix]
          });
        }
    }
    new_data_nest.push({
        key : yarray[ix],
        values:tmp
    });
    }   
    
    // Build the y Scales  ///////////////////////////////////////         
    var yScale = d3.scaleLinear()
                    .range([height, 0]);

    // Build the x Scale
    var xScale = d3.scaleLinear()
                   .range([0, width]);

    // Build the x axis
    var xAxis = d3.axisBottom()
                .scale(xScale)
                .tickValues(d3.range(1, 29, 1));

    var yAxisLeft = d3.axisLeft()
                    .scale(yScale);

    var yAxisRight = d3.axisRight()
                    .scale(yScale);
    
    // Build temp area /////////////////////////////////////
    var tempGenerator = d3.area()
                        .curve(d3.curveBasis)
                        .x(function(d) { return xScale(+d.day_no); })
                        .y0(function(d) { return yScale(+d.min_temp); })
                        .y1(function(d) { return yScale(+d.max_temp); });

    // Build wind area /////////////////////////////////////
    var windGenerator = d3.area()
                        .curve(d3.curveBasis)
                        .x(function(d) { return xScale(+d.day_no); })
                        .y0(function(d) { return yScale(+d.min_wind); })
                        .y1(function(d) { return yScale(+d.max_wind); });

    // Initialize the line for avg temp /////////////////////
    var templine = d3.line()
                    .curve(d3.curveBasis)
                    .x(function(d) { return xScale(+d.day_no); })
                    .y(function(d) { return yScale(+d.mean_temp); });

    // Initialize the line for avg wind /////////////////////
    var windline = d3.line()
                    .curve(d3.curveBasis)
                    .x(function(d) { return xScale(+d.day_no); })
                    .y(function(d) { return yScale(+d.mean_wind); });

    // Build the domains of scales /////////////////////////////////
    // Add 0.5 to leave gaps before and after the x-axes and the linegraphs
    xScale.domain([
        d3.min(data, function(d) { return Math.min(+d.day_no)-0.5}), 
        d3.max(data, function(d) { return Math.max(+d.day_no)+0.5; })
    ]);

    yScale.domain([
        d3.min(data, function(d) { return Math.min(+d.min_temp,+d.min_wind)}), 
        d3.max(data, function(d) { return Math.max(+d.max_temp,+d.max_wind); })
    ]);

    // Create the graph and name it svg
    var svg = d3.select("#weather")
                          .append("svg")
                          .style('width',width + margin.left + margin.right)
                          .style('height',height + margin.top + margin.bottom)
                          .append("g")
                          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Initiate the data sourcing
    svg.datum(data);

    // Append area between maxtemp and mintemp ////////////////////////////////////////////
    svg.append("path")
      .attr("class", "area temp")
      .attr("d", tempGenerator)
      .style("fill", color[0])
      .on("mouseover", function() {
        $(".left").css({
            "font-weight":"bold",
            "font-size" : "12px"
        });
      })
      .on("mouseout", function() {
        $(".left").css({
            "font-weight":"normal",
            "font-size" : "10px"
        });
      });

    // Append avg temp line //////////////////////////////////////////////////////////////
    svg.append("path")
       .attr("class", "line")
       .attr("d", templine);

    // Append area between maxwind and minwind ////////////////////////////////////////////
    svg.append("path")
      .attr("class", "area wind")
      .attr("d", windGenerator)
      .style("fill", color[1])
      .on("mouseover", function() {
        $(".right").css({
            "font-weight":"bold",
            "font-size" : "12px"
        });
      })
      .on("mouseout", function() {
        $(".right").css({
            "font-weight":"normal",
            "font-size" : "10px"
        });
      });

    // Append avg wind line //////////////////////////////////////////////////////////////
    svg.append("path")
       .attr("class", "line")
       .attr("d", windline);

    // Build x-axis
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    // Build y-axis Left
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxisLeft)
      .append("text")
      .attr("class", "left")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".51em")
      .attr("dx", "-32em")
      .style("text-anchor", "end")
      .text("Temperature (ºC)")
      .style("fill", color[0]);
      
    // Build y-axis right
    svg.append("g")             
        .attr("class", "y axis")    
        .attr("transform", "translate(" + width + " ,0)")    
        .call(yAxisRight)
        .append("text")
        .attr("class", "right")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 1)
        .attr("dy", "-.65em")
        .attr("dx", "-6em")
        .style("text-anchor", "end")
        .text("Wind Speed (km/h)")
        .style("fill", color[1]);

    // Create a new object for the mouse over effect
    var mouseG = svg.append("g")
                    .attr("class", "mouse-over-effects");

    //Thia is the vertical line to follow the mouse
    mouseG.append("path")
            .attr("class", "mouse-line")
            .style("opacity", "0");

    //Get the lines 
    var lines = document.getElementsByClassName('line');

    //Define the 
    var mousePerLine = mouseG.selectAll('.mouse-per-line')
      .data(new_data_nest)
      .enter()
      .append("g")
      .attr("class", "mouse-per-line");

    mousePerLine.append("circle")
      .attr("r", 7)
      .style("stroke", function(d,i) {
        return color[i];
      })
      .style("fill", "none")
      .style("stroke-width", "1px")
      .style("opacity", "0");

    mousePerLine.append("text")
      .attr("transform", "translate(10,3)");

    mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
      .attr('width', width) // can't catch mouse events on a g element
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', function() { // on mouse out hide line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "0");
      })
      .on('mouseover', function() { // on mouse in show line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "1");
      })
      .on('mousemove', function() { // mouse moving over canvas
        var mouse = d3.mouse(this);
        d3.select(".mouse-line")
          .attr("d", function() {
            var d = "M" + mouse[0] + "," + height;
            d += " " + mouse[0] + "," + 0;
            return d;
          });

        d3.selectAll(".mouse-per-line")
          .attr("transform", function(d, i) {
        
            var xDay = xScale.invert(mouse[0]),
                bisect = d3.bisector(function(d) { return +d.day_no; }).right;
                idx = bisect(d.values, xDay);
            
            var beginning = 0,
                end = lines[i].getTotalLength(),
                target = null;


            while (true){
              target = Math.floor((beginning + end) / 2);
              pos = lines[i].getPointAtLength(target);
              if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                  break;
              }
              if (pos.x > mouse[0])      end = target;
              else if (pos.x < mouse[0]) beginning = target;
              else break; //position found
            }
            
            d3.select(this).select('text')
              .text(yScale.invert(pos.y).toFixed(2));
            
            return "translate(" + mouse[0] + "," + pos.y +")";
          });
 });

}// End of areagraph function