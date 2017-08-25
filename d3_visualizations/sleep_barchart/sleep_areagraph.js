function sleep_areagraph(raw) {

  // Define the formats
  var parseTime = d3.utcParse("%Y-%m-%dT%H:%M:%S.%L"),
      formatHour = d3.utcFormat("%-I:%M %p"),
      formatMonth = d3.utcFormat("%B"),
      formatDay = d3.utcFormat("%a");

  // Initiate an empty dictionary
  data = {} 

  // Add an incremenal day at the main data, starting from the start date
  for (var i=0; i<raw.length; i++) {
    data[i] = [parseTime(raw[i].asleep), parseTime(raw[i].awake)];
  }

  // Define the starting date (one day before the first sleeping day)
  var startdate = d3.utcDay.offset(date(data[0][0]), -1);

  // Add extra data in the main dataset
  for (var i=0; i<raw.length; i++) {
    data[i].day = d3.utcDay.offset(startdate, i)
    data[i].nextday = d3.utcDay.offset(startdate, i+1)
    data[i].day_no = i+1
  }

  // Initiate a new svg to place the graph
  var svg = d3.select("#areagraph").append("svg"),
      margin = {top: 0, right: 0, bottom: 0, left: 70},
      width = svg.attr("width") - margin.left - margin.right,
      height = svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Define the x scale
  var x = d3.scaleLinear()
            .range([0, width]);

  // Define the y scale
  var y = d3.scaleUtc()
      .domain([date(20.65 * 36e5), date(35.35 * 36e5)]) // about 7:40 PM to 8:20 AM (19.65 - 32.35)
      .rangeRound([0, height]);

  // Define the area of the bars
  var area = d3.area()
      .curve(d3.curveStepAfter)
      .x(function(d) { return x(d.day_no); })
      .y0(function(d) { return y(date(d[0] - d.day)); })
      .y1(function(d) { return y(date(d[1] - d.day)); });

  // Add the y axis
  g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y)
          .tickFormat(formatHour)
          .tickSize(-width)
          .tickPadding(20));

  // Define the first and the last day of measurements
  var date0 = data[0].day,
      date1 = d3.utcDay.offset(data[raw.length - 1].day, 1);

  // Apply the above to the domain of x scale
  x.domain([1,29]); //date0, date1

  // Build the x axis
  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
          .tickValues(d3.range(1, 29, 1))
          .tickSize(-height)
          .tickPadding(0))
    .selectAll("text")
      .attr("text-anchor", "start")
      .attr("x", 10)
      .attr("dy", null);

  // Add one last datum with 0 sleep at the end
  g.insert("path", ".axis")
      .datum(data.concat({day: date1, 0: 0, 1: 0, day_no: 29, nextday: 0})) // for step-after
      .attr("class", "data")
      .attr("d", area);

}// End of sleep_areagraph

function date(offset) {
  return new Date(offset);
}

