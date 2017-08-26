function sleep_areagraph(raw) {
  // Define the boundaries of the graph
  var margin = {top: 20, right: 70, bottom: 30, left: 70},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  // Define the formats
  var parseTime = d3.utcParse("%Y-%m-%dT%H:%M:%S.%L"),
      formatHour = d3.utcFormat("%-I:%M %p");
      
  // Define the starting date (one day before the first sleeping day)
  var startdate = d3.utcDay.offset(date(parseTime(raw[0].asleep)),-1);

  // Initiate an empty dictionary
  data = []; 

  // Add an incremenal day at the main data, starting from the start date
  for (var i=0; i<raw.length; i++) {
    data[i] = [parseTime(raw[i].asleep), parseTime(raw[i].awake)];
    data[i].day = d3.utcDay.offset(startdate, i)
    data[i].nextday = d3.utcDay.offset(startdate, i+1)
    data[i].day_no = i+1
    data[i].sleep_min = +raw[i].sleep_min
  }

  // Initiate a new svg to place the graph
  var svg = d3.select("#areagraph")
              .append("svg")
              .style('width',width + margin.left + margin.right)
              .style('height',height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Define the x scale
  var x = d3.scaleLinear()
            .range([0, width]);

  // Define the left y scale
  var yLeft = d3.scaleUtc()
            .domain([date(20.65 * 36e5), date(35.35 * 36e5)]) // about 9:00 PM to 11:00 AM (19.65 - 32.35)
            .rangeRound([0, height]);

  // Define the right y scale
  var yRight = d3.scaleLinear()
              .domain([ 0,d3.max(data, function(d) { return +d.sleep_min })])
              .range([height, 0]);

  // Define the area of the bars
  var area = d3.area()
              .curve(d3.curveStepAfter)
              .x(function(d) { return x(d.day_no); })
              .y0(function(d) { return yLeft(date(d[0] - d.day)); })
              .y1(function(d) { return yLeft(date(d[1] - d.day)); });

  // Initialize the line for min of sleep
  var sleepline = d3.line()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d.day_no+0.5); })
                    .y(function(d) { return yRight(d.sleep_min); });

  // Add the left y axis
  svg.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(yLeft)
          .tickFormat(formatHour)
          .tickSize(-width)
          .tickPadding(20));

  // Add the right y axis
  svg.append("g")             
      .attr("class", "axis axis--y") 
      .call(d3.axisRight(yRight))   
      .attr("transform", "translate(" + (width+20) + " ,0)")
      .append("text")
      .attr("class", "right")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 1)
      .attr("dy", "3.65em")
      .attr("dx", "-2em")
      .style("text-anchor", "end")
      .text("Sleeping minutes")
      .style("fill", '#000');

  // Define the first and the last day of measurements
  var date0 = data[0].day,
      date1 = d3.utcDay.offset(data[data.length - 1].day, 1);
  
  // Set the limits to the domain of x and y scales
  x.domain([
            d3.min(data, function(d) { return Math.min(+d.day_no)}),
            d3.max(data, function(d) { return Math.max(+d.day_no)+1})
  ]);
  
  // Build the x axis
  svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
          .tickValues(d3.range(1, data.length+1 , 1))
          .tickSize(-height)
          .tickPadding(0))
    .selectAll("text")
      .attr("text-anchor", "start")
      .attr("x", 10)
      .attr("dy", null);

  // Add an image on top of the svg
  d3.selectAll('svg')
    .append('image')
    .attr('xlink:href','sleep.png')
    .attr('height', '250')
    .attr('width', '250')
    .attr('x', '400')
    .attr('y', '270');

  // Append sleep line 
  svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", sleepline);

  // Add one last datum with 0 sleep at the end
  svg.insert("path", ".axis")
      .datum(data.concat({day: date1, 0: 0, 1: 0, day_no: 29, nextday: 0})) // for step-after
      .attr("class", "data")
      .attr("d", area);

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
    .data(data)
    .enter()
    .append("g")
    .attr("class", "mouse-per-line");

  mousePerLine.append("circle")
    .attr("r", 7)
    .style("stroke", 'rgb(100,186,226)')
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
      
          var xDay = x.invert(mouse[0]),
              bisect = d3.bisector(function(d) { return +d.day_no; }).right;
              idx = bisect(d.sleep_min, xDay);
          
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
            .text(yRight.invert(pos.y).toFixed(2)+ ' mins');
          
          return "translate(" + mouse[0] + "," + pos.y +")";
        });
});

  

}// End of sleep_areagraph

function date(offset) {
  return new Date(offset);
}

