Pipeline-UI
=====

This is a simple html+javascript application to display pipelines from [Wizbii/pipeline](https://github.com/wizbii/pipeline)


# Installation
```
npm install wizbii/pipeline-ui --save
```

# Usage

You need to include `dist/app.js` which will expose [d3](https://github.com/mbostock/d3) and pu (as Pipeline-Ui)

Example of usage in `example/index.html`

To render the pipeline, you *have to* declare some tags with the following IDs:
 * `#pu-home` : This tag have an event listener to reset the pipeline at its initial state
 * `#pu-scene` : An empty tag where the pipeline will be rendered
 * `#pu-graph-list` : An empty tag where the history of displayed graphs will be rendered

And these ones are optional:
 * `#pu-node-info` : used to display information about a node after a click on a given node.
 ( `pre` tag recommended )

## Example of usage


### Unique pipeline

To render a single pipeline defined in `pipeline.json`, all you need is to call this function :
```javascript
d3.json('pipeline.json', pu.renderPipeline);
```
### Multiple pipelines
To get & render multiple pipelines from `conf.json`, here is the detailled method : 
```javascript
d3.json('conf.json', function (conf) {
  pu.getPipelines(conf, function (pipelines) {
     pu.renderPipeline(pipelines);
  });
});
```
Or simpler :
```javascript
pu.renderPipelineFromConf('conf.json');
```
Exemple of `conf.json` :
```json
{
  "pipeline-profile": "http://localhost:9160/api/pipeline",
  "pipeline-project": "pipeline.json"
}
```

In this case, you would probably like to choose which pipeline you want to display. Here is a solution which display a `select` dropdown with all the available pipelines.
```javascript
pu.renderPipelineFromConf('conf.json', function () {
    
    var container = d3.select("#pipeline-list")
    .append("select") // append the <select> tag to the #pipeline-list tag
    .on('change', function () { // On changing the selection, render the selected pipeline
        if (pu.pipelineList[this.selectedIndex - 1]) {
            // If it is a single pipeline, render it
            pu.renderPipeline(pu.pipelineList[this.selectedIndex - 1]) 
        } else {
            // If it is not, render all the pipelines
            pu.renderPipeline(pu.pipelineList); 
        }
    })

    container.append("option").html("All pipelines"); // Add an option to render all pipelines

    pu.pipelineList.forEach(function (pipeline) { // For each pipeline add on option
        container.append("option")
                 .html(pipeline.name)
                 .attr("value", pipeline.name);
    })
});
```

## Available functions :

#### pu.renderPipelineFromConf(confs, cb)

Get given configuration file from the server, get the defined pipelines and render them. Call `cb` when the render is done (no parameter).


#### pu.getPipelines(confs, cb)

Called by the previous function after getting confs from server. This method get all the pipelines from the server, based on the confs object (see the previous example of `conf.json`). Return an array containing all the pipelines.

Call `cb` when rendering is done (no parameter).

#### pu.renderPipeline(pipeline, cb)

Render the given pipeline configuration. If the first parameter is an array, it will be merged using the `pu.merge` function.

Exemple of pipeline :

```json
{
  "name": "pipeline-example",
  "actions": {
    "page_loaded": {
      "name": "Page loaded"
    }
  },
  "incoming_events": {
    "page_loaded": {
      "name": "Page loaded"
    }
  },
  "outgoing_events": {
    "pipeline_rendered": {
      "name": "Pipeline rendered"
    }
  },
  "action_creators": {
    "page_loaded": {
      "created_action": {
        "name": "Page loaded"
      },
      "triggered_by_events": [
        {
          "name": "Page loaded"
        }
      ]
    }
  },
  "stores": {
    "render_pipeline": {
      "name": "Render pipeline",
      "triggered_by_stores": {},
      "triggered_by_actions": {
        "page_loaded": {
          "name": "Page loaded"
        }
      },
      "triggered_event": {
        "name": "Pipeline rendered"
      }
    }
  }
}
```

#### pu.configure(config)

Allow to edit some configuration :

* `config.color.event` : color of the `event` nodes
* `config.color.scope` : color of the `scope` nodes
* `config.color.action` : color of the `action` nodes

Exemple of usage :
```
    pu.configure({
        color: {
            EVENT: "#77f"
        },
        shape: {
            STORE: "rect"
        }
    })
```


#### pu.merge(confs)

Save this `confs` in `pu.pipelineList` and recursively merge the objects contained in the `confs` array and return the merged object. See the [lodash merge](https://lodash.com/docs#merge) for more info. This method is used to merge mutliple pipelines before rendering them.

Exemple :

* `confs` parameter
```json
[
    {
        "actions": {
            "action1":  {
                "name": "Action 1"
            }
        }
    },
    {
        "actions": {
            "action2":  {
                "name": "Action 2"
            }
        }
    },
]
```
* return value
```json
{
	"actions": {
        "action1":  {
            "name": "Action 1"
        },
        "action2":  {
            "name": "Action 2"
        }
	}
}
```

Enjoy !