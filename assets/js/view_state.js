/*

state.id = unique id to identify instance of vs

state.viewtype = one of the following:
 grid, bar-chart, line-chart, scatter-chart, treemap, d3map, googlemap

state.groupbys = [dimensions]

state.measures = [measures]

state.dimfilters = [dimension members]

state.valfilters = [value member inequalities]

state.tile_config = {header: , subheader: , body: , parentdiv: }

   <div class="col-lg-6">
      <div class="card z-index-2">
        <div class="card-header pb-0">
          <h6>header</h6>
          <p class="text-sm">
            <i class="fa fa-arrow-up text-success"></i>
            <span class="font-weight-bold">subheader</span> in 2021
          </p>
        </div>
        <div class="card-body p-3">
          <div class="chart">
            <canvas id="chart-line" class="chart-canvas" height="300"></canvas>
          </div>
        </div>
      </div>
    </div>

<div class="dropdown pe-4">
              <button class="btn btn-secondary btn-sm dropdown-toggle" type="button" id="dropdownMenu2" data-bs-toggle="dropdown" aria-expanded="false">
                Dropdown
              </button>
              <ul class="dropdown-menu" aria-labelledby="dropdownMenu2">
                <li><button class="dropdown-item" type="button">Action</button></li>
                <li><button class="dropdown-item" type="button">Another action</button></li>
                <li><button class="dropdown-item" type="button">Something else here</button></li>
              </ul>
            </div>

 */
/*******************************************************************************/
//Global Vars

const ps_object = {}
var knob_objects = {}
var vs_knob = null
var selected_vs=null
/*******************************************************************************/

function Comma_Sep(a,vs_id) {
  var s = "";
  for (let i = 0; i < a.length; i++) {
    let item=a[i]
    if(item.startsWith('?')){
      let dd_id=item.slice(1)
      s+=$(`#${dd_id}-${vs_id}`).val()
    }
    else
      s += item;

    if (i < a.length - 1) 
      s += ",";
  }

  return s;
}

function itemSubstitute(a_in, vs_id) {
  var a_out = [];
  for (let i = 0; i < a_in.length; i++) {
    let item=a_in[i]
    if(item.startsWith('?')){
      let dd_id=item.slice(1)
      a_out.push($(`#${dd_id}-${vs_id}`).val())
    }
    else
      a_out.push(item);
  }

  return a_out;
}

function chartColorGradient(canvas, bg_color){
  let ctx2 = canvas.getContext("2d");
  let gradientStroke = ctx2.createLinearGradient(0, canvas.scrollHeight, 0, 50);
  gradientStroke.addColorStop(1, hexToRGB(bg_color, 0.2));
  gradientStroke.addColorStop(0.2, 'rgba(72,72,176,0.0)');
  gradientStroke.addColorStop(0, hexToRGB(bg_color, 0));
  return gradientStroke
}

async function serverRequest(params) {
  let p = new URLSearchParams(params).toString();

  // const api_url = `gserver/${p}`;

  // var request = new Request(api_url, { method: "POST" });

  var request = new Request(`http://127.0.0.1:55555/req?${p}`, { method: "GET" });

  const response = await fetch(request);
  const json = await response.json();

  return json;
}

function getDataColumn (server_js, col_idx){
  var data_col=[]
  for (let row of server_js){
    data_col.push(row[1][col_idx])
  }
  return data_col
}

function hexToRGB(hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);

  if (alpha!==undefined) {
      let rgba=`rgba(${r},${g},${b},${alpha})`
      return `rgba(${r},${g},${b},${alpha})`;
  } else {
      return `rgba(${r},${g},${b})`;
  }
}

function zoomed()
{
    g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
    // g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
    g.attr("transform", d3.event.transform); // updated for d3 v4
}

function stopped()
{
    if (d3.event.defaultPrevented) d3.event.stopPropagation();
}
function reset()
{
    active.classed("active", false);
    active = d3.select(null);

    svg.transition()
        .duration(750)
        // .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
        // .call(zoom.transform, d3.zoomIdentity); // updated for d3 v4
}
function getKnob(id)
{
  if (id=='view-knob')
    return vs_knob
  else
    return knob_objects[`${id}-knob`]
}
/*******************************************************************************/
class View_State 
{
  constructor(state)
  {
    this.state=state
    this.obj_instance=null
    this.server_js=null
    this.maximized=false
  }
  createRequestParams()
  { 
    let req=this.state.request
    let vs_id=this.getId()
    let params =  {
      qid: req.qid,
      dim: req.base_dim,
      gby: Comma_Sep(req.groupbys, vs_id),
      val: Comma_Sep(req.measures, vs_id),
      // dim_filters: encodeURIComponent(getDimFilterStr(global_dim_filters)),
      // val_filters: getValFilterStr(global_val_filters)
    };
    return params
  }
  async serverRequest()
  {
    let params=this.createRequestParams();
    let server_result = await serverRequest(params);

    let server_meta=server_result["meta"];

    if (server_meta.status != "OK"){
      alert("The data server returned "+ server_meta.status)
      return
    }
    this.server_js=server_result["data"]
    // if (server_meta.is_range)
    //   server_range = server_result.range;
  }
  getId()
  {
    return this.state.id
  }
  getViewType()
  {
    return this.state.view_type
  }
  getHeight()
  {
    return this.state.tile_config.height
  }
  getWidth()
  {
    return this.state.tile_config.width
  }
  hide()
  {
    $(`#${this.getId()}-box`).hide()
  }
  show()
  {
    $(`#${this.getId()}-box`).show()
  }
  maximize()
  {
    $('.content').height('65vh')
    $(`#${this.getId()}-box`).attr('class', 'col-lg-12')
    this.maximized=true
    $(`#${this.getId()}-card`).attr('data-maximized', true)
    $('.content').height('65vh')
    this.refresh()
  }
  restore()
  {
    let id=this.getId()
    this.maximized=false
    $(`#${this.getId()}-card`).attr('data-maximized', false)
    $(`#${id}-box`).attr('class', `col-lg-${this.getWidth()} mt-4`)
    $('.content').height(this.getHeight())
    if (this.state.view_type=='chart')
    {
      $(`#${this.getId()}`).height(this.getHeight())
    }
    this.show()
  }
  refresh()
  {
    let type=this.state.view_type
    let vs_id=this.getId()
    switch(type)
    {
      case 'grid':
        w2ui[vs_id].refresh()
        ps_object[vs_id].destroy()
        const ps = new PerfectScrollbar(`#grid_${vs_id}_records`, {
          wheelSpeed: 2,
          wheelPropagation: false,
          minScrollbarLength: 20
        })
        ps_object[vs_id]=ps
        break
      case 'chart':
        let canvas = document.getElementById(`${vs_id}-canvas`);
        let this_chart = this.object_instance;
        this_chart.data.datasets.forEach((dataset, i) => {
          let chart_def = this.state.chart_def[i];
          let bg_color = chart_def.backgroundColor;
          dataset.backgroundColor=chartColorGradient(canvas, bg_color)
        });
        this_chart.update()
        break
      case 'treemap':
        this.createContent()
        break
    }
  }
  createDropdownList(contents){
    let list=''
    for (let i=0; i<contents.length; ++i){
      let item=contents[i]
      list+=`<option ${i==0?'selected':''} value="${item}">${item}</option>`
    }
    return list
  }
  createDropdowns(){
    if ('dropdowns' in this.state == false)
      return ''
    let dropdowns=this.state.dropdowns
    for (const [id, def] of Object.entries(dropdowns))
    {
      let controls=$(`#${this.getId()}-controls`)
      let position='position' in def? def.position:'right'
      let dropdown_html=`<div id=${id}-${this.getId()}-column class="col-4 px-sm-3 px-1 mt-4 text-center"><h6 class="mb-1 text-white">${def.name}</h6><select id=${id}-${this.getId()} class="form-select form-select-sm pt-0" data-tile-id="${this.getId()}" data-knob='${id}-${this.getId()}-knob' aria-label=".form-select-sm example">
      ${this.createDropdownList(def.contents)}
      </select></div>`
      if(position=='left')
      controls.prepend(dropdown_html)
      else
      controls.append(dropdown_html)
    }
  }
  createKnobs(){
    if ('dropdowns' in this.state == false)
      return ''
    let dropdowns=this.state.dropdowns
    knob_objects={}
    for (const [id, def] of Object.entries(dropdowns))
    {
      let controls=$(`#${this.getId()}-controls`)
      let knob_position='knob_position' in def? def.knob_position:def.position
      let client_width=document.documentElement.clientWidth
      let knob_height=100
      let knob_width=100
      if (client_width<1024)
      {
        knob_height=50
        knob_width=50
      }
      let knob_html=`<div class="col-2 d-flex justify-content-center mt-4 px-0"><input id='${id}-${this.getId()}-knob' class='p1' type="range" min="0" max="10" data-dropdown=${id}-${this.getId()} data-width="${knob_width}" data-height="${knob_height}" data-angleOffset="220" data-angleRange="280"></div>`
      if(knob_position=='left')
        controls.prepend(knob_html)
      else
        controls.append(knob_html)
      let input=document.getElementById(`${id}-${this.getId()}-knob`)
      input.dataset.labels=(def.contents).map(()=>'.')
      input.value=0
      knob_objects[`${id}-${this.getId()}-knob`]=new Knob(input, new Ui.P1({}))
    }
  }
  createTile()
  {
    let cfg=this.state.tile_config
    let types = this.state.view_types
    for (const [id, instance] of Object.entries(knob_objects))
    {
      instance.removeEventListeners()
    }
    $(cfg.parent_div).empty()
    $(cfg.parent_div).html(`<div id="${this.getId()}-box" class="col-lg-${cfg.width} mx-auto">
      <div id="${this.getId()}-card" class="card z-index-2" data-maximized="false">
        <div class="card-body p-3">
          <div id="${this.getId()}" class="content" style="width:100%; height:${cfg.height};">
          </div>
        </div>
      </div>
      <div id="${this.getId()}-controls" class="row">
        
      </div>
     </div>`);
     this.createDropdowns()
     this.createKnobs()
     this.createContent()
  }
  getColorScheme()
  {
    var color_schemes = {"red": d3.interpolateYlOrRd,
                        "blue": d3.interpolateBlues,
                        "green": d3.interpolateYlGn,
                        "grey": d3.interpolateGreys}

    let color_scheme = this.state.color_scheme
    let color = ""
    if(color_scheme.startsWith('?'))
    {
      let dd_id = color_scheme.slice(1)
      color = $(`#${dd_id}-${this.getId()}`).val()
    }
    else
    {
      color = color_scheme
    }
    return color_schemes[color]
  }
  createContent()
  {
    try
    {
      this[this.state.view_type]()
    }
    catch (e)
    {
      console.log(e)
    }
  }

   text()
   {
    $(`#${this.getId()}`).append(`<h5 class="font-weight-bolder">Gigaroll Dashboard</h5><p class="text-lg">${this.state.text}</p>`)
   }
   googlemap()
  {
    try{
    let map = new google.maps.Map(document.getElementById(this.getId()), {
      fullscreenControl: false,
      zoom: 8,
      center: { lat: 50, lng: 50 },
      gestureHandling: "cooperative",
    });
    }
    catch(e)
    {console.log(e)}

  }
  async grid(){

    $(`#${this.getId()}`).html(`<div id="${this.getId()}-grid"></div>`)

    await this.serverRequest()

    // if (selected_vs && this.getViewType() != selected_vs.getViewType())
    if (selected_vs && this!==selected_vs)
    {
      return 
    } 

    let req=this.state.request
    let vs_id=this.getId()

    let gby_headers=itemSubstitute(req.groupbys, vs_id)
    let val_headers=itemSubstitute(req.measures, vs_id)

    let server_js=this.server_js

    let columns=[]

    for (let col of gby_headers){
      // let col_name=col.startsWith('?')?$(`#${col.slice(1)}`).val():col
      columns.push({field:col, text:col, attr:col, sortable:true})
      // searches.push({field:col, text:col, label:col, type:"text"})
    }
    for (let col of val_headers){
      columns.push({field:col, text:col, sortable:true})
      // searches.push({field:col, text:col, label:col, type:"float"})
    }

    let count=1
    let records=[]

    for (let row of server_js){
      let rec={recid:count++}
      let n_gbys=gby_headers.length
      for (let i=0; i<n_gbys; i++){
        rec [gby_headers[i]]=row[0][i]
      }
      for (let i=0; i<val_headers.length; i++){
        rec[val_headers[i]]=row[1][i]
      }
      records.push(rec)
    }

    try{
      try{w2ui[this.getId()].destroy()}
      catch(e){}
       this.object_instance=$(`#${this.getId()}-grid`).w2grid({
        name: this.getId(),
        columns: columns,
        records: records,
        // searches: searches,
        });
        if(this.getId() in ps_object)
        {
          ps_object[this.getId()].destroy()
        }
        const ps = new PerfectScrollbar(`#grid_${this.getId()}_records`, {
          wheelSpeed: 2,
          wheelPropagation: false,
          minScrollbarLength: 20
        })
        ps_object[this.getId()]=ps
    }
    catch(e)
    {console.log(e)}
  }
  // chart()
  // {
  //   try{
  //     this[this.state.view_subtype]()
  //   }
  //   catch (e){

  //   }
  // }
  async chart()
  {
    await this.serverRequest()

    if (this.object_instance)
    {
      this.object_instance.destroy()
    }

    if (selected_vs && this!==selected_vs)
    {
      return 
    } 

    let cfg=this.state.tile_config
    
    $(`#${this.getId()}`).html(`<canvas id="${this.getId()}-canvas" style="width:100%; height:${cfg.height};">
    </canvas>`)

    let req=this.state.request
    let vs_id=this.getId()

    let val_headers=itemSubstitute(req.measures, vs_id)

    let server_js=this.server_js

    let canvas = document.getElementById(`${vs_id}-canvas`);

    let ctx2 = canvas.getContext("2d");

    let labels=[]

    for (let row of this.server_js){
      labels.push(row[0][0])
      //to do: handle multiple group bys
    }

    let ds = []

    for (let i=0, n=val_headers.length; i<n; ++i) 
    { 
      let chart_def = this.state.chart_def[i];
      let bg_color = chart_def.backgroundColor;
      let data = getDataColumn(server_js, i);
      let d = {
        label: val_headers[i],
        data: data,
        yAxisID: chart_def.yAxisID,
        type: chart_def.type,
        tension: 0.4,
        borderWidth: 0,
        pointRadius: 0,
        borderColor: chart_def.borderColor,
        borderWidth: 3,
        backgroundColor: chartColorGradient(canvas, bg_color),
        fill: true
      }
      ds.push(d)
    }

    this.object_instance = new Chart(ctx2, {
      type: "line",
      data: {
        labels: labels,
        datasets: ds,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          y: {
            grid: {
              drawBorder: false,
              display: true,
              drawOnChartArea: true,
              drawTicks: false,
              borderDash: [5, 5]
            },
            ticks: {
              display: true,
              padding: 10,
              color: '#b2b9bf',
              font: {
                size: 11,
                family: "Open Sans",
                style: 'normal',
                lineHeight: 2
              },
            }
          },
          x: {
            grid: {
              drawBorder: false,
              display: false,
              drawOnChartArea: false,
              drawTicks: false,
              borderDash: [5, 5]
            },
            ticks: {
              display: true,
              color: '#b2b9bf',
              padding: 20,
              font: {
                size: 11,
                family: "Open Sans",
                style: 'normal',
                lineHeight: 2
              },
            }
          },
        },
      },
    });
  }
  async getTreeMapData()
  {
    await this.serverRequest()

    let server_js=this.server_js

    let vs_id=this.getId();
    let req=this.state.request;
    let gby_headers=itemSubstitute(req.groupbys, vs_id);
    let val_headers=itemSubstitute(req.measures, vs_id);

  
    let root = gby_headers[0]
    let data = [{id:root, value:0}]
    let nodes = new Set()

    
    let n_rows = server_js.length

    let ng = server_js[0][0].length - 1

    for (let r = 0; r < n_rows; ++r )
    {
      let row = server_js[r]
      let gby = row[0]
      let val = row[1][0]
      let str = root
      for (let i = 0; i< gby.length; ++i)
      {
        let g2 = gby[i].replace(/\./g, '')
        str += '.' + g2
        if (i < ng && !nodes.has(str))
        {
          data.push( { id:str , value: 0});
          nodes.add(str);
        } 
      }
      data.push( { id:str , value: val});
    }
  
    return data;
  }
  async treemap()
  {
    $(`#${this.getId()}`).html(`<div id="tmap-${this.getId()}" style="position:absolute;"></div>`)
    let ht=$(`#${this.getId()}`).parent().height();
    var parent_width = $(`#${this.getId()}`).parent().width();
    var width = Math.round(parent_width*0.67);
    var height = Math.round(ht);
    var margin = Math.round((parent_width - width)/2)

    var format = d3.format(",d");

    var color = d3.scaleOrdinal()
      .range(d3.schemeCategory20
          .map(function(c) { c = d3.rgb(c); c.opacity = 0.8; return c; }));

    var stratify = d3.stratify()
      .parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

    var treemap = d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true);

    let data = await this.getTreeMapData();

    
    if (selected_vs && this!==selected_vs)
    {
      return 
    } 

    var root = stratify(data)
        .sum(function(d) { return d.value; })
        .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

    treemap(root);
    d3.select(`#tmap-${this.getId()}`)
      .html("")

    d3.select(`#tmap-${this.getId()}`)
      .selectAll(".node")
      .data(root.leaves())
      .enter().append("div")
        .attr("class", "node")
        .attr("title", function(d) 
        { 
          return d.id.substring(d.id.indexOf(".") + 1) + "\n" + format(d.value); 
        })
        .style("left", function(d) { return d.x0 + margin + "px"; })
        .style("top", function(d) { return d.y0 + "px"; })
        .style("width", function(d) { return d.x1 - d.x0 + "px"; })
        .style("height", function(d) { return d.y1 - d.y0 + "px"; })
        .style("background", function(d) { while (d.depth > 1) d = d.parent; return color(d.id); })
      .append("div")
        .attr("class", "node-label")
        .text(function(d) 
        { 
          let s = d.id.substring(d.id.indexOf(".") + 1).replace(/\./g, "\n")//.split(/(?=[A-Z][^A-Z])/g).join("\n"); 
          return s;
        })
      .append("div")
        .attr("class", "node-value")
        .text(function(d) { return format(d.value); });
      

    function type(d) {
    d.value = +d.value;
    return d;
    }
      
    }

    async getCountyData(){
      let state_code_from_name =
      { CT: "09", NY: "36", NJ: "34", MA: "25" }
  
  
      await this.serverRequest()
      let server_js = this.server_js
  
      let value_idx = 0
      let min = Infinity, max = -Infinity
      let lut = {}
      for (let row of server_js)
      {
          let c = row[0][0]
          let state = c.substring(c.length - 2)
          let county = c.substring(0, c.length - 3)
          let code = state_code_from_name[state]
          if (lut[code] == null)
          {
              lut[code] = {}
          }
          let value = row[1][value_idx]
          max = Math.max(value, max)
          min = Math.min(value, min)
          lut[code][county] = value
      }
      return { lut: lut, max: max, min: min }
  
    }
  
    async countymap()
    {
      let result = await this.getCountyData();

      if (selected_vs && this!==selected_vs)
      {
        return 
      } 

      let county_data = result.lut;
      let max_data = result.max;
      let min_data = result.min;
      let first_map_draw = true
      let state_codes = new Set(["09", "34", "36"])
      var g = null;
      var path = null;
      var svg = null;
      let colors = [];
      let num_colors = 12;
      let geoScope = null;
      let scheme = this.getColorScheme();
      var tooltipDiv = d3.select("#d3map").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
      let name_from_state_code =
      { "09": "CT", "36": "NY", "34": "NJ", "25": "MA" }
  
      for (let i = 0; i <= num_colors; ++i)
          colors.push(scheme(i / num_colors));
  
      let domain = [],
          m1,
          m2;
      if (min_data <= 0 && max_data <= 0)
      {
          m1 = min_data == 0 ? -1 : min_data + 0.5;
          m2 = max_data == 0 ? -1 : max_data;
          let r = (m2 / m1) ** (1 / (num_colors));
  
          for (let x = m1; x <= m2; x *= r)
              domain.push(x);
      }
      else if (min_data >= 0 && max_data >= 0) 
      {
          m1 = min_data == 0 ? 1 : min_data + 0.5;
          m2 = max_data == 0 ? 1 : max_data;
          let r = (m2 / m1) ** (1 / (num_colors));
  
          for (let x = m1; x <= m2; x *= r)
              domain.push(x);
      }
      else 
      {
          m1 = min_data;
          m2 = max_data;
  
          domain.push(min_data + 0.5);
          let r = max_data ** (1 / (num_colors - 1));
  
          for (let x = 1; x <= max_data; x *= r)
              domain.push(x);
      }
      var color = d3
          .scaleThreshold()
          .domain(domain)
          .range(colors);
  
      var width = $(`#${this.getId()}`).parent().width(),
          height = $(`#${this.getId()}`).parent().height(),
          centered,
          dd;
  
      if (first_map_draw)
      {
        first_map_draw = false;
  
        var projection = d3.geoIdentity().reflectY(false);
        
        path = d3
            .geoPath() // updated for d3 v4
            .projection(projection);
  
        d3.select(`#${this.getId()}`)
        .html("")
  
        svg = d3
            .select(`#${this.getId()}`)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .on("click", stopped, true);
  
        svg
            .append("rect")
            .attr("class", "background")
            .attr("width", width)
            .attr("height", height)
            .on("click", mapReset);
        
        g = svg.append("g");
      }
  
  
  
      
      d3.json("./assets/data/map_us_counties.json", function (error, us)
      {
          if (error) throw error;
          let states = topojson.feature(us, us.objects.states).features;
          let states_filtered = states.filter((d) => state_codes.has(d.id));
          let geoScope = {"type":"FeatureCollection","features":states_filtered};
          let county_features = topojson.feature(us, us.objects.counties).features;
          let county_filtered = county_features.filter((d) =>
              state_codes.has(d.id.substring(0, 2)));
  
          projection.fitSize([width - 20, height - 20], geoScope);
  
          g.selectAll("path")
              .data(states_filtered)
              .enter()
              .append("path")
              .attr("d", path)
              .attr("class", "feature");
  
          g.append("path")
              .datum(
                  topojson.mesh(us, us.objects.states, function (a, b)
                  {
                      if (!state_codes.has(a.id) && !state_codes.has(b.id))
                          return false;
                      else
                          return true;
                  })
              )
              .attr("class", "mesh")
              .attr("d", path);
  
  
          g.append("g")
              .attr("class", "counties")
              .selectAll("path")
              .data(county_filtered)
              .enter()
              .append("path")
              .attr("d", path)
              .attr("style", function (d)
              {
                  let code = d.id.substring(0, 2);
                  if (!state_codes.has(code))
                  {
                      return "fill: #000";
                  }
                  let s = parseInt(code);
                  let county = d.properties.name;
                  let value = county_data[code][county];
                  return `fill:${color(value)}; `;
              })
              .on("click", mapClicked)
              .on("mouseover", hovered)
              // .on("mousemove", moved)
              // .on("mouseout", mouseOuted);
            g.append("path")
                .attr("class", "county-borders")
                .attr(
                    "d",
                    path(
                        topojson.mesh(us, us.objects.counties, function (a, b)
                        {
                            let aCode = a.id.substring(0, 2);
                            let bCode = b.id.substring(0, 2);
  
                            if (!state_codes.has(aCode) || !state_codes.has(bCode))
                                return false;
                            else return a !== b;
                        })
                    )
            );
            function mapClicked(d) {
              centered = centered !== d && d;
        
              var paths = svg.selectAll("path")
                .classed("active", d => d === centered);
        
              var t0 = projection.translate(),
                s0 = projection.scale();
        
              projection.fitSize([width - 20, height - 20], centered || geoScope);
        
              var interpolateTranslate = d3.interpolate(t0, projection.translate()),
              interpolateScale = d3.interpolate(s0, projection.scale());
        
              var interpolator = function(t) {
                projection.scale(interpolateScale(t))
                  .translate(interpolateTranslate(t));
                paths.attr("d", path);
              }; 
          
              d3.transition()
                .duration(750)
                .tween("projection", function() {
                 return interpolator;
              });
            }
            function hovered(d)
            { 
              let code = d.id.substring(0, 2)
              let state = name_from_state_code[code]
              if (!state_codes.has(code))
                  return
        
              let county = d.properties.name
              let value = county_data[code][county]
              // let idx = color.range().indexOf(color(value))
              // let rect_id = `#rect_${idx}`
        
              // let x = parseInt(d3.select(rect_id).attr("x"))
              // let height = parseInt(d3.select(rect_id).attr("height"))
              // let width = parseInt(d3.select(rect_id).attr("width"))
              
              // var g = svg.append("g")
              // .attr("transform", "translate(0,40)");
              
              // d3.select(".key")
              //     .append("line")   
              //     .attr("id", "overline")
              //     .attr("x1", x)
              //     .attr("y1", -5)
              //     .attr("x2", x + width)
              //     .attr("y2", -5)
              //     .attr("style", `stroke:black;stroke-width:4`)  
    
              tooltipDiv
                  .style("opacity", 0.9);
              tooltipDiv.html(`${county} ${state} <br> ${value}`)
                  .style("left", (d3.event.layerX + 20) + "px")
                  .style("top", (d3.event.layerY + 20) + "px");
            }      
      });
      
      function mapReset(){
      }
    }
    
}//end of Class definition

function initMap (){
 
}