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
    var d = svg.append("g").attr("transform", "translate(" + width / 4 + "," + height / 2 + ")");
    var bg = d.append("rect").on("click", O);
    bg.attr("class", "bg")
    .attr("x", width/-4)
    .attr("y", height/-2)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent")
    .attr("stroke", "black");

    var links = d.append("g").attr("class", "links")
      , episodes = d.append("g").attr("class", "episodes")
      , gNodes = d.append("g").attr("class", "nodes");
    var graphInfo = d3.select("#graph-info");
    
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
        
        O();
        updateGraph();
    });

    function O() {
        if (L.node === null) {
            return
        }
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
        updateGraph()
    }
    function clickNode(Y, X) {
        if (L.node === Y && X !== true) {
            if (Y.type === "episode") {
                window.location.href = "/" + Y.slug;
                return
            }
            L.node.children.forEach(function(aa) {
                aa.children = aa._group
            });
            updateTree();
            return
        }
        if (Y.isGroup) {
            L.node.children.forEach(function(aa) {
                aa.children = aa._group
            });
            Y.parent.children = Y.parent._children;
            updateTree();
            return
        }
        Y = nodes[Y.canonicalKey];
        dataMapValues.forEach(function(aa) {
            aa.parent = null;
            aa.children = [];
            aa._children = [];
            aa._group = [];
            aa.canonicalKey = aa.key;
            aa.xOffset = 0
        });
        L.node = Y;
        L.node.children = childrenMap.get(Y.canonicalKey);
        L.map = {};
        var Z = 0;
        L.node.children.forEach(function(ac) {
            L.map[ac.key] = true;
            ac._children = childrenMap.get(ac.key).filter(function(ad) {
                return ad.canonicalKey !== Y.canonicalKey
            });
            ac._children = JSON.parse(JSON.stringify(ac._children));
            ac._children.forEach(function(ad) {
                ad.canonicalKey = ad.key;
                ad.key = ac.key + "-" + ad.key;
                L.map[ad.key] = true
            });
            var aa = ac.key + "-group"
              , ab = ac._children.length;
            ac._group = [{
                isGroup: true,
                key: aa + "-group-key",
                canonicalKey: aa,
                name: ab,
                count: ab,
                xOffset: 0
            }];
            L.map[aa] = true;
            Z += ab
        });
        L.node.children.forEach(function(aa) {
            aa.children = Z > 50 ? aa._group : aa._children
        });
        //window.location.hash = L.node.key;
        updateTree()
    }
    function mouseoutNode() {
        k = {
            node: null,
            map: {}
        };
        z()
    }
    function mouseoverNode(X) {
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
    function updateGraph() {
        updateLinks();
        links.selectAll("path").attr("d", function(X) {
            return v([[X.x1, X.y1], [X.x1, X.y1], [X.x1, X.y1]])
        }).transition().duration(w).attr("d", function(X) {
            return v([[X.x1, X.y1], [X.target.xOffset * s, 0], [X.x2, X.y2]])
        });
        updateEpisodes(dataMap.get("episodes"));
        updateEpisodes2(dataMap.get("themes")); //updateNodes(dataMap.get("themes"));
        updateDetail([]);
        graphInfo.html('<a href="/the-concept-map/">What\'s this?</a>');
        mouseoutNode();
        z()
    }
    function updateTree() {
        var root = d3.hierarchy(L.node);
        var X = treeLayout(root);
        /*X.forEach(function(Z) {
            if (Z.depth === 1) {
                Z.y -= 20
            }
        });*/
        //console.log(root.descendants());
        edges = root.links();
        edges.forEach(function(Z) {
            Object.assign(Z.source, Z.source.data)
            Object.assign(Z.target, Z.target.data)
            if (Z.source.data.type === "episode") {
                Z.key = Z.source.data.canonicalKey + "-to-" + Z.target.data.canonicalKey
            } else {
                Z.key = Z.target.data.canonicalKey + "-to-" + Z.source.data.canonicalKey
            }
            Z.canonicalKey = Z.key
        });
        updateLinks();
        links.selectAll("path").transition().duration(w).attr("d", link);
        updateEpisodes([]);
        updateEpisodes2(X);//updateNodes(X);
        updateDetail([L.node]);
        var Y = "";
        if (L.node.description) {
            Y = L.node.description
        }
        graphInfo.html(Y);
        mouseoutNode();
        z()
    }
    function updateNodes(X) {
        var X = gNodes.selectAll(".node").data(X, dataKey);
        var Y = X.enter().append("g").attr("transform", function(aa) {
            var Z = aa.parent ? aa.parent : {
                xOffset: 0,
                x: 0,
                y: 0
            };
            return "translate(" + Z.xOffset + ",0)rotate(" + (Z.x - 90) + ")translate(" + Z.y + ")"
        }).attr("class", "node").on("mouseover", mouseoverNode).on("mouseout", mouseoutNode).on("click", clickNode);
        Y.append("circle").attr("r", 0);
        Y.append("text").attr("stroke", "#fff").attr("stroke-width", 4).attr("class", "label-stroke");
        Y.append("text").attr("font-size", 0).attr("class", "label");
        X.transition().duration(w).attr("transform", function(Z) {
            if (Z === L.node) {
                return null
            }
            var aa = Z.isGroup ? Z.y + (7 + Z.count) : Z.y;
            return "translate(" + Z.xOffset + ",0)rotate(" + (Z.x - 90) + ")translate(" + aa + ")"
        });
        X.selectAll("circle").transition().duration(w).attr("r", function(Z) {
            if (Z == L.node) {
                return 100
            } else {
                if (Z.isGroup) {
                    return 7 + Z.count
                } else {
                    return 4.5
                }
            }
        });
        X.selectAll("text").transition().duration(w).attr("dy", ".3em").attr("font-size", function(Z) {
            if (Z.depth === 0) {
                return 20
            } else {
                return 15
            }
        }).text(function(Z) {
            return Z.name
        }).attr("text-anchor", function(Z) {
            if (Z === L.node || Z.isGroup) {
                return "middle"
            }
            return Z.x < 180 ? "start" : "end"
        }).attr("transform", function(Z) {
            if (Z === L.node) {
                return null
            } else {
                if (Z.isGroup) {
                    return Z.x > 180 ? "rotate(180)" : null
                }
            }
            return Z.x < 180 ? "translate(" + t + ")" : "rotate(180)translate(-" + t + ")"
        });
        X.selectAll("text.label-stroke").attr("display", function(Z) {
            return Z.depth === 1 ? "block" : "none"
        });
        X.exit().remove()
    }
    function updateLinks() {
        var X = links.selectAll("path").data(edges, dataKey);
        X.enter().append("path").attr("d", function(Z) {
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
        var ac = d.selectAll(".detail").data(Z, dataKey);
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
        var X = d.selectAll(".all-episodes").data(Z);
        X.enter().append("text").attr("text-anchor", "start").attr("x", width / -2 + t).attr("y", height / 2 - t).text("all episodes").attr("class", "all-episodes").on("click", O);
        X.exit().remove()
    }
    function updateEpisodes(Y) {
        var Y = episodes.selectAll(".episode").data(Y, dataKey);
        var X = Y.enter().append("g").attr("class", "episode").on("mouseover", mouseoverNode).on("mouseout", mouseoutNode).on("click", clickNode);
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
        var X = Y.enter().append("g").attr("class", "node").on("mouseover", mouseoverNode).on("mouseout", mouseoutNode).on("click", clickNode);
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
        links.selectAll("path").attr("stroke", function(X) {
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
        /*
        gNodes.selectAll("text.label").attr("fill", function(X) {
            return (X === L.node || X.isGroup) ? "#fff" : l(X, "#000", N, "#999")
        })*/
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
