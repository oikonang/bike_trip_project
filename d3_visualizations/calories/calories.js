function calories_graph(data) {
    // Define the margins of the svg
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

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
    }); 
    
    // Define the color scale
    var color = ["rgb(145,207,96)","rgb(252,141,89)"]

    // Define the x-scale
    var x = d3.scaleLinear()
              .range([0, width]);

    // Define the y-scale
    var y = d3.scaleLinear()
              .range([height, 0]);

    // Define the axis
    var xAxis = d3.axisBottom(x)
                  .tickValues(d3.range(1, 29, 1));

    var yAxis = d3.axisLeft(y);

    // Define the line of burnt (if the burnt is greater then consumed calories, we are possitive so we lose weight)
    var burntline = d3.area()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d.day_no); })
                    .y(function(d) { return y(d["burnt"]); });

    // Define the line of consumed calories
    var consumedline = d3.area()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d.day_no); })
                    .y(function(d) { return y(d["consumed"]); });

    // Define the area of burnt
    var burntarea = d3.area()
        .curve(d3.curveBasis)
        .x(function(d) { return x(d.day_no); })
        .y1(function(d) { return y(d["burnt"]); });

    // Initiate the svg and append it to div
    var svg = d3.select("#calories").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define the domains
    x.domain(d3.extent(data, function(d) { return d.day_no; }));
    y.domain([
    d3.min(data, function(d) { return Math.min(d["consumed"], d["burnt"]); }),
    d3.max(data, function(d) { return Math.max(d["consumed"], d["burnt"]); })
    ]);

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

    // Build the legend
    var legend = svg.selectAll('g')
      .data(['one','two']) //input dummy data
      .enter()
      .append('g')
      .attr('class', 'legend');

    legend.append('rect')
      .attr('x', width - margin.left*2)
      .attr('y', function(d, i) {
        return i * 20;
      })
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', function(d,i) {
        return color[i];
      });

    legend.append('text')
      .attr('x', width - margin.left*1.7)
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
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Calories (Kcal)");

    
}