function areagraph(data) {
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Build the y Scales  ///////////////////////////////////////         
    var yScale = d3.scaleLinear()
                    .range([height, 0]);

    // Build the x Scale
    var xScale = d3.scaleLinear()
                   .range([0, width]);

    // Build the x axis
    var xAxis = d3.axisBottom()
                .scale(xScale)

    var yAxisLeft = d3.axisLeft()
                        .scale(yScale)

    var yAxisRight = d3.axisRight()
                        .scale(yScale)
    
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

    // Build the domains of scales /////////////////////////////////
    xScale.domain(d3.extent(data, function(d) { return +d.day_no; }));
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
      .attr("d", tempGenerator);

    // Append area below mintemp
    svg.append("path")
      .attr("class", "area wind")
      .attr("d", windGenerator);
    
    
    // Build x-axis
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    // FIX THE TEXT TO BE DISPLAYED
    // Build y-axis Left
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxisLeft)
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Temperature (ºC)")
      .style("fill", 'rgb(252,141,89)')
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 1)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Wind Speed (km/h)")
      .style("fill", 'rgb(252,141,89)');

    // svg.append("g")             
    //     .attr("class", "y axis")    
    //     .attr("transform", "translate(" + width + " ,0)")   
    //     .style("fill", "red")       
    //     .call(yAxisRight);


}// End of areagraph function