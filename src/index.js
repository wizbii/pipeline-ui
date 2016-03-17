import d3 from 'd3';
import dagreD3 from 'dagre-d3';
import * as fn from './functions.js';
import forEach from 'lodash/forEach';
import _merge from 'lodash/merge.js';
import isFunction from 'lodash/isFunction.js';
import isString from 'lodash/isString.js';


/*******************
 * PRIVATE VARS
 *******************/

var _g, selectedNode;
var graphs = []
var render = new dagreD3.render();
var nodeInfo = d3.select("#pu-node-info")
var TYPE = {
  EVENT: 'EVENT',
  ACTION: 'ACTION',
  STORE: 'STORE'
}

/*******************
 * PUBLIC VARS
 *******************/

/**
 * Save the list of initial pipelines
 * @type {Array}
 */
export var pipelineList = []

/**
 * Define the svg shapes used to display node of type EVENT, ACTION or STORE
 * @type {{EVENT: string, ACTION: string, STORE: string}}
 */
export var SHAPE = {
  EVENT: 'ellipse',
  ACTION: 'action',
  STORE: 'rect'
}

/**
 * Define the fill color of nodes
 * @type {{EVENT: string, ACTION: string, STORE: string}}
 */
export var COLOR = {
  EVENT: '#77f',
  ACTION: '#f77',
  STORE: '#7f7'
}

/*******************
 * PUBLIC FUNCTIONS
 *******************/

/**
 * Allow to edit some configuration
 * Example of `config` :
 * {
 *  color: {
 *   EVENT:"#77f"
 *  },
 *  shape: {
 *   STORE: "rect"
 *  }
 * }
 * @param config
 */
export function configure(config) {
  if(config.color) {
    COLOR = _merge(COLOR, config.color);
  }

  if(config.shape) {
    SHAPE = _merge(SHAPE, config.shape);
  }

  fn.init(TYPE, SHAPE, COLOR);
}

/**
 * Merge the objects contained in the `confs` array and save this configurations in public var `pipelineList`
 * Not optionnal step for rendering multiple pipelines (automatically called)
 * @param confs - Array
 * @returns {object}
 */
export function merge (confs) {
  if (!Array.isArray(confs)) {
    console.error('pu.merge need an Array as parameter: ' + typeof confs + ' given.')
    return undefined;
  }

  pipelineList = confs;

  var res = {}
  confs.forEach(function (conf) {
    _merge(res, conf)
  })
  return res
}

/**
 * Get the pipelines from the server as given in confs and then call back `cb` witch an array containing the pipelines
 * @param confs
 * @param cb
 */
export function getPipelines (confs, cb) {
  var n = Object.keys(confs).length, datas = [];
  forEach(confs, function (conf) {
    d3.json(conf, function (data) {
      datas.push(data)
      if (datas.length === n) {
        if (isFunction(cb)) {
          cb(datas);
        }
      }
    })
  })
}

/**
 * Get given configuration file from the server, get the pipelines and render them
 * Call `cb` when it's done
 * @param confs
 * @param cb
 */
export function renderPipelineFromConf (confs, cb) {
  d3.json(confs, function (conf) {
    getPipelines(conf, function (pipelines) {
      renderPipeline(pipelines, cb);
    });
  })
}

/**
 * Render the given pipeline configuration.
 * Call `cb` when it's done
 * @param pipeline
 * @param cb
 */
export function renderPipeline (pipeline, cb) {

  console.debug('Rendering...', pipeline)

  if (Array.isArray(pipeline)) {
    pipeline = merge(pipeline);
  }

  /****************
   * BUILDING TREE
   ****************/
  fn.init(TYPE, SHAPE, COLOR);
  fn.initTree();

  /**
   * ACTIONS NODES
   */
  forEach(pipeline.actions, function (action) {
    fn.addNodeToTree(TYPE.ACTION, action);
  })

  /**
   * EVENTS NODES
   */
  forEach(pipeline.incoming_events, function (event) {
    fn.addNodeToTree(TYPE.EVENT, event);
  })

  forEach(pipeline.outgoing_events, function (event) {
    fn.addNodeToTree(TYPE.EVENT, event);
  })

  /**
   * ACTION CREATORS EDGES
   */
  forEach(pipeline.action_creators, function (edge) {
    forEach(edge.triggered_by_events, function (event) {
      fn.addParentToNode(TYPE.EVENT, event, TYPE.ACTION, edge.created_action)
    })
  })

  /**
   * STORES
   */
  forEach(pipeline.stores, function (store) {

    fn.addNodeToTree(TYPE.STORE, store);

    if (store.triggered_by_stores) {
      forEach(store.triggered_by_stores, function (storeTrigger) {
        fn.addParentToNode(TYPE.STORE, storeTrigger, TYPE.STORE, store)
      })
    }
    if (store.triggered_by_actions) {
      forEach(store.triggered_by_actions, function (actionTrigger) {
        fn.addParentToNode(TYPE.ACTION, actionTrigger, TYPE.STORE, store)
      })
    }
    if (store.triggered_event) {
      fn.addParentToNode(TYPE.STORE, store, TYPE.EVENT, store.triggered_event)
    }
  })

  /*******************
   * INITITIALIZE GRAPH
   *******************/

    // Create the input graph
  _g = new dagreD3.graphlib.Graph({compound: true})
    .setGraph({
      rankdir: 'TB'
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });


  _g = init(_g);

  d3.select("#pu-home").on("click", function () {
    addGraphToList(_g, svg, svgGroup);

    _g = new dagreD3.graphlib.Graph({compound: true})
      .setGraph({
        rankdir: 'TB'
      })
      .setDefaultEdgeLabel(function () {
        return {};
      });

    _g = init(_g);
    selectedNode = '';
    renderGraph(_g, svgGroup);
    scaleGraph(_g, svg, svgGroup);
    addListenerOnNodes(_g, svg, svgGroup);
  });

  var legend = d3.select("#pu-legend svg")

  if (!legend.empty()) {
    var legendBtn = d3.select("#pu-legendBtn");
    if (!legendBtn.empty()) {
      legendBtn.on("click", function () {
        legend.classed('close', legend.attr("class") !== "close");
      })
    }
  }

  /*******************
   * RENDERING GRAPH
   *******************/


// Add our custom shape (a house)
  render.shapes().action = function (parent, bbox, node) {
    var w = bbox.width,
      h = bbox.height,
      points = [
        {x: -w / 2, y: 0},
        {x: 0, y: h},
        {x: w / 2, y: 0},
        {x: 0, y: -h}
      ];
    var shapeSvg = parent.insert("polygon", ":first-child")
      .attr("points", points.map(function (d) {
        return d.x + "," + d.y;
      }).join(" "))
    //.attr("transform", "translate(" + (-w/2) + "," + (h * 3/4) + ")");

    node.intersect = function (point) {
      return dagreD3.intersect.polygon(node, points, point);
    };

    return shapeSvg;
  };
  var svg = d3.select("#pu-scene svg");

  if (svg.empty()) {
    svg = d3.select("#pu-scene").append("svg").attr("width", "1000")
  } else {
    svg.html('');
  }

  var svgGroup = svg.append("g");

  renderGraph(_g, svgGroup);

  scaleGraph(_g, svg, svgGroup);

  addListenerOnNodes(_g, svg, svgGroup);

  console.debug('Render OK');

  if (isFunction(cb)) {
    cb();
  }
}


/*******************
 * PRIVATE FUNCTIONS
 *******************/


function init (g) {
  fn.beforeAddNodeToGraph();
  forEach(fn.getTree(), function (node, key) {
    fn.addNodeToGraph(g, key, node, false, false, true);
  })
  return g;
}

function scaleGraph (g, svg, svgGroup) {
  if (g.graph().height != -Infinity) {
    svg.attr("height", g.graph().height + 40);
  }

  console.log(svg.attr('width'));

  if (svg.attr('width') / g.graph().width < 1) {
    svgGroup.attr("transform", "scale(" + (svg.attr('width') / g.graph().width) + ")");
  } else {
    if (svg.attr('height') / g.graph().height > 1) {
      svgGroup.attr("transform", "scale(" + (svg.attr('height') / g.graph().height) + ")");
    } else {
      svgGroup.attr("transform", "scale(" + (g.graph().height / svg.attr('height')) + ")");
    }
  }

}

function renderGraph (g, svgGroup) {

  g.nodes().forEach(function (v) {
    var node = g.node(v);
    // Round the corners of the nodes

    node.rx = node.ry = 5;

    node.style = fn.getColorForType(node.type);

    if (node.type + "." + node.label === selectedNode) {
      node.style = fn.getColorForType(node.type) + " stroke-width: 5px;"
    }
  });


  g.graph().transition = function (selection) {
    return selection.transition().duration(500);
  };

  // Run the renderer. This is what draws the final graph.
  render(svgGroup, g);
}

function addListenerOnNodes (g, svg, svgGroup) {
  d3.selectAll(".node").each(function () {
    var selection = d3.select(this);

    if (nodeInfo) {
      selection.on('click', function (t) {
        console.log(t);
        nodeInfo.html(fn.jsonPrettyPrint(fn.getTree()[t]));
      })
    }

    selection.on('dblclick', function (t) {

      addGraphToList(g, svg, svgGroup);

      selectedNode = t;

      g = new dagreD3.graphlib.Graph({compound: true})
        .setGraph({
          rankdir: 'TB'
        })
        .setDefaultEdgeLabel(function () {
          return {};
        });

      fn.beforeAddNodeToGraph();
      fn.addNodeToGraph(g, t, fn.getTree()[t], true, true);
      renderGraph(g, svgGroup);
      scaleGraph(g, svg, svgGroup);
      addListenerOnNodes(g, svg, svgGroup);
      _g = g;
    })
  });
}

function addGraphToList (g, svg, svgGroup) {
  console.trace("addGraphToList");
  graphs.push(g);

  var graphsSvg = d3.select("#pu-graph-list")
    .insert("svg", "svg")
    .attr("class", "graph")
    .attr("data-graph-id", graphs.length - 1)
    .on('click', function () {

      addGraphToList(_g, svg, svgGroup);

      g = graphs[this.getAttribute("data-graph-id")];
      renderGraph(g, svgGroup);
      scaleGraph(g, svg, svgGroup);
      addListenerOnNodes(g, svg, svgGroup);
      _g = g;
    })
  var graphsSvgGroup = graphsSvg.append("g");
  renderGraph(g, graphsSvgGroup);
  graphsSvgGroup.attr("transform", "scale(" + Math.min(500 / g.graph().width, 400 / g.graph().height) + ")");
  graphsSvg.attr("height", "400")
  graphsSvg.attr("width", "0").transition().attr("width", "500")
}