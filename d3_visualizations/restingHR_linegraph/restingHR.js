function resting_linegraph(data) {
    // Define svg limits
    var margin = {top: 20, right: 20, bottom: 50, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Define date parse and format    
    var parseTime = d3.timeParse("%Y-%m-%d"),
        formatDay = d3.timeFormat("%d-%m");

    // format the data
    data.forEach(function(d) {
          d.day = parseTime(d.day);
          d.rest_hr = +d.rest_hr;
          d.day_no = +d.day_no;
    });    

    // Build the y Scale  ///////////////////////////////////////         
    var yScale = d3.scaleLinear()
                   .range([height, 0]);

    // Build the x Scale
    var xScale = d3.scaleTime()
                   .range([0, width]);

    // Build the second y Scale
    var xScale2 = d3.scaleLinear()
                   .range([0, width]);


    // Initialize the line for avg temp /////////////////////
    var restingline = d3.line()
                        .curve(d3.curveBasis)
                        .x(function(d) { return xScale(d.day); })
                        .y(function(d) { return yScale(d.rest_hr); });

    // Build the biketrip area /////////////////////////////////////
    var triparea = d3.area()
                  .curve(d3.curveBasis)
                  .x(function(d,i) {  return xScale2(d.day_no);})
                  .y0(height)
                  .y1(0);

    // Create the graph and name it svg
    var svg = d3.select("#restingHR")
                          .append("svg")
                          .style('width',width + margin.left + margin.right)
                          .style('height',height + margin.top + margin.bottom)
                          .append("g")
                          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data
    xScale.domain(d3.extent(data, function(d) { return d.day; }));
    xScale2.domain([d3.min(data, function(d) { return d.day_no; }),d3.max(data, function(d) { return d.day_no; })]);
    yScale.domain([0, d3.max(data, function(d) { return d.rest_hr; })]);

    // Append highlited biketrip area ////////////////////////////////////////////
    svg.append("path")
      .data([data.slice(5,33)]) // Highlight from day 1 to day 28 of trip
      .attr("class", "area trip")
      .attr("d", triparea);

    // Append avg restingHR line //////////////////////////////////////////////////////////////
    svg.append("path")
       .data([data])
       .attr("class", "resting_line")
       .attr("d", restingline);

    // Build date x-axis
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale)
              .tickFormat(formatDay)
              .ticks(30))
      .selectAll("text")    
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".0em")
        .attr("transform", "translate(-5,0)rotate(-90)");

    // Build day_no x-axis
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale2)
              .tickValues(d3.range(1, 29, 1)))
      .selectAll("text")    
        .style("text-anchor", "end")
        .attr("dx", ".8em")
        .attr("dy", "4.0em")
        .attr("transform", "translate(113,-55)rotate(0)"); // Move the day_no x axis to match the area


    // Build y-axis Left
    svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("class", "left")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".51em")
      .attr("dx", "-8em")
      .style("text-anchor", "end")
      .text("Resting Heartrates (bpm)")
      .style("fill", 'rgb(254,154,152)');

    // Add an image on top of the svg
    d3.selectAll('svg')
    .append('image')
    .attr('xlink:href','rest.png')
    .attr('height', '150')
    .attr('width', '150')
    .attr('x', width/2-margin.right)
    .attr('y', '280');

    // Create a new object for the mouse over effect
    var mouseG = svg.append("g")
              .attr("class", "mouse-over-effects");

    //Thia is the vertical line to follow the mouse
    mouseG.append("path")
      .attr("class", "mouse-line")
      .style("opacity", "0");

    //Get the lines 
    var lines = document.getElementsByClassName('resting_line');

    //Define the 
    var mousePerLine = mouseG.selectAll('.mouse-per-line')
    .data(data)
    .enter()
    .append("g")
    .attr("class", "mouse-per-line");

    mousePerLine.append("circle")
    .attr("r", 7)
    .style("stroke", 'rgb(254,154,152)')
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
    .attr("transform", function(d) {

      var xDay = xScale.invert(mouse[0]),
          bisect = d3.bisector(function(d) { return +d.day_no; }).right;
          idx = bisect(d.rest_hr, xDay);
      
      var beginning = 0,
          end = lines[0].getTotalLength(),
          target = null;


      while (true){
        target = Math.floor((beginning + end) / 2);
        pos = lines[0].getPointAtLength(target);
        if ((target === end || target === beginning) && pos.x !== mouse[0]) {
            break;
        }
        if (pos.x > mouse[0])      end = target;
        else if (pos.x < mouse[0]) beginning = target;
        else break; //position found
      }
      
      d3.select(this).select('text')
        .text(yScale.invert(pos.y).toFixed(2)+ ' bpm');
      
      return "translate(" + mouse[0] + "," + pos.y +")";
    });
});

}// End of resting_linegraph