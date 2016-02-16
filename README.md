# Pipeline-UI

This is a simple html+javascript application to display pipelines from [wizbii/pipeline](https://github.com/wizbii/pipeline).

* [Installation](https://github.com/wizbii/pipeline-ui#installation)
* [Usage](https://github.com/wizbii/pipeline-ui#usage)
* [Example](https://github.com/wizbii/pipeline-ui#example)
* [Documentation](https://github.com/wizbii/pipeline-ui#documentation)

## Installation

```
npm install wizbii/pipeline-ui --save
```

## Usage

You need to include `dist/app.js` which will give you access to [d3](https://github.com/mbostock/d3) and pu (as Pipeline-Ui). There's an usage example in `example/index.html`.

To render the pipeline, you *have to* declare some tags with the following IDs:

* `#pu-home`: when clicked, resets the pipeline to its initial state.
* `#pu-scene`: used to render the pipeline (please note that the element will be emptied).
* `#pu-graph-list`: used to display the history (please note that the element will be emptied).

And those ones are optional:

* `#pu-node-info`: used to display the node's json data when its clicked. Use a `<pre></pre>` element for a fancier display.

## Example

### Unique Pipeline

To render a single pipeline, all you have to is:

```javascript
pu.renderPipeline(data);
```

So if the pipeline's data is located in a `pipeline.json` file, here is what you could do:

```javascript
d3.json('pipeline.json', pu.renderPipeline);
```

### Multiple Pipelines

`pu.renderPipeline` also accepts an array so if you're dealing with multiple pipelines you could just do:

```javascript
pu.renderPipeline([data1, data2])
```

Now, considering the list of pipelines is defined in a `conf.json` file like so:

```json
{
  "pipeline-profile": "/api/pipeline",
  "pipeline-project": "pipeline.json"
}
```

Here is how you could fetch and render them:

```javascript
d3.json('conf.json', function (conf) {
  pu.getPipelines(conf, pipelines => pu.renderPipeline(pipelines));
});
```

Or even simpler:

```javascript
pu.renderPipelineFromConf('conf.json');
```

In such case, you might want to give the user the possibility to choose which pipeline to display. Here is a solution that uses the `<select>` element:

```javascript
pu.renderPipelineFromConf('conf.json', function () {
    const select = d3
    	.select("#pipeline-list") // the container
	.append("select") // append a <select> element
	.on('change', function () { // when the value of the select changes, render the selected pipeline
	    if (pu.pipelineList[this.selectedIndex - 1]) {
	        // if it is a single pipeline, render it
	        pu.renderPipeline(pu.pipelineList[this.selectedIndex - 1]) 
	    } else {
	        // otherwise, render all the pipelines
	        pu.renderPipeline(pu.pipelineList); 
	    }
	});

    select
    	.append("option")
    	.html("All pipelines"); // add an option to render all pipelines

    pu.pipelineList.forEach(function (pipeline) { // for each pipeline add on option
	select
	    .append("option")
	    .html(pipeline.name)
	    .attr("value", pipeline.name);
    });
});
```

## Documentation

### pu.renderPipelineFromConf(confs, cb)

Get given configuration file from the server, get the defined pipelines and render them. Call `cb` when the render is done (no parameter).


### pu.getPipelines(confs, cb)

Called by the previous function after getting confs from server. This method get all the pipelines from the server, based on the confs object (see the previous example of `conf.json`). Return an array containing all the pipelines.

Call `cb` when rendering is done (no parameter).

### pu.renderPipeline(pipeline, cb)

Render the given pipeline configuration. If the first parameter is an array, it will be merged using the `pu.merge` function.

Example of pipeline:

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

### pu.configure(config)

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


### pu.merge(confs)

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
