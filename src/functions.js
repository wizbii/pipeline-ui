import forEach from 'lodash/forEach';

var tree = {}, TYPE, COLOR, SHAPE;

export function initTree () {
  tree = {};
}

export function getTree () {
  return tree;
}

export function init (type, shape, color) {
  TYPE = type;
  SHAPE = shape;
  COLOR = color;
}

export function addNodeToTree (type, node) {
  if (!tree[type + "." + node.name]) {
    tree[type + "." + node.name] = node;
    tree[type + "." + node.name].children = [];
    tree[type + "." + node.name].parents = [];
  }
}

export function addParentToNode (typeParent, parent, typeNode, node) {
  if (!tree[typeParent + "." + parent.name]) {
    addNodeToTree(typeParent, parent);
  }
  if (!tree[typeNode + "." + node.name]) {
    addNodeToTree(typeNode, node);
  }
  tree[typeParent + "." + parent.name].children.push(typeNode + "." + node.name);
  tree[typeNode + "." + node.name].parents.push(typeParent + "." + parent.name);
}

export function getTypeFromKey (key) {
  return key.substring(key.indexOf('.'), 0);
}

export function addNodeToGraph (g, key, node, buildParents = false, buildChildren = false, init = false) {
  g.setNode(key, {label: node.name, shape: SHAPE[getTypeFromKey(key)], type: TYPE[getTypeFromKey(key)]})
  if (node.parents.length != 0) {
    forEach(node.parents, function (parent) {
      if (buildParents || init) {
        g.setEdge(parent, key);
      }
      if (buildParents) {
        var parentNode = tree[parent];
        addNodeToGraph(g, parent, parentNode, true, false);
      }
    })
  }
  if (node.children.length != 0) {
    forEach(node.children, function (child) {
      if (buildChildren || init) {
        g.setEdge(key, child);
      }
      if (buildChildren) {
        var childNode = tree[child];
        addNodeToGraph(g, child, childNode, false, true);
      }
    })
  }
}

export function getColorForType (type) {
  return "fill :" + COLOR[type] + ";";
}

export function jsonPrettyPrint (json) {
  if (typeof json != 'string') {
    json = JSON.stringify(json, undefined, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}