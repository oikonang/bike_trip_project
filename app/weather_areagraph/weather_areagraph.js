function areagraph(data) {
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // var margin = {top: 20, right: 20, bottom: 30, left: 50},
    //       width = 1200 - margin.left - margin.right,
    //       height = 600 - margin.top - margin.bottom;
    
    // Build the temp lines
    var maxtempLine = d3.line()
                .x(function(d) { return xScale(+d.day_no); })
                .y(function(d) { return tempScale(+d.max_temp); });

    var mintempLine = d3.line()
                .x(function(d) { return xScale(+d.day_no); })
                .y(function(d) { return tempScale(+d.min_temp); });

    // Build the wind lines
    var maxwindLine = d3.line()
                .x(function(d) { return xScale(+d.day_no); })
                .y(function(d) { return windScale(+d.max_wind); });

    var minwindLine = d3.line()
                .x(function(d) { return xScale(+d.day_no); })
                .y(function(d) { return windScale(+d.min_wind); });
    
    // Build the y Scales           
    var tempScale = d3.scaleLinear()
                      .rangeRound([height, 0]);

    var windScale = d3.scaleLinear()
                      .rangeRound([height, 0]);

    // Build the x Scale
    var xScale = d3.scaleLinear()
                   .rangeRound([0, width]);

    // Build the x axis
    var xAxis = d3.axisBottom()
                .scale(xScale)

    // Build the domains of scales
    // Hardcoded because it is always from 1 to 28 days
    // xScale.domain([1,28]);
    xScale.domain(d3.extent(data, function(d) { return +d.day_no; }));
    tempScale.domain([0, d3.max(data, function(d) { return +d.max_temp; })]);
    windScale.domain([0, d3.max(data, function(d) { return +d.max_wind; })]);



    var svg = d3.select("svg")//.append("svg");

    var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var area = d3.area()
                .x(function(d) { return xScale(+d.day_no); })
                .y1(function(d) { return tempScale(+d.max_temp); });

    area.y0(tempScale(0));

    g.append("path")
      .datum(data)
      .attr("fill", "steelblue")
      .attr("d", area);

      g.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(xScale));

      g.append("g")
          .call(d3.axisLeft(tempScale))
        .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("Price ($)");
    // Add an SVG element for each symbol, with the desired dimensions and margin.
    // var area = d3.select("#weather")
    //             .datum(data) 
    //             .enter().append("svg")
    //             .attr("width", width + margin.left + margin.right)
    //             .attr("height", height + margin.top + margin.bottom);



}// End of areagraph function