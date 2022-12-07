let rawData;

d3.json("raw.json").then((data) => { rawData = data.obs; vizJSON(rawData) })

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

    //convert all time data to miliseconds after UTC hour to prevent time range being repetitive
    const convertToUTCTime = (timeString) => {
        const dateObj = new Date(timeString)
        return dateObj.getUTCHours() * 60 * 60 * 1000 + dateObj.getUTCMinutes() * 60 * 1000 + dateObj.getUTCSeconds() * 1000 + dateObj.getUTCMilliseconds()
    }
    const timeDomain = d3.extent(data, (d) => convertToUTCTime(new Date(d.timestamp)))
    console.log(timeDomain, "timedomain")
    const monthDomain = d3.extent(data, d => (new Date(d.timestamp)))
    //initiate size of visualization
    const width = window.innerWidth;
    const height = window.innerHeight;
    const margin = width > 599 ? 90 : 10;

    const dayTimeScale = d3.scaleTime().domain(timeDomain).range([margin, width - margin]).nice(); //cx

    const monthScale = d3.scaleTime().domain(monthDomain).range([height, margin * 4 / 3]).nice() //cy
    /*
    for hour of day to see Pigeon tag
    */
    //tbd add pigeon tag filter
    const obsPigeon = data.filter((d) => (d.tags ? d.tags.includes('pigeon') : (d.comments ? d.comments.includes('pigeon') : '')));
    const pigeonPlot = d3.select('body').select('#pigeon-plot')
        .append('svg')
        .attr('width', width)
        .attr('height', height)

    pigeonPlot.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(${0}, ${height - margin})`)
        .call(d3.axisBottom(dayTimeScale).ticks(d3.timeHour.every(1)).tickFormat(d3.timeFormat('%I:%M')))
    pigeonPlot.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${margin}, ${-margin})`)
        .call(d3.axisLeft(monthScale).ticks(d3.timeMonth).tickFormat((d) => d.toLocaleString('default', { month: 'long', year: 'numeric' })))

    //axe labeling
    pigeonPlot.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', margin)
        .attr('y', margin / 6)
        .html('Month')
        .style("font-size", "1rem")
        .style("font-weight", "500")
        .style("font-family", "sans-serif")
    pigeonPlot.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', width - margin)
        .attr('y', height - margin / 2)
        .html('Hour of Day')
        .style("font-size", "1rem")
        .style("font-weight", "500")
        .style("font-family", "sans-serif")
    //see what's a single datapoint -> svg: width of rect: same (60 secs)
    //height of rect: a random #? 
    const dtpHeight = 10;
    const rescaleFactor = 5;

    let pigeonData = pigeonPlot.append("g")
        .selectAll("circle")
        .data(obsPigeon)
        .enter()
        .append("circle")
        .attr("id", (d) => (d.timestamp))
        .attr("cx", (d) => {
            // console.log(new Date(d.timestamp))
            return dayTimeScale(convertToUTCTime(new Date(d.timestamp)))
        })
        .attr("r", '10px')
        .attr("cy", (d) => monthScale(new Date(d.timestamp)) - margin)
        .attr("fill", 'blue')
        .attr("fill-opacity", "0.5")

    console.log(dayTimeScale((new Date('2020-11-22T19:26:58.191224Z')).getHours()))
    /*         const dayTimeScale = d3.scaleTime().domain(timeDomain).range([margin, width - margin]); //cx
            console.log('day time scale', dayTimeScale(convertToUTCTime("2021-08-17T00:09:07.553583Z")))
        
            const monthScale = d3.scaleTime().domain(monthDomain).range([height, margin * 4 / 3]).nice() //cy
            console.log('month scale', monthScale(new Date("2021-08-17T00:09:07.553583Z"))) */
    // }

    //td: add circles with pigeon tag
    //add axes with time and 60 second interval scale
    //60 minute interval -- old code
    const timeYearDomain = d3.extent(data, (d) => new Date(d.timestamp))
    const timeScale = d3.scaleTime().domain(timeYearDomain).range([margin, width - margin]).nice()
    const intScale = d3.scaleLinear().domain([0, 60]).range([height - margin, margin])
    let count = 0;
    const durationScale = d3.scaleLinear().domain([0, 60]).range([0, height - margin])
    const colorScale = d3.scaleLinear().domain([minConf, maxConf]).range(["#D85656", "#009429"])

    const durationPlot = d3.select("body").select("#dot-plot").append("svg")
        .attr("class", "timeline")
        .attr("width", width)
        .attr("height", height)

    durationPlot.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', margin)
        .attr('y', margin / 2)
        .html('60 second duration')
        .style("font-size", "1rem")
        .style("font-weight", "500")
        .style("font-family", "sans-serif")

    durationPlot.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', width - margin)
        .attr('y', height - margin / 2)
        .html('Month')
        .style("font-size", "1rem")
        .style("font-weight", "500")
        .style("font-family", "sans-serif")

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
        .attr("transform", `translate(${margin - 20},${-height + margin})`)
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
            .attr("id", timePos)
            .attr("cx", timeScale(timePos))
            .attr("r", radius)//also bad that the datapoint gets bigger in every direction
            .attr("cy", d => intScale(d.startTime) - durationScale(d.duration) / 2)
            .attr("fill", d => colorScale(d.confidence))
            .attr("fill-opacity", "0.5")
            .on("click", (d) => console.log(d, d.duration, "at id", id))

        //chang le neu cu them vao thi lai phai index cai object...
    }

    /*     console.log(count, "test count")
        console.log(lastObs)
        console.log(lastObs.predictions) */
}