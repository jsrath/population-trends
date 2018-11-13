let clientWidth;
let year = 1980;
let data = [];
const countrySelect = document.querySelector('#country-select');

function getCountries() {
  fetch('./countries.json')
    .then(result => result.json())
    .then(result => {
      result.countries.map(country => (countrySelect.innerHTML += `<option value="${country}">${country}</option>`));
    });
}

async function getData(event) {
  d3.select('.chart').html('');
  document.querySelector('.loading').classList.add('displayed');
  let country;
  event.target.value ? (country = event.target.value) : (country = countrySelect.selectedOptions[0].innerText);
  for (let i = year; i < 2018; i++) {
    let obj = {};
    await fetch(`http://api.population.io/1.0/population/${year}/${country}`)
      .then(result => result.json())
      .then(result => result.map(age => age.total).reduce((a, b) => a + b))
      .then(result => {
        obj['year'] = i;
        obj['population'] = result;
        data.push(obj);
      });
    year++;
  }
  clientWidth = document.querySelector('body').getBoundingClientRect().width * 0.7;
  drawGraph(clientWidth);
  year = 1980;
}

function drawGraph(clientWidth) {
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const width = clientWidth - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  const parseTime = d3.timeParse('%Y');
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);
  const formatNumber = d3.format('.3s');
  const formatBillion = number => formatNumber(number).replace(/G/, 'B');

  const valueline = d3
    .line()
    .x(d => x(d.year))
    .y(d => y(d.population));

  const tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip');

  const svg = d3
    .select('.chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  data.forEach(d => {
    d.year = parseTime(d.year);
    d.population = Number(d.population);
  });

  x.domain(d3.extent(data, d => d.year));
  y.domain(d3.extent(data, d => d.population));

  svg
    .append('path')
    .data([data])
    .attr('class', 'line')
    .attr('d', valueline);

  svg
    .selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.year))
    .attr('cy', d => y(d.population))
    .attr('r', 5)
    .on('mouseover', d =>
      tooltip.style('display', 'block').html(
        `<p><strong>${d.year.getFullYear()}</strong></p>
      <p>${d.population.toLocaleString()}</p>`,
      ),
    )
    .on('mousemove', () => tooltip.style('top', `${d3.event.pageY + 10}px`).style('left', `${d3.event.pageX + 20}px`))
    .on('mouseout', () => tooltip.style('display', 'none'));

  svg
    .append('g')
    .attr('class', 'axisWhite')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x));

  svg
    .append('g')
    .attr('class', 'axisWhite')
    .call(
      d3
        .axisLeft(y)
        .ticks(10)
        .tickFormat(formatBillion),
    );
  data = [];
  document.querySelector('.loading').classList.remove('displayed');
}

document.querySelector('#country-select').addEventListener('change', getData);
window.addEventListener('resize', getData);
getCountries();
