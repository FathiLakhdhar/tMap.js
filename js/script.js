(function() {
    var width = 800
      , height = 600
      , h = height
      , U = 200
      , K = 16
      , S = 20
      , s = 8
      , R = 110
      , J = 30
      , o = 15
      , t = 10
      , w = 1000
      , F = "elastic"
      , N = "#0da4d3";


    var consts = {
        selectedClass: "selected",
        connectClass: "connect-node"
    }

    var state = {
        mouseDownNode: null, 
        mouseDownLink: null, 
        shiftNodeDrag: false,
        justDragged: false,
    }

    var dataMap, dataMapValues, nodes, childrenMap, edges, A, P;
    var L = {} // selected node
      , k = {};//  mouseover / mouseout
    var i, y, i2, y2;
    var treeLayout = d3.tree();
    treeLayout.size([360, h / 2 - R]).separation(function(Y, X) {
        return (Y.parent == X.parent ? 1 : 2) / Y.depth
    });
    var link = d3.linkRadial()
      .angle(function(X) { return X.x / 180 * Math.PI; })
      .radius(function(X) { return X.y; });

    var v = d3.line().x(function(X) {
        return X[0]
    }).y(function(X) {
        return X[1]
    }).curve(d3.curveBasis);//.tension(0.5);
    var svg = d3.select("#graph").append("svg").attr("width", width).attr("height", height);
    svg.on("keydown", onKeyDown)
        .on("keyup", onKeyUp);

    var defs = svg.append("svg:defs");

    //arrowhead
     defs.append("svg:marker").attr("id", "arrowhead").attr("viewBox", "-0 -5 10 10")
    .attr("refX", 5).attr("refY", 0).attr("markerWidth", 5).attr("markerHeight", 5)
    .attr("orient", "auto").append("path").attr("d", "M 0, -5 L 10 ,0 L 0,5")
    .style("fill", "#999")
    .style("stroke", "none");
    //hover arrowhead
    defs.append("svg:marker").attr("id", "hover-arrowhead").attr("viewBox", "-0 -5 10 10")
    .attr("refX", 5).attr("refY", 0).attr("markerWidth", 5).attr("markerHeight", 5)
    .attr("orient", "auto").append("path").attr("d", "M 0, -5 L 10 ,0 L 0,5")
    .style("fill", N)
    .style("stroke", "none");

    var bg = svg.append("rect")
        .attr("class", "bg")
        .attr("x", 0.5)
        .attr("y", 0.5)
        .attr("width", width - 1)
        .attr("height", height - 1)
        .attr("fill", "transparent")
        .attr("stroke", "black");

    var svgG = svg.append("g").attr("transform", "translate(" + width / 4 + "," + height / 2 + ")");

    let zoom = d3.zoom().on("zoom", () => handleZoom(svgG));
    bg.call(zoom);

    /*let zoomListner = d3.zoom().scaleExtent([0.1, 3]).
        on("start", function() {d3.select("body").style("cursor", "move");})
        .on("zoom",() => handleZoom(svgG))
        .on("end", function() {d3.select("body").style("cursor", "auto");});*/

    //svg.call(zoomListner);

    var links = svgG.append("g").attr("class", "links")
      , episodes = svgG.append("g").attr("class", "episodes")
      , gNodes = svgG.append("g").attr("class", "nodes");
    var graphInfo = d3.select("#graph-info");

    var dragLink = svgG.append("path")
                    .attr("class", "dragLink hidden")
                    .attr("d", "M0,0L0,0");

    function handleZoom(svgGroup) {
        svgGroup
          .attr("transform",
          `translate(${d3.event.transform.x + width / 4}, ${d3.event.transform.y + height / 2})` + " " +
          `scale(${d3.event.transform.k})`);
    }
    
    d3.json("metadata.json").then(function(data) {
        dataMap = d3.map(data);
        dataMapValues = d3.merge(dataMap.values());
        nodes = {};
        A = d3.map();
        dataMapValues.forEach(function(o) {
            o.key = gkey(o.name);
            o.canonicalKey = o.key;
            nodes[o.key] = o;
            if (o.group) {
                if (!A.has(o.group)) {
                    A.set(o.group, [])
                }
                A.get(o.group).push(o)
            }
        });

        updateMapChildren();
        
        O();
        updateGraph();
    });

    function O() {

        L = {
            node: null,
            map: {}
        };
        i = 16;
        y = Math.floor(dataMap.get("episodes").length * i / 2);
        dataMap.get("episodes").forEach(function(o, index) {
            o.x = U / -2;
            o.y = index * i - y
        });
       
        i2 = 17;
        y2 = Math.floor(dataMap.get("themes").length * i2 / 2);
        dataMap.get("themes").forEach(function(t, index) {
            t.x = 300 + U / -2;
            t.y = index * i2 - y2;
            t.xOffset = S;
            t.depth = 1
        });
        
        edges = [];
        var node, Y, aa, X = h / 2 - R;
        dataMap.get("episodes").forEach(function(o) {
            o.links.forEach(function(l) {
                node = nodes[gkey(l)];
                if (!node || node.type === "reference") {
                    return
                }
                Y = (node.x - 90) * Math.PI / 180;
                aa = o.key + "-to-" + node.key;
                edges.push({
                    source: o,
                    target: node,
                    key: aa,
                    canonicalKey: aa,
                    x1: o.x + U,
                    y1: o.y + K / 2,
                    x2: node.x,
                    y2: node.y + K / 2
                })
            })
        });
        updateGraph();
    }

    function mouseoutNode() {
        
        k = {
            node: null,
            map: {}
        };
        z()
    }
    function mouseoverNode(X) {

        //dragLink
        if (X.type == 'theme' && state.shiftNodeDrag) {
            state.target = {
                d3Node: d3.select(this),
                node: X
            }
            
            d3.select(this).classed(consts.connectClass, true);
        }

        if (k.node === X) {
            return
        }
        k.node = X;
        k.map = {};
        k.map[X.key] = true;
        if (X.key !== X.canonicalKey) {
            k.map[X.parent.canonicalKey] = true;
            k.map[X.parent.canonicalKey + "-to-" + X.canonicalKey] = true;
            k.map[X.canonicalKey + "-to-" + X.parent.canonicalKey] = true
        } else {
            if (childrenMap.get(X.canonicalKey)) {
                childrenMap.get(X.canonicalKey).forEach(function(Y) {
                    k.map[Y.canonicalKey] = true;
                    k.map[X.canonicalKey + "-" + Y.canonicalKey] = true
                });
                edges.forEach(function(Y) {
                    if (k.map[Y.source.canonicalKey] && k.map[Y.target.canonicalKey]) {
                        k.map[Y.canonicalKey] = true
                    }
                })
            }
            
        }
        z()
    }


    function nodeMouseDown(d) {
        d3Node = d3.select(this);
        d3.event.stopPropagation();
        state.mouseDownNode = d;
        if (d3.event.shiftKey && d.type=="episode") {
            state.shiftNodeDrag = d3.event.shiftKey;
            dragLink.classed('hidden', false).attr('d', `M${d.x + U},${d.y + K / 2}L${d.x},${d.y}`);
            return;
        }
    }


    function nodeMouseUp(d3Node, d) {
        state.shiftNodeDrag = false;
        d3Node.classed(consts.connectClass, false);
        if (!state.mouseDownNode) {return}
        dragLink.classed("hidden", true);
        if (state.mouseDownNode.key != d.key && state.mouseDownNode.type == "episode" && d.type == "theme") {// create new link
            createNewLink(state.mouseDownNode, d);
        }
        state.target = null;
        state.mouseDownNode = null;
    }

    function createNewLink(source, target) {
        //TODO crete new link
        dataMap.get("episodes").forEach(function(o, index) {
            if (gkey(o.name) == source.key && !o.links.find(l=> l==target.name)) {
                o.links.push(target.name)
            }
        });
        console.log(`new Link : ${source.name} To ${target.name}`);
        updateMapChildren();
        O();
    }

    function dragMove(d) {
        state.justDragged = true;
        d3Node = this;
        if (state.shiftNodeDrag) {//drag link 
            dragLink.attr("d", `M${d.x + U},${d.y + K / 2}L${d3.mouse(svgG.node())[0]},${d3.mouse(svgG.node())[1]}`)
        }else {
            //drag Node
        }
    }

    function onKeyDown() {
        if (d3.event.keyCode == 16) {}//shift pressed
    }

    function onKeyUp() {
        if (d3.event.keyCode == 16) {}//shift up
        else if (d3.event.keyCode == 46) {//delete
            var node = state.selectedNode;
            if(node!=null) {
                //TODO delete node
            }
        }
    }


    function updateMapChildren () {
        childrenMap = d3.map();
        dataMap.get("episodes").forEach(function(o) {
            o.links = o.links.filter(function(k) {
                return typeof nodes[gkey(k)] !== "undefined" && k.indexOf("r-") !== 0
            });
            childrenMap.set(o.key, o.links.map(function(k) {
                var key = gkey(k);
                if (typeof childrenMap.get(key) === "undefined") {
                    childrenMap.set(key, [])
                }
                childrenMap.get(key).push(o);
                return nodes[key];
            }))
        });
    }


    function updateGraph() {
        updateLinks();
        links.selectAll("path").attr("d", function(X) {
            return v([[X.x1, X.y1], [X.x1, X.y1], [X.x1, X.y1]])
        }).transition().duration(w).attr("d", function(X) {
            return v([[X.x1, X.y1], [X.target.xOffset * s, 0], [X.x2 - 2, X.y2]])//X.target.xOffset * s
        });
        updateEpisodes(dataMap.get("episodes"));
        updateEpisodes2(dataMap.get("themes")); //updateNodes(dataMap.get("themes"));
        updateDetail([]);
        graphInfo.html('<a href="/the-concept-map/">What\'s this?</a>');
        mouseoutNode();
        z()
    }

    function updateLinks() {
        var X = links.selectAll("path").data(edges, dataKey);
        X.enter().append("path")
        .attr("d", function(Z) {
            var S = Z.source ? {
                x: Z.source.x,
                y: Z.source.y
            } : {
                x: 0,
                y: 0
            };
            return link({
                source: S,
                target: S
            })
        }).attr("class", "link");
        X.exit().remove()
    }
    function updateDetail(Z) {
        var ac = svgG.selectAll(".detail").data(Z, dataKey);
        var Y = ac.enter().append("g").attr("class", "detail");
        var ab = Z[0];
        if (ab && ab.type === "episode") {
            var aa = Y.append("a").attr("xlink:href", function(ae) {
                return "/" + ae.slug
            });
            aa.append("text").attr("fill", N).attr("text-anchor", "middle").attr("y", (o + t) * -1).text(function(ae) {
                return "EPISODE " + ae.episode
            })
        } else {
            if (ab && ab.type === "theme") {
                Y.append("text").attr("fill", "#aaa").attr("text-anchor", "middle").attr("y", (o + t) * -1).text("THEME")
            } else {
                if (ab && ab.type === "perspective") {
                    var ad = ac.selectAll(".pair").data(A.get(ab.group).filter(function(ae) {
                        return ae !== ab
                    }), dataKey);
                    ad.enter().append("text").attr("fill", "#aaa").attr("text-anchor", "middle").attr("y", function(af, ae) {
                        return (o + t) * 2 + (ae * (o + t))
                    }).text(function(ae) {
                        return "(vs. " + ae.name + ")"
                    }).attr("class", "pair").on("click", clickNode);
                    Y.append("text").attr("fill", "#aaa").attr("text-anchor", "middle").attr("y", (o + t) * -1).text("PERSPECTIVE");
                    ad.exit().remove()
                }
            }
        }
        ac.exit().remove();
        var X = svgG.selectAll(".all-episodes").data(Z);
        X.enter().append("text").attr("text-anchor", "start").attr("x", width / -2 + t).attr("y", height / 2 - t).text("all episodes").attr("class", "all-episodes").on("click", O);
        X.exit().remove()
    }
    function updateEpisodes(Y) {
        var Y = episodes.selectAll(".episode").data(Y, dataKey);
        var X = Y.enter().append("g")
                .attr("class", "episode")
                .on("mousedown", nodeMouseDown)
                .on("mouseover", mouseoverNode)
                .on("mouseout", mouseoutNode)
                .call(d3.drag()
                    .on("start", function() {})
                    .on("drag", dragMove)
                    .on("end", function(d) {
                        if (state.target) {
                            nodeMouseUp(state.target.d3Node, state.target.node);
                        }else if (state.shiftNodeDrag){
                            state.shiftNodeDrag = false;
                            dragLink.classed('hidden', true);
                        }
                    })
                    );
                //.on("click", clickNode);
        X.append("rect").attr("x", U / -2).attr("y", K / -2).attr("width", U).attr("height", K).transition().duration(w).attr("x", function(Z) {
            return Z.x
        }).attr("y", function(Z) {
            return Z.y
        });
        X.append("text").attr("x", function(Z) {
            return U / -2 + t
        }).attr("y", function(Z) {
            return K / -2 + o
        }).attr("fill", "#fff").text(function(Z) {
            return Z.name
        }).transition().duration(w).attr("x", function(Z) {
            return Z.x + t
        }).attr("y", function(Z) {
            return Z.y + 10
        });
        Y.exit().selectAll("rect").transition().duration(w).attr("x", function(Z) {
            return U / -2
        }).attr("y", function(Z) {
            return K / -2
        });
        Y.exit().selectAll("text").transition().duration(w).attr("x", function(Z) {
            return U / -2 + t
        }).attr("y", function(Z) {
            return K / -2 + o
        });
        Y.exit().transition().duration(w).remove()
    }

    function updateEpisodes2(Y) {
        var Y = gNodes.selectAll(".node").data(Y, dataKey);
        var X = Y.enter().append("g").attr("class", "node")
        .on("mouseover", mouseoverNode)
        .on("mouseout", mouseoutNode);
        //.on("click", clickNode);
        X.append("rect").attr("x", U / -2).attr("y", K / -2).attr("width", U).attr("height", K).transition().duration(w).attr("x", function(Z) {
            return Z.x
        }).attr("y", function(Z) {
            return Z.y
        });
        X.append("text").attr("x", function(Z) {
            return U / -2 + t
        }).attr("y", function(Z) {
            return K / -2 + o
        }).attr("fill", "#fff").text(function(Z) {
            return Z.name
        }).transition().duration(w).attr("x", function(Z) {
            return Z.x + t
        }).attr("y", function(Z) {
            return Z.y + 10
        });
        Y.exit().selectAll("rect").transition().duration(w).attr("x", function(Z) {
            return U / -2
        }).attr("y", function(Z) {
            return K / -2
        });
        Y.exit().selectAll("text").transition().duration(w).attr("x", function(Z) {
            return U / -2 + t
        }).attr("y", function(Z) {
            return K / -2 + o
        });
        Y.exit().transition().duration(w).remove()
    }

    function z() {
        episodes.selectAll("rect").attr("fill", function(X) {
            return l(X, "#000", N, "#000")
        });
        links.selectAll("path")
        .attr("marker-end", function(X) {
            return l(X, "url(#arrowhead)", "url(#hover-arrowhead)", "url(#arrowhead)")
        }).attr("stroke", function(X) {
            return l(X, "#aaa", N, "#aaa")
        }).attr("stroke-width", function(X) {
            return l(X, "1.5px", "2.5px", "1px")
        }).attr("opacity", function(X) {
            return l(X, 0.4, 0.75, 0.3)
        }).sort(function(Y, X) {
            if (!k.node) {
                return 0
            }
            var aa = k.map[Y.canonicalKey] ? 1 : 0
              , Z = k.map[X.canonicalKey] ? 1 : 0;
            return aa - Z
        });
        gNodes.selectAll("rect").attr("fill", function(X) {
            return l(X, "#000", N, "#000")
        })
    }
    function gkey(X) {
        return X.toLowerCase().replace(/[ .,()]/g, "-")
    }
    function dataKey(X) {
        return X.key
    }
    function l(X, aa, Z, Y) {
        if (k.node === null) {
            return aa
        }
        return k.map[X.key] ? Z : aa
    }
}
)();
