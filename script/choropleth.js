function init() {
    let w = 1000;
    let h = 700;
    const sensitivity = 75;

    let nzLocation = [];
    let nzCentroid;

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background-color", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("visibility", "hidden");

    // Create a new projection using the Mercator projection
    let projection = d3.geoOrthographic()
        .center([0, 0])
        .scale(250)
        .rotate([190, 50])
        .translate([w / 2, h / 2]);


    const initialScale = projection.scale()
    // Create a new path using the projection
    let path = d3.geoPath()
        .projection(projection);

    let svg = d3.select("#map")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    let globe = svg.append("circle")
        .attr("fill", "#EEE")
        .attr("stroke", "#000")
        .attr("stroke-width", "0.2")
        .attr("cx", w / 2)
        .attr("cy", h / 2)
        .attr("r", initialScale)

    var color = d3.scaleSequential(d3.interpolateBlues).domain([0, 5000]).unknown('grey');
    let selectedValue = 2013;


    var geoGenerator = d3.geoPath()
        .projection(projection)
        .pointRadius(4);

    // Load the JSON file and draw the map
    d3.csv("dataset/NZ_MIGRATION.csv").then(function (d) {
        d3.json("dataset/world.json").then(function (json) {
            let dataValue;
            for (var i = 0; i < d.length; i++) {
                let dataState = d[i].country; // Get the LGA from the CSV 
                let dataYear = parseInt(d[i].year);
                if (dataYear == selectedValue) {
                    console.log(dataYear);
                    dataValue = parseFloat(d[i].estimate);
                }// Get the unemployment rate from the CSV data
                for (var j = 0; j < json.features.length; j++) {
                    var jsonState = json.features[j].properties.name; // Get the LGA name from the JSON data

                    if (jsonState == "New Zealand") {
                        const centroid = path.centroid(json.features[j]);
                        nzCentroid = path.centroid(json.features[j]);
                        nzLocation = projection.invert(centroid)

                    }

                    // Check if the LGA names match
                    if (dataState == jsonState) {
                        json.features[j].properties.value = dataValue; // Set the value property in the JSON data
                        break;
                    }
                }
            }
            function updateJson() {
                for (var j = 0; j < json.features.length; j++) {
                    json.features[j].properties.value = undefined;
                }
                //code for setting the value as per the filter
                for (var i = 0; i < d.length; i++) {
                    let dataState = d[i].country; // Get the LGA from the CSV 
                    let dataYear = parseInt(d[i].year);
                    if (dataYear == selectedValue) {
                        console.log(dataYear);
                        dataValue = parseFloat(d[i].estimate);
                    }// Get the unemployment rate from the CSV data
                    for (var j = 0; j < json.features.length; j++) {
                        var jsonState = json.features[j].properties.name; // Get the LGA name from the JSON data

                        if (jsonState == "New Zealand") {
                            const centroid = path.centroid(json.features[j]);
                            nzCentroid = path.centroid(json.features[j]);
                            nzLocation = projection.invert(centroid)

                        }

                        // Check if the LGA names match
                        if (dataState == jsonState) {
                            json.features[j].properties.value = dataValue; // Set the value property in the JSON data
                            break;
                        }
                    }
                }
            }
            d3.select("#mySlider").on("change", async function (d) {
                selectedValue = this.value;
                console.log(selectedValue);
                updateJson();
                svg.selectAll("path").attr("fill", function (data) {
                    if (data.properties.name === "New Zealand") {
                        return "red";
                    } else {
                        return color(data.properties.value);
                    }
                })
                    .attr("class", function (d) {
                        return "country"
                    }).transition().duration(5);

            })
            svg.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("fill", function (data) {
                    if (data.properties.name === "New Zealand") {
                        return "red";
                    } else {
                        return color(data.properties.value);
                    }
                })
                .attr("class", function (d) {
                    return "country"
                })
                .attr("stroke", "black")
                .attr("stroke-width", 0.2)
                .on("mouseover", function (event, d) {
                    const centroid = path.centroid(d); // Get the centroid of the country
                    const lonlat = projection.invert(centroid)
                    const name = d.properties.name; // Get the name of the country
                    const value = d.properties.value;


                    // Show tooltip
                    d3.select(".tooltip")
                        .style("opacity", 1)
                        .html(name + "\n" + value)
                        .style("left", (centroid[0] + 10) + "px")
                        .style("top", (centroid[1] + 10) + "px");
                    d3.select(this).attr("stroke", "black");
                    d3.select(this).attr("stroke-width", "2");


                    d3.selectAll(".country")
                        .transition()
                        .duration(100)
                        .style("opacity", .5)

                    d3.select(this)
                        .transition()
                        .duration(100)
                        .style("opacity", 1)


                    var geoInterpolator = d3.geoInterpolate(nzLocation, lonlat);
                    svg.append('path')
                        .datum({ type: 'LineString', coordinates: [nzLocation, lonlat] })
                        .attr('d', geoGenerator)
                        .style('stroke', 'red')
                        .style('stroke-width', 1)
                        .style('fill', 'none')
                        .attr('id', "lineCountry");
                    svg.append('circle')
                        .attr('id', 'runningCircle')
                        .attr('r', 2)
                        .attr('fill', 'red')
                        .attr('cx', nzCentroid[0])
                        .attr('cy', nzCentroid[1])
                        .transition()
                        .duration(2000)
                        .attrTween('cx', function () {
                            return function (t) {
                                const currentCoord = geoInterpolator(t);
                                return projection(currentCoord)[0];
                            }
                        })
                        .attrTween('cy', function () {
                            return function (t) {
                                const currentCoord = geoInterpolator(t);
                                return projection(currentCoord)[1];
                            }
                        });


                })
                .on("mouseout", function (d) {
                    d3.select(this).attr("stroke", "black");
                    d3.select(this).attr("stroke-width", "0.2");
                    d3.select(".tooltip").style("opacity", 0);
                    d3.selectAll(".country")
                        .transition()
                        .duration(100)
                        .style("opacity", 1)
                    d3.select("#route").remove();
                    d3.select('#lineCountry').remove();
                    d3.select("#runningCircle").remove();
                });

            console.log(nzLocation);
        });
    })

    let zoom = d3.zoom().on('zoom', function (event) {
        if (event.transform.k > 0.3) {
            projection.scale(initialScale * event.transform.k)

            path = d3.geoPath().projection(projection)
            svg.selectAll("path").attr("d", path)
            globe.attr("r", projection.scale())
        } else {
            event.transform.k = 0.3
        }
    });

    let drag = d3.drag().on('drag', function (event) {
        // Change these data to see ho the great circle reacts

        const rotate = projection.rotate()
        const k = sensitivity / projection.scale()
        projection.rotate([
            rotate[0] + event.dx * k,
            rotate[1] - event.dy * k
        ])


        path = d3.geoPath().projection(projection)
        svg.selectAll("path").attr("d", path)


    });

    function drawColorScaleBar(colorScale) {
        const legendSvg = d3.select("#legend")
            .append("svg")
            .attr("width", 200)
            .attr("height", 20);

        const gradient = legendSvg.append("defs")
            .append("linearGradient")
            .attr("id", "colorGradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(0));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(1000));

        legendSvg.append("rect")
            .attr("width", 200)
            .attr("height", 20)
            .style("fill", "url(#colorGradient)");

        const legendAxis = d3.axisBottom(colorScale)
            .ticks(5)
            .tickSize(0)
            .tickFormat(d3.format(".0f"));

        legendSvg.append("g")
            .attr("transform", "translate(0, 20)")
            .call(legendAxis);
    }

    // Call the function passing your color scale

    drawColorScaleBar(color);
    svg.call(drag);
    svg.call(zoom);
}

window.addEventListener('load', init);