// Constants
const svgWidth = 800, svgHeight = 600;
const colors = d3.schemeTableau10;

// Create the SVG container and add a group for zoom and pan
const svg = d3.select("#network")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .call(
        d3.zoom()
            .scaleExtent([0.5, 3]) // Allow zooming between 50% and 300%
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            })
    );

const container = svg.append("g");

const tooltip = d3.select("#tooltip");

// Load data
Promise.all([
    d3.json("data/author_network.json"),
    d3.json("data/top_countries.json")
]).then(([networkData, countryData]) => {
    const topCountries = Object.keys(countryData);
    const countryColorScale = d3.scaleOrdinal()
        .domain(topCountries)
        .range(colors)
        .unknown("#A9A9A9");

    // Filter nodes and clean up the data
    const nodes = networkData.nodes.map(node => ({
        ...node,
        radius: Math.sqrt(networkData.links.filter(link => link.source === node.id || link.target === node.id).length) * 3 + 3
    }));

    // Filter links to ensure both source and target nodes exist
    const nodeIds = new Set(nodes.map(node => node.id));
    const links = networkData.links.filter(link => nodeIds.has(link.source) && nodeIds.has(link.target));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).strength(1))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(svgWidth / 2, svgHeight / 2))
        .force("collision", d3.forceCollide().radius(d => d.radius + 5));

    // Draw links
    const link = container.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);

    // Draw nodes
    const node = container.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => countryColorScale(d.country))
        .call(drag(simulation));

    // Tooltip and mouse interactions
    node.on("mouseover", function (event, d) {
        node.style("opacity", n => n.country === d.country ? 1 : 0.2);
        link.style("opacity", 0.2);
        tooltip.style("opacity", 1)
            .html(`<strong>${d.id}</strong><br>Country: ${d.country}`)
            .style("left", `${event.pageX + 5}px`)
            .style("top", `${event.pageY + 5}px`);
    })
        .on("mouseout", function () {
            node.style("opacity", 1);
            link.style("opacity", 1);
            tooltip.style("opacity", 0);
        });

    // Add dragging functionality
    function drag(simulation) {
        return d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });

    // Control updates
    d3.select("#force-strength").on("input", function () {
        simulation.force("charge").strength(+this.value);
        simulation.alpha(1).restart();
    });

    d3.select("#collision-radius").on("input", function () {
        simulation.force("collision").radius(+this.value);
        simulation.alpha(1).restart();
    });

    d3.select("#link-strength").on("input", function () {
        simulation.force("link").strength(+this.value);
        simulation.alpha(1).restart();
    });
});
