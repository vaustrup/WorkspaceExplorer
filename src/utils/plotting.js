import * as d3 from 'd3'

export function colorSchemeOrdinal (processNames) {
  return d3.scaleOrdinal(d3.schemeSet1).domain(processNames)
}

export function scaleBand ({ domain = NaN, range = NaN, padding = NaN }) {
  return d3.scaleBand()
    .domain(domain)
    .range(range)
    .padding(padding)
}

export function scaleLinear ({ domain = NaN, range = NaN }) {
  return d3.scaleLinear()
    .domain(domain)
    .range(range)
}

export function stackedArray ({ keys = NaN, data = NaN }) {
  return d3.stack().keys(keys)(data)
}
