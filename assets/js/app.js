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
  filters: []
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
    position:'left',
    knob_position:'left'
  },
  val_option:{
    name:'Value',
    contents: ['beds:count','size:avg', 'price:avg', 'elevation:avg', 'year_built:min'],
    position:'right',
    knob_position:'right'
  }
}


let dropdowns2 = {
  col_option:{
    name:'Color',
    contents:['red', 'blue','green','grey'],
    knob_position:'left'
  },
  val_option:{
    name:'Value',
    contents: ['beds:count','size:avg', 'price:avg', 'elevation:avg', 'year_built:min'],
    knob_position:'right'
  }
}

let view_def=[{id:'treemap1', view_type:'treemap', request: req4, chart_def: chart_def, dropdowns:dropdowns, aliases:aliases,  tile_config: {header: `Treemap`, subheader: `This is a Treemap`, height:'60vh', width:12}},
{id:'line-chart1', view_type:'chart',  view_subtype:'barChart', request: req3, dropdowns:dropdowns, aliases:aliases, chart_def: chart_def, tile_config: {header: `Line Chart`, subheader: `this is a Line Chart`, height:'60vh', width:12}},
{id:'grid1', view_type:'grid', request: req3, dropdowns:dropdowns, aliases:aliases, tile_config: {header: `Grid`,  subheader: `This is a Grid`, height:'60vh', width:12}},
{id:'countymap1', view_type:'countymap', request: req5, dropdowns:dropdowns2, color_scheme:"?col_option", aliases:aliases,  tile_config: {header: `CountyMap`, subheader: `This is a CountyMap`, height:'60vh', width:12}}]


const ps = new PerfectScrollbar('.main-content')

var input=document.getElementById(`view-knob`)

let labels=[]

for (let view of view_def)
{
  view.tile_config.parent_div=('#main-panel')
  let vs= new View_State (view)
  view_states.push(vs)
  $('#view-select').append(`<option ${view==0?'selected':''} value="${view.id}">${view.id}</option>`)
  labels.push('.')
}

input.dataset.labels=labels

selected_vs=view_states[0]
selected_vs.createTile()

input.value=0
vs_knob=new Knob(input, new Ui.P1({}))


function refreshTiles(){
  selected_vs.refresh()
}

function formSelectCallBack ()
 {
  let index = $(this).prop('selectedIndex');
  let knob_id =  $(this).attr('data-knob')
  $("#"+ knob_id).val(index)
  console.log(getKnob(knob_id))
  getKnob(knob_id).changed(0)
}

function viewChangeCallback () 
{
  let dd_id = '#' + $(this).attr('data-dropdown')
  let index = $(this).val();
  $(dd_id).prop('selectedIndex', index);
  selected_vs=view_states[index]
  selected_vs.createTile()
  $(".p1").on("change", controlsChangeCallback)
  $(".form-select").on("change", formSelectCallBack)
}

function controlsChangeCallback () 
{
  let dd_id = '#' + $(this).attr('data-dropdown')
  let index = $(this).val();
  $(dd_id).prop('selectedIndex', index);
  selected_vs.createContent()
}

$(".p1").on("change", controlsChangeCallback)
$(".p2").on("change", viewChangeCallback)
$(".form-select").on("change", formSelectCallBack)

$(document).ready();
$(window).resize(refreshTiles);

