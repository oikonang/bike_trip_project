function calories_graph(data) {
    // Define the margins of the svg
    var margin = {top: 20, right: 30, bottom: 30, left: 50},
        width = 1200 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    // Define the format of the 
    var parseDate = d3.timeParse("%Y%m%d")

    // format the data
    data.forEach(function(d) {
          d.day = parseDate(d.date);
          d.day_no = +d.day_no;
          d.water = +d.water;
          d.consumed = +d.consumed;
          d.burnt = +d.burnt;
          d.need = +d.need;
          d.burnt_moves = +d.ttl_cal_burnt;
    }); 
    
    // Define the color scale
    var color = ["rgb(145,207,96)","rgb(252,141,89)"]

    // Define the x-scales
    var x = d3.scaleLinear()
              .range([0, width]);

    var xBar = d3.scaleBand()
                .rangeRound([0, width])
                .padding(0.1);

    // Define the y-scales
    var y = d3.scaleLinear()
              .range([height, 0]);

    var yBar = d3.scaleLinear()
                .range([height, 0]);

    // Define the axis
    var xAxis = d3.axisBottom(x)
                  .tickValues(d3.range(1, 29, 1));

    var yAxis = d3.axisLeft(y)
                  .tickValues(d3.range(2000,5000,500));

    var yAxisRight = d3.axisRight(yBar)
                    .tickValues(d3.range(0.5,5.5,0.5)) // Define the limit of the water axis
                    .tickFormat(d3.format(".1f"))
                    .tickSize(-width+margin.right/2)
                    .ticks(10);

    // Define the line of burnt (if the burnt is greater then consumed calories, we are possitive so we lose weight)
    var burntline = d3.area()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d.day_no); })
                    .y(function(d) { return y(d["burnt_moves"]); });

    // Define the line of consumed calories
    var consumedline = d3.area()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d.day_no); })
                    .y(function(d) { return y(d["consumed"]); });

    // Define the area of burnt
    var burntarea = d3.area()
        .curve(d3.curveBasis)
        .x(function(d) { return x(d.day_no); })
        .y1(function(d) { return y(d["burnt_moves"]); });

    // Initiate the svg and append it to div
    var svg = d3.select("#calories").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define the domains
    x.domain([
        d3.min(data, function(d) { return d.day_no; })-1, //move the yaxis from the areagrahs
        d3.max(data, function(d) { return d.day_no; })+1,
    ]);
    y.domain([0,
        //d3.min(data, function(d) { return Math.min(d["consumed"], d["burnt_moves"]); }),
        d3.max(data, function(d) { return Math.max(d["consumed"], d["burnt_moves"]); })
    ]);
    xBar.domain(data.map(function(d,i) { return i-1; }));
    yBar.domain([0, d3.max(data, function(d) { return d["water"]; }) + 7]); // take down the limits of the water y axis

    // Add the data to the whole svg
    svg.datum(data);

    // Append the paths of the areas and the coloring
    svg.append("clipPath")
        .attr("id", "clip-below")
        .append("path")
        .attr("d", burntarea.y0(height));

    svg.append("clipPath")
        .attr("id", "clip-above")
        .append("path")
        .attr("d", burntarea.y0(0));

    svg.append("path")
        .attr("class", "area above")
        .attr("clip-path", "url(#clip-above)")
        .attr("d", burntarea.y0(function(d) { return y(d["consumed"]); }));

    svg.append("path")
        .attr("class", "area below")
        .attr("clip-path", "url(#clip-below)")
        .attr("d", burntarea);

    // Append the lines to the svg
    svg.append("path")
        .attr("class", "line")
        .attr("d", burntline)
        .style("stroke", "rgb(145,207,96)");

    svg.append("path")
        .attr("class", "line")
        .attr("d", consumedline)
        .style("stroke", "rgb(252,141,89)");

    // The water bars
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d, ix) { return x(d.day_no-0.45); }) // Centralized bars on the x-axis
        .attr("width", xBar.bandwidth())
        .attr("y", function(d) { return yBar(d["water"]); })
        .attr("height", function(d) { return height - yBar(d["water"]); });

    // Build the legend
    var legend = svg.selectAll('g')
      .data(['one','two']) //input dummy data
      .enter()
      .append('g')
      .attr('class', 'legend');

    legend.append('rect')
      .attr('x', width - margin.left*2.5)
      .attr('y', function(d, i) {
        return i * 20;
      })
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', function(d,i) {
        return color[i];
      });

    legend.append('text')
      .attr('x', width - margin.left*2.2)
      .attr('y', function(d, i) {
        return (i * 20) + 9;
      })
      .text(function(d,i) {
        if (i==0){
            return 'lose weight';
        }
        else {
            return 'gain weight'
        }
      } );

    // Append the x and y axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis left")
        .call(yAxis)
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .attr("dx", "-5em")
        .style("text-anchor", "end")
        .text("Calories (Kcal)");

    // Build y-axis right
    svg.append("g")             
        .attr("class", "y axis right")    
        .attr("transform", "translate(" + width + " ,0)")    
        .call(yAxisRight)
        .append("text")
        .attr("class", "right")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 1)
        .attr("dy", "-.65em")
        .attr("dx", "-32em")
        .style("text-anchor", "end")
        .text("Water Consumption(L)");
}