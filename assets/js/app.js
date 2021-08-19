var view_states=[]
let aliases = {
  'beds:count'     : 'Number of Properties',
  'price:avg'      : 'Average Price',
  'size:avg'       : 'Average Size',
  'prop_type'      : 'Property Type',
  'county'         : 'County',
  'state_code'     : 'State',
  'city'           : 'City',
  'postal_code'    : 'Zip Code',
  'elevation:avg'  : 'Average Elevation',
  'year_built:min' : 'Earliest Construction (Year)'
}

let req1 =
  {
    qid: "MD_AGG",
    base_dim: 'property',
    groupbys: ["prop_type"],
    measures: ["beds:count", "price:avg"],
    filters: []
  }

let req2 =
{
  qid: "MD_AGG",
  base_dim: 'property',
  groupbys: ["state_code"],
  measures: ["beds:count", "size:avg"],
  filters: []
}

let req3 =
{
  qid: "MD_AGG",
  base_dim: 'property',
  groupbys: ['?gby_option'],
  measures: ["?val_option"],
  filters: []
}

let req4 =
{
  qid: "MD_AGG",
  base_dim: 'property',
  groupbys: ['?gby_option'],
  measures: ['?val_option'],
  filters: []
}

let req5 =
{
  qid: "MD_AGG",
  base_dim: 'property',
  groupbys: ['county'],
  measures: ['?val_option'],
  val_filters: ['?val_filter_option'] 
}

let chart_def = [
  {
    yAxisID: "left",
    type: "bar",
    backgroundColor: "#2271b4",
    borderColor:"#2271b4"
  },
  // {
  //   yAxisID: "right",
  //   type: "bar",
  //   backgroundColor: "#0000ff",
  //   borderColor:"#0000ff"
  // } 
]

let dropdowns = {
  gby_option:{
    name:'Groupby',
    contents:['prop_type','state_code', 'postal_code', 'city', 'county'],
    position:'bottom-left',
    // knob_position:'left'
  },
  val_option:{
    name:'Value',
    contents: ['beds:count','size:avg', 'price:avg', 'elevation:avg', 'year_built:min'],
    position:'bottom-right',
    // knob_position:'left'
  }
}


let dropdowns2 = {
  col_option:{
    name:'Color',
    contents:['red', 'blue','green','grey'],
    position:'bottom-left',
    // knob_position:'left'
  },
  val_option:{
    name:'Value',
    contents: ['beds:count','size:avg', 'price:avg', 'elevation:avg', 'year_built:min'],
    position:'bottom-right',
    // knob_position:'right'
  },
  val_filter_option:{
    name:'Value Filters',
    contents: ['', 'county:Median_Income_2019>40000', 'county:Median_Income_2019>20000,county:Median_Income_2019<=30000', 'county:pop_2019>500000', 'county:pop_2019<50000', 'county:pop_2019<pop_2015', 'property:elevation>600'],
    position:'top-left',
    // knob_position:'right'
  }
}

let view_def=[{id:'treemap1', view_type:'treemap', request: req4, chart_def: chart_def, dropdowns:dropdowns, aliases:aliases,  tile_config: {header: `Treemap`, subheader: `This is a Treemap`, height:'60vh', width:12}},
{id:'line-chart1', view_type:'chart',  view_subtype:'barChart', request: req3, dropdowns:dropdowns, aliases:aliases, chart_def: chart_def, tile_config: {header: `Line Chart`, subheader: `this is a Line Chart`, height:'60vh', width:12}},
{id:'grid1', view_type:'grid', request: req3, dropdowns:dropdowns, aliases:aliases, tile_config: {header: `Grid`,  subheader: `This is a Grid`, height:'60vh', width:12}},
{id:'countymap1', view_type:'countymap', request: req5, dropdowns:dropdowns2, color_scheme:"?col_option", aliases:aliases,  tile_config: {header: `CountyMap`, subheader: `This is a CountyMap`, height:'60vh', width:12}}]


// const ps = new PerfectScrollbar('#main-container')

var input=document.getElementById(`view-knob`)

var labels=[]

for (let view of view_def)
{
  view.tile_config.parent_div=('#main-panel')
  let vs= new View_State (view)
  view_states.push(vs)
  $('#view-select').append(`<option ${view==0?'selected':''} value="${view.id}">${view.id}</option>`)
  labels.push('.')
}



selected_vs=view_states[0]
selected_vs.createTile()

createVsKnob(labels)

function createVsKnob(labels) 
{
  if(vs_knob != null)
    vs_knob.removeEventListeners()
  vs_knob = null
  let client_width = document.documentElement.clientWidth
  let knob_height = 100
  let knob_width = 100
  if (client_width < 1024)
  {
    knob_height = 75
    knob_width = 75
  }
  $('#vs-knob-column').html(`<input id='view-knob' class='p2' type="range" min="0" max="10" data-dropdown='view-select' data-width="${knob_width}" data-height="${knob_height}" data-angleOffset="220" data-angleRange="280"></div>`)
  let input=document.getElementById(`view-knob`)
  input.value = 0
  input.dataset.labels = labels
  vs_knob = new Knob(input, new Ui.P1({}))
}

function refreshTiles(){
  selected_vs.refresh()
  createVsKnob(this.labels)
  $(".p1").on("change", controlsKnobChangeCallback)
  $(".p2").on("change", viewKnobChangeCallback)
  $(".controls-select").on("change", controlsDropdownCallBack)
}

function viewsDropdownCallBack ()
 {
  let index = $(this).prop('selectedIndex');
  let knob_id =  $(this).attr('data-knob')
  $("#"+ knob_id).val(index)
  getKnob(knob_id).changed(0)
}


function viewKnobChangeCallback () 
{
  let dd_id = '#' + $(this).attr('data-dropdown')
  let index = $(this).val();
  $(dd_id).prop('selectedIndex', index);
  selected_vs=view_states[index]
  selected_vs.createTile()
  $(".p1").on("change", controlsKnobChangeCallback)
  $(".controls-select").on("change", controlsDropdownCallBack)
}

function controlsDropdownCallBack ()
 {
  let index = $(this).prop('selectedIndex');
  let knob_id =  $(this).attr('data-knob')
  $("#"+ knob_id).val(index)
  getKnob(knob_id).changed(0)
}


function controlsKnobChangeCallback () 
{
  let dd_id = '#' + $(this).attr('data-dropdown')
  let index = $(this).val();
  $(dd_id).prop('selectedIndex', index);
  selected_vs.createContent()
}

$(".p1").on("change", controlsKnobChangeCallback)
$(".p2").on("change", viewKnobChangeCallback)
$(".controls-select").on("change", controlsDropdownCallBack)
$("#view-select").on("change", viewsDropdownCallBack)

$(document).ready();
$(window).resize(refreshTiles);

