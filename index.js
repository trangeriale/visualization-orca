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
    const UTCtoPSTOffset = 4;
    //convert all time data to miliseconds after UTC hour to prevent time range being repetitive
    const convertToUTCTime = (timeString) => {
        const dateObj = new Date(timeString)
        return (dateObj.getUTCHours() * toMiliSecConst + dateObj.getUTCMinutes() * 60 * 1000 + dateObj.getUTCSeconds() * 1000 + dateObj.getUTCMilliseconds()) % (12 * toMiliSecConst)
    }
    const timeDomain = d3.extent([-toMiliSecConst * UTCtoPSTOffset, toMiliSecConst * (23 - UTCtoPSTOffset)]) //scale time domain back to PST Time
    // const timeDomain = d3.extent(data, (d) => convertToUTCTime(new Date(d.timestamp)))
    console.log(timeDomain, "timedomain")
    const monthDomain = d3.extent(data, d => (new Date(d.timestamp)).setUTCFullYear(2020)) //.setFullYear(2020) this is so that we group all the years together, doesn't need to be 2020
    //initiate size of visualization
    const width = window.innerWidth * 70 / 100;
    const height = window.innerHeight * 80 / 100;
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

    const xAxis = pigeonPlot.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(${0}, ${height - margin})`)
        .call(d3.axisBottom(dayTimeScale).tickFormat(d3.timeFormat('%I:%M')))

    //study call func when get up
    const yAxis = pigeonPlot.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${margin}, ${-margin})`)
        .call(d3.axisLeft(monthScale).ticks(d3.timeMonth).tickFormat((d) => d.toLocaleString('default', { month: 'long' })))

    console.log(yAxis);

    const arr = [yAxis, xAxis]
    arr.forEach((element) => {
        element.selectAll("g.tick")
            .style("stroke-width", "2px")
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
        .attr("width", width - margin)
        .attr("height", height)
        .attr("x", margin)
        .attr("y", 0)

    /*     dashBoard.append("defs").append("SVG:clipPath")
            .attr("id", "clip")
            .append("SVG:rect")
            .attr("width", width - m)
            .attr("height", height - m * 3 / 2)
            .attr("x", m)
            .attr("y", m / 2)
    
        const dataField = dashBoard.append('g').attr('clip-path', "url('#clip')"); */

    const confidenceScale = d3.scaleQuantize().domain(confidenceExtent).range(['#F5A15C', '#FFE277', '#B4F3F2', '#70ABF1']);

    const interpolator = d3.interpolate(...confidenceExtent)
    const confidenceLevels = d3.quantize(interpolator, 5) //4 levels of whale found confidence
    console.log(confidenceLevels)
    console.log(confidenceExtent, "Extent")
    const pigeonDataArea = pigeonPlot.append("g").attr('clip-path', "url('#clip')");

    const pointColor = "#3485d1"

    const popoverMargin = '0.25rem';

    //show popover with position in relative to the element clicked on
    const showPopover = (event) => {
        console.log("woo!")
        console.log(event.pageX, "pageX")
        d3.select("#main-chart")
            .append("div")
            .style("position", "absolute")
            .style("top", `${event.pageX}`)
            .style("width", "100px")
            .style("height", "100px")
            .style("border", "1px solid black")
            .style("background-color", "red")
    }

    const updateChart = (newData) => {
        pigeonDataArea.selectAll("circle").data(newData).join(
            enter => enter.append("circle")
                .attr("id", (d) => (d.timestamp))
                .attr("cx", (d) => {
                    return dayTimeScale(convertToUTCTime(new Date(d.timestamp)))
                })
                .attr("r", '10px')
                .attr("cy", (d) => monthScale((new Date(d.timestamp)).setUTCFullYear(2020)) - margin)
                .attr("fill", (d) => confidenceScale(d.whaleFoundConfidence))
                .attr("fill-opacity", "0.8")
                .style("stroke", "black")
                .style("stroke-opacity", "0.5")
                .attr("data-playing", "false")
                .on("click", (e) => {
                    const audio = new Audio(e.target.__data__.audioUri);
                    console.log("E page", e.pageX);
                    showPopover(e)
                    //   const dataPoint = document.getElementById(`${e.target.__data__.timestamp}`)
                    // console.log(dataPoint.dataset)
                    /*                     if (e.target.dataset.playing === "false") {
                                            console.log("waa")
                                            audio.play();
                                            e.target.dataset.playing = "true";
                                        } else {
                                            console.log(audio.pause());
                                            console.log("pauseee");
                                            e.target.dataset.playing = "false";
                                        } */
                    /*   e.target.parent.appendChild() */
                    // const 
                    /*           const dataPopover = document.createElement("div");
                              dataPopover.classList.add("data-popover")
                              dataPopover.appendChild() */
                    console.log(e.target.parentElement)
                }),
            // .on("click", (e) => { console.log((new Date(e.srcElement.__data__.timestamp))) })
            update => update.call(
                update => update.transition().duration(750)
                    .attr("id", (d) => (d.timestamp))
                    .attr("cx", (d) => {
                        return dayTimeScale(convertToUTCTime(new Date(d.timestamp)))
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
    //console.log(dayTimeScale((new Date('2020-11-22T19:26:58.191224Z')).getHours()))
    /*         const dayTimeScale = d3.scaleTime().domain(timeDomain).range([margin, width - margin]); //cx
            console.log('day time scale', dayTimeScale(convertToUTCTime("2021-08-17T00:09:07.553583Z")))
        
            const monthScale = d3.scaleTime().domain(monthDomain).range([height, margin * 4 / 3]).nice() //cy
            console.log('month scale', monthScale(new Date("2021-08-17T00:09:07.553583Z"))) */
    // }
    //see what's a single datapoint -> svg: width of rect: same (60 secs)
    //height of rect: a random #? 
    const dtpHeight = 10;
    const rescaleFactor = 5;
    //td: add circles with pigeon tag
    //add axes with time and 60 second interval scale
    //60 minute interval -- old code
    const timeYearDomain = d3.extent(data, (d) => new Date(d.timestamp))
    const timeScale = d3.scaleTime().domain(timeYearDomain).range([margin, width - margin]).nice()
    const intScale = d3.scaleLinear().domain([0, 60]).range([height - margin, margin])
    let count = 0;
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

