d3.json("raw.json").then((data) => { vizJSON(data.obs) })

//main function
const vizJSON = function (data) {
    let totalConf = 0;
    let numConf = 0;
    let maxConf = 0;
    let minConf = 100;

    /*
    Explore in terms of tags
    */


    /*
    if we wants to highlight what time of day
    might be good to have a filter of time/season
    let's play with the scale first

    Explore confidence level data
    */


    for (let d in data) {
        //console.log("prediction", data[d].predictions)
        let pred = data[d].predictions
        for (let predId in pred) {
            if (pred[predId].confidence < minConf) {
                minConf = pred[predId].confidence
            }
            //console.log(pred[predId].confidence)
            if (pred[predId].confidence > maxConf) {
                maxConf = pred[predId].confidence
            }
            totalConf += pred[predId].confidence;

            numConf += 1;
        }
    }

    const toMiliSecConst = 60 * 60 * 1000;
    //  const UTCtoPSTOffset = (new Date()).getHours() - (new Date()).getUTCHours();
    //convert all time data to miliseconds after UTC hour to prevent time range being repetitive
    const convertToUTCTime = (timeString) => {
        const dateObj = new Date(timeString)
        return (dateObj.getUTCHours() * toMiliSecConst + dateObj.getUTCMinutes() * 60 * 1000 + dateObj.getUTCSeconds() * 1000 + dateObj.getUTCMilliseconds())
    }
    //  const timeDomain = d3.extent([-toMiliSecConst * UTCtoPSTOffset, toMiliSecConst * (23 - UTCtoPSTOffset)]) //scale time domain back to PST Time
    const timeDomain = d3.extent([0, toMiliSecConst * 24])
    // const timeDomain = d3.extent(data, (d) => convertToUTCTime(new Date(d.timestamp)))
    const monthDomain = d3.extent(data, d => (new Date(d.timestamp)).setUTCFullYear(2020)) //.setFullYear(2020) so we don't have repeated months
    //initiate size of visualization
    const width = window.innerWidth * 80 / 100;
    const height = window.innerHeight * 90 / 100;
    const margin = width > 599 ? 90 : 10;

    const confidenceExtent = d3.extent(data, d => d.whaleFoundConfidence);

    const sortedConfidence = data.map(d => d.whaleFoundConfidence).sort(d3.ascending);
    /* 
        const firstQuant = d3.quantileSorted(sortedConfidence, 0.25, d => d.whaleFoundConfidence);
    
        const secondQUant = d3.quantileSorted(sortedConfidence, 0.5, d => d.whaleFoundConfidence);
    
        const thirdQuant = d3.quantileSorted(sortedConfidence, 0.75, d => d.whaleFoundConfidence); */

    const dayTimeScale = d3.scaleTime().domain(timeDomain).range([margin, width - margin]).nice(); //cx

    const monthScale = d3.scaleTime().domain(monthDomain).range([height, margin * 4 / 3]).nice() //cy
    /*
    for hour of day to see Pigeon tag
    */
    //tbd add pigeon tag filter
    //for pigeon

    const form = document.getElementById("filter-form");

    const tagToggle = document.getElementById("pigeon-tag");

    let pigeonPlot;

    pigeonPlot = d3.select('body').select('#pigeon-plot')
        .append('svg')
        .attr('id', "main-chart")
        .attr('width', width)
        .attr('height', height)

    const xAxisInit = d3.axisBottom(dayTimeScale).tickFormat(d3.timeFormat('%H:%M'))
    const xAxis = pigeonPlot.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(${margin * 1 / 3}, ${height - margin})`)
        .call(xAxisInit)

    const yAxisInit = d3.axisLeft(monthScale).ticks(d3.timeMonth).tickFormat((d) => d.toLocaleString('default', { month: 'long' }))
    //study call func when get up
    const yAxis = pigeonPlot.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${margin * 4 / 3}, ${-margin})`)
        .call(yAxisInit)

    //style the tick texts and length
    const arr = [yAxis, xAxis]
    arr.forEach((element) => {
        element.selectAll("g.tick")
            .style("stroke-width", "1px")
            .select("text")
            .attr("class", "tick-text");

        element.select("path")
            .style("stroke-width", "2px")
    });
    //axe labeling
    pigeonPlot.append('text')
        .attr("class", "axis-label")
        .attr('text-anchor', 'middle')
        .attr('x', margin)
        .attr('y', margin / 6)
        .html('Month')
        .style("font-size", "1rem")

    pigeonPlot.append('text')
        .attr("class", "axis-label")
        .attr('text-anchor', 'middle')
        .attr('x', width - margin)
        .attr('y', height - margin / 2)
        .html('Hour of Day')
        .style("font-size", "1rem")

    pigeonPlot.append('defs').append('SVG:clipPath')
        .attr("id", "clip")
        .append("SVG:rect")
        .attr("width", width - margin * 2)
        .attr("height", height - margin)
        .attr("x", margin * 4 / 3)
        .attr("y", 0)

    const pigeonDataArea = pigeonPlot.append("g").attr('clip-path', "url('#clip')");

    const confidenceScale = d3.scaleQuantize().domain(confidenceExtent).range(['#F5A15C', '#FFE277', '#B4F3F2', '#70ABF1']);

    const interpolator = d3.interpolate(...confidenceExtent)
    const confidenceLevels = d3.quantize(interpolator, 5) //4 levels of whale found confidence
    console.log(confidenceLevels)
    console.log(confidenceExtent, "Extent")

    const popoverMargin = 10;

    let click = 0;

    let openPopover;
    //show popover with position in relative to the element clicked on
    const showPopover = (event) => {
        const dataPoint = event.target.__data__
        const { audioUri, predictions } = dataPoint;
        if (openPopover) {
            if (!event.target.id.includes(openPopover.id) && !openPopover.id.includes(event.target.id)) {
                openPopover.remove();
                /*              /*        console.log(openPopover, "now") */
                //console.log("close") //close popover if click outside of the datapoint or the popover */
                //focus
                console.log()
            }
        }
        const addPopover = d3.select("#pigeon-plot")
            .append("div")
            .style("position", "absolute")
            .attr("class", "open")
            .attr("id", `popover`)
            .style("top", `${event.pageY + popoverMargin}px`)
            .style("left", `${event.pageX + popoverMargin}px`)
            .style("width", "auto")
            .style("height", "auto")
            .style("padding", "1rem")
            .style("border", "1px solid black")
            .style("background-color", "white")
            .style("border-radius", "1rem")
            .style("border", "1px solid #D9D9D9")
            .style("box-shadow", "5px 5px 6px 3px rgba(0, 0, 0, 0.25)")

        //border: 
        /* data popover
        
        for a popover when click on a datapoint
        */
        const audioElem = addPopover.append("audio").attr("controls", "true").append("source").attr("src", audioUri).attr("type", "audio/wav")
        openPopover = (addPopover._groups)[0][0]
    };

    document.addEventListener('click', (e) => {
        const currentPopover = document.getElementById("popover");
        if (currentPopover) {
            click += 1;
            if (click === 2) {
                currentPopover.remove();
                click = 0;
            }
        }
    })

    //refactor this
    const updateChart = (newData) => {
        pigeonDataArea.selectAll("circle").data(newData).join(
            enter => enter.append("circle")
                .attr("id", (d) => (d.id))
                .attr("cx", (d) => {
                    dayTimeScale(convertToUTCTime(d.timestamp))
                })
                .attr("r", '10px')
                .attr("cy", (d) => monthScale((new Date(d.timestamp)).setUTCFullYear(2020)) - margin)
                .attr("fill", (d) => confidenceScale(d.whaleFoundConfidence))
                .attr("fill-opacity", "0.8")
                .style("stroke", "black")
                .attr("tabindex", "0")
                .style("stroke-opacity", "0.5")
                .attr("data-playing", "false")
                .on("click", (e) => {
                    e.target.style.border = "2px dashed red";
                    console.log(e.target)
                    showPopover(e)
                }),
            // .on("click", (e) => { console.log((new Date(e.srcElement.__data__.timestamp))) })
            update => update.call(
                update => update.transition().duration(750)
                    .attr("id", (d) => (d.timestamp))
                    .attr("cx", (d) => {
                        return dayTimeScale(convertToUTCTime(d.timestamp))
                    })
                    .attr("r", '10px')
                    .attr("cy", (d) => monthScale((new Date(d.timestamp)).setUTCFullYear(2020)) - margin)
                    .attr("fill", (d) => confidenceScale(d.whaleFoundConfidence))
                    .attr("fill-opacity", "0.8")),
            exit => exit.call(exit => exit.remove())
        )
    }

    updateChart(data)

    let currentMonthData = data;
    let currentPigeonData = data; //whether we have pigeon data only or all
    let pigeonTag = false;
    let currentMonth;
    const pigeonFilter = (d) => (d.tags ? d.tags.includes('pigeon') : (d.comments ? d.comments.includes('pigeon') : ''));

    //  const pigeonData = data.filter(pigeonFilter);

    form.addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value)
        if (e.target.value !== 'all') {
            currentMonthData = data.filter((d) => {
                const month = (new Date(d.timestamp)).getUTCMonth() + 1;
                return currentMonth === month;
            })
        } else {
            currentMonthData = data;
        }
        updateChart(pigeonTag ? currentMonthData.filter(pigeonFilter) : currentMonthData)
    });

    tagToggle.addEventListener('change', (e) => {
        pigeonTag = !pigeonTag;
        if (e.target.checked) {
            currentPigeonData = currentMonthData.filter(pigeonFilter);
            // console.log("hurrah")
        } else {
            // console.log("not hurrah")
            currentPigeonData = currentMonthData;
        }
        updateChart(currentPigeonData)
    })

    const view = pigeonPlot.append("rect").attr("class", "view")
        .attr("fill", "none")
        .attr("x", `${margin}`)
        .attr("width", `${width}`)
        .attr("height", `${height - margin * 4}`);

    const zoomed = ({ transform }) => {
        view.attr("transform", transform);
        let newDayTimeScale = transform.rescaleX(dayTimeScale);
        let newMonthScale = transform.rescaleY(monthScale);

        xAxis.call(xAxisInit.scale(newDayTimeScale));
        yAxis.call(yAxisInit.scale(newMonthScale));

        pigeonPlot.selectAll("circle")
            .attr("cx", (d) => newDayTimeScale(convertToUTCTime(d.timestamp)))
            .attr("cy", (d) => newMonthScale((new Date(d.timestamp)).setUTCFullYear(2020)) - margin);
    }

    updateChart(data);

    const zoom = d3.zoom().scaleExtent([.5, 20]).extent([[0, 0], [width, height]]).on("zoom", zoomed)

    function reset() {
        pigeonPlot.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity)
    }

    Object.assign(pigeonPlot.call(zoom).node(), { reset });

    //height of rect: a random #? 
    //td: add circles with pigeon tag
    //add axes with time and 60 second interval scale
    //60 minute interval -- old code
    const timeYearDomain = d3.extent(data, (d) => new Date(d.timestamp))
    const timeScale = d3.scaleTime().domain(timeYearDomain).range([margin, width - margin]).nice()
    const intScale = d3.scaleLinear().domain([0, 60]).range([height - margin, margin])
    const durationScale = d3.scaleLinear().domain([0, 60]).range([0, height - margin])
    const colorScale = d3.scaleLinear().domain([minConf, maxConf]).range(["#D85656", "#009429"])

    const durationPlot = d3.select("body").select("#dot-plot").select("#main")
        .append("svg")
        .attr("class", "timeline")
        .attr("width", width)
        .attr("height", height)

    durationPlot.append('text')
        .attr("class", "axis-label")
        .attr('text-anchor', 'middle')
        .attr('x', margin)
        .attr('y', margin / 2)
        .html('60 second duration')
        .style("font-size", "1rem")
    // .style("font-weight", "500")
    //  .style("font-family", "sans-serif")

    durationPlot.append('text')
        .attr("class", "axis-label")
        .attr('text-anchor', 'middle')
        .attr('x', width - margin)
        .attr('y', height - margin / 2)
        .html('Month')
        .style("font-size", "1rem")
    //.style("font-weight", "800")
    //  .style("font-family", "sans-serif")

    durationPlot
        .append("g")
        .attr("class", "xaxis")
        .attr("transform", `translate(${0}, ${height - margin})`)
        .call(d3.axisBottom(timeScale)
            .ticks(d3.timeMonth)
            .tickFormat(
                d => d.toLocaleString('default', { month: 'numeric' }))
        )
        .append("g")
        .attr("transform", `translate(${margin - 20}, ${-height + margin})`)
        .call(d3.axisLeft(intScale)
            .ticks(15, "2f")
        )

    const chart = d3.select("svg.timeline")
    let lastObs = null
    let dataElements = []
    let count = 0;
    const radius = '6px';
    for (let d in data) {
        count += 1
        lastObs = data[d]
        //have to index d from data because d is the key when we use for.. in for a dictionary
        let timePos = new Date(data[d].timestamp)
        let id = data[d].id
        let predData = data[d].predictions

        let dataPoints = chart.append("g")
            .selectAll("circle")
            .data(predData)
            .enter()
            .append("circle")
            .attr("id", d.id)
            .attr("cx", timeScale(timePos))
            .attr("r", radius)//also bad that the datapoint gets bigger in every direction
            .attr("cy", d => intScale(d.startTime) - durationScale(d.duration) / 2)
            .attr("fill", d => colorScale(d.confidence))
            .attr("fill-opacity", "0.5")
            .on("click", (d) => console.log(d, d.duration, "at id", id))
    }

    /*     console.log(count, "test count")
        console.log(lastObs)
        console.log(lastObs.predictions) */
}

//interaction

