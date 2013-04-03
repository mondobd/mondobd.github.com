'use strict';

define([], function() {

  return function() {
    var tree_canvas = {
        w: 960,
        h: 2000
      },
      slider_canvas = {
        w: 960,
        h: 400
      },
      i = 0,
      duration = 500,
      tree_root,
      root,
      flat_list = [],
      exploration_list = [],
      cards = [],
      glossary = [],
      flexslider,
      restart_uri = window.location.pathname,
      global_sid,
      DEBUG_MODE = true,
      TREE_VIEW = false;

    var tree = d3.layout.tree()
        .size([tree_canvas.h, tree_canvas.w - 160]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    var vis = d3.select(".chart#slider").append("ul")
        .attr("class", "slides");

    if(TREE_VIEW) {
      var tree_vis = d3.select(".chart#tree").append("svg:svg")
        .attr("width", tree_canvas.w)
        .attr("height", tree_canvas.h)
       .append("svg:g")
        .attr("transform", "translate(40,0)");
    }

    // read the cards file
    d3.json("data/cards.json", function(json) {
      cards = json;
    });

    // read the glossary file
    d3.csv("data/glossary.csv", function(data) {
      glossary = _.map(data, function(item) { return { 'key': item.key.charAt(0).toLowerCase() + item.key.slice(1), value: item.value }; });
      
      // debug output
      if(DEBUG_MODE) console.log('reading glossary with ' + glossary.length + ' items');
    });

    d3.json("data/data.json", function(json) {
      json.x0 = 800;
      json.y0 = 0;

      // flatten([json]);
      
      flat_list = json;
      
      // check broken glossary links
      if(DEBUG_MODE) {
        console.log('checking glossary links');
        _.each(flat_list, function(value, key, list) {
          var sid = value.sid;
          value.card = _.find(cards, function(item) { if(item.sid === sid) return true; });
          if(value.card && value.card.card.description) {
            global_sid = sid;
            value.card.card.description.replace(/\{{([^\{]*?)\|([^\{]*)\}\}/g, glossary_lookup);
          }
        });
      }

      // console.log("the whole tree!");
      // console.log(json);
      // console.log("the whole list!");
      // console.log(flat_list);
      
      // update_tree(tree_root = json);
      exploration_list = [ get_children(_.find(flat_list, function(item) { return item.sid === 0; } )) ];
      // console.log("the root element!");
      // console.log(exploration_list);
      update(exploration_list);
    });

    function add_click_listener(selection, d) {
      if(!d.end) {
        selection.on("click", click);
      }
    }

    function flatten(list) {
      _.each(list, function(element, index, list) {
        flat_list.push({
          sid: element.sid,
          name: element.name,
          children: _.map(element.children, function(child) { return child.sid; }),
          end: element.end ? element.end : false,
          card: element.card ? element.card : false,
          photo_count: element.photo_count ? element.photo_count : false
        });
        if(element.children) {
          flatten(element.children);
        }
      });
    }

    function get_children(node) {
      var children = _.filter(flat_list, function(item) { if(_.contains(node.children, item.sid)) { return item; }; });
      console.log(['returning children', _.map(children, function(child) { return child.sid; })]);
      return children;
    }

    function get_ancestry(node_sid) {
      return false;
    }

    // core viz function for the slider view
    function update(matrix) {
      console.log("update nodes");
      console.log(matrix);

      if(!flexslider) {
        $("#slider").flexslider({
          animation: 'slide',
          slideshow: false,
          animationLoop: false,
          mousewheel: true
        });
        flexslider = $("#slider").data('flexslider');
      }
      
      if(flexslider && DEBUG_MODE) {
        console.log('flexslider');
        console.log(flexslider);
      }

      var choice_groups_data = vis.selectAll("ul.slides li")
          .data(matrix);
          
      var choice_groups = choice_groups_data
        .enter()
          .append("li")
          .attr("class", "choice-group")
          .each(function(d, i) { d3.select(this).attr("data-children-count", d.length); })
          .each(function(d, i) { if(flexslider) { flexslider.addSlide(this); flexslider.flexslider('next'); } });
        
        choice_groups
          .append("span")
          .attr("class", "repeat-choice")
          .text("Modifica questa scelta")
          .on("click", repeat_choice);
        
      var choices = choice_groups.selectAll("div")
          .data(function(d) { console.log(["d is", d]); return d; });
          
      choices
        .enter().append("div").each(function(d) {
          
          d3.select(this)
            .attr("class", function(d) { if(d.end) { return "choice-container end"; } else { return "choice-container"; } })
            .attr("id", function(d) { return "choice-" + d.sid })
            .attr("data-sid", function(d) { return d.sid; })
            .attr("data-end", function(d) { if(d.end) { return d.end; } else { return false; } })
            .call(add_click_listener, d)
            .append("span")
            .attr("class", function(d) { if(d.end) { return "colorbox colorbox" + d.sid; } })
            .attr("rel", function(d) { if(d.end) { return "colorbox" + d.sid; } })
            .attr("href", function(d) { if(d.end) { return "items/item" + d.sid + ".html"; } })
            .attr("data-sid", function(d) { if(d.end) { return d.sid; } })
            .call(activate_colorbox, d)
            .append("div")
            .attr("class", "item");
            
          d3.select(this).select("div")
            .append("div")
            .text(function(d) { return d.name; })
            .attr("class", "description");
          
          d3.select(this).select("div")
            .append("div")
            .attr("class", "image")
            .call(add_images, d);
            $(this).find(".image[data-slider]").cycle();
        });

      choice_groups_data.exit().remove();
    }

    function add_images(selection, d) {
      var photo_count = d.photo_count === false ? 1 : d.photo_count;

      if(photo_count > 1) {
        selection = selection
          .attr("data-photo-count", photo_count)
          .attr("data-slider", "true");
      }
      
      _.each(_.range(1, photo_count + 1), function(element, index, list) {
        selection
          .append("img")
          .attr("src", "images/items/" + d.sid + "_" + index + ".jpg");
      });
    }

    function glossary_lookup(match, text, key, offset) {
      var definition = _.find(glossary, function(item) {
        if(item.key === key) return true;
      });
      
      if(definition) {
        return "<abbr title='" + definition.value + "'>" + text + "</abbr>";
        //return "<span class='glossary' title='" + definition.value + "' data-ot='" + definition.value + "'>" + text + "</span>";
      } else {
        if(DEBUG_MODE) {
          console.log("error in lookup: sid = " + global_sid + ", key = " + key);
          return "<abbr title='Definizione non disponibile'>" + text + "</abbr>";
        } else {
          return text;
        }
      }
    }

    function description_with_glossary_lookup(description) {
      return description.replace(/\{{([^\{]*?)\|([^\{]*)\}\}/g, glossary_lookup);
    }

    function activate_colorbox(selection, d) {
      if(d.end) {
        var card_data = _.find(cards, function(item) { if(item.sid === d.sid) return true; });
        
        var description = markdown.toHTML(card_data.card.description);

        description = description_with_glossary_lookup(description);
        
        var card = '<h1>' + card_data.card.species + '</h1>';
        card += '<h2>Famiglia: ' + card_data.card.family + '</h2>';
        card += '<h2>NOME COMUNE: ' + card_data.card.name + '</h2>';
        card += '<div>' + description + '</div>';
        
        $(".colorbox" + d.sid).bind('cbox_complete', function(){ $("span.glossary").tooltip({ trigger: 'click hover focus' }); });
        $(".colorbox" + d.sid).colorbox({ html: card, className: 'item-card', width: "90%", height: "70%", opacity: "0.6" });
        
      }
    }

    // core viz function for the teacher's handbook view
    function draw_handbook(data) {

      var items_data = handbook_vis.selectAll("ul.handbook li")
          .data(data);
          
      var items = items_data
        .enter()
          .append("li")
          .attr("class", "item")
          .append("dl");
                
      items
        .enter().each(function(d) {
          
          var item = d3.select(this);
          
          item
            .append("dt").text("sid");
          item
            .append("dd").text(d.sid);

          item
            .append("dt").text("nome");
          item
            .append("dd").text(d.specie);
          
          item
            .append("dt").text("famiglia");
          item
            .append("dd").text(d.family);

          item
            .append("dt").text("nome comune");
          item
            .append("dd").text(d.name);

          item
            .append("dt").text("immagini");
          item
            .append("dd")
            .call(add_images, d);
        });

      items_data.exit().remove();
    }

    // core viz function for the tree view (currently unused)
    function update_tree(source) {

      // Compute the new tree layout.
      var nodes = tree.nodes(tree_root).reverse();
     console.log(nodes)
      // Update the nodes…
        var node = tree_vis.selectAll("g.node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });

      var nodeEnter = node.enter().append("svg:g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });
          //.style("opacity", 1e-6);
     
      // Enter any new nodes at the parent's previous position.
     
        nodeEnter.append("svg:circle")
          //.attr("class", "node")
          //.attr("cx", function(d) { return source.x0; })
          //.attr("cy", function(d) { return source.y0; })
          .attr("r", 4.5)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
          .on("click", tree_click);
      
      nodeEnter.append("svg:text")
            .attr("x", function(d) { return d._children ? -8 : 8; })
        .attr("y", 3)
            //.attr("fill","#ccc")
            //.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .text(function(d) { return d.name; });

      // Transition nodes to their new position.
      nodeEnter.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1)
          .select("circle")
          //.attr("cx", function(d) { return d.x; })
        //.attr("cy", function(d) { return d.y; })
            .style("fill", "lightsteelblue");
          
        node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
          .style("opacity", 1);
        

      node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
          .style("opacity", 1e-6)
          .remove();
    /*
      var nodeTransition = node.transition()
        .duration(duration);
      
      nodeTransition.select("circle")
          .attr("cx", function(d) { return d.y; })
          .attr("cy", function(d) { return d.x; })
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
      
      nodeTransition.select("text")
          .attr("dx", function(d) { return d._children ? -8 : 8; })
        .attr("dy", 3)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#5babfc"; });

      // Transition exiting nodes to the parent's new position.
      var nodeExit = node.exit();
      
      nodeExit.select("circle").transition()
          .duration(duration)
          .attr("cx", function(d) { return source.y; })
          .attr("cy", function(d) { return source.x; })
          .remove();
      
      nodeExit.select("text").transition()
          .duration(duration)
          .remove();
    */
      // Update the links…
      var link = tree_vis.selectAll("path.link")
          .data(tree.links(nodes), function(d) { return d.target.id; });

      // Enter any new links at the parent's previous position.
      link.enter().insert("svg:path", "g")
          .attr("class", "link")
          .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
          })
        .transition()
          .duration(duration)
          .attr("d", diagonal);

      // Transition links to their new position.
      link.transition()
          .duration(duration)
          .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          })
          .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Fetch children on click
    function click(d) {
      console.log(["clicked on", d]);
      
      // only dig deeper if a choice within the last choice group is clicked
      if($(this).parent().is(':last-child') && $(this).data('end') != true) {
        exploration_list.push(get_children(d));
        update(exploration_list);
        $('#choice-' + d.sid).addClass('chosen');
        // deactivating history rewrite for the time being
        /*
        history.pushState({
          sid: d.sid
        }, '', '#' + d.sid); */
      }
    }

    // Reset choices from requested choice group
    function repeat_choice(d, i) {
      var total_slides,
          delete_range;
          
      console.log(["resetting choice", d]);
      total_slides = exploration_list.length;
      exploration_list = exploration_list.slice(0, i+1);
      delete_range = _.range(i+1, total_slides);
      _.each(delete_range, function(item) { flexslider.removeSlide(item); });
      flexslider.flexslider(i);
      update(exploration_list);
      $('.choice-group:last-of-type .chosen').removeClass('chosen');
    }

    // Toggle children on click.
    function tree_click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update_tree(d);
    }

    // d3.select(self.frameElement).style("height", "2000px");

    // HTML5 Fullscreen API
    //
    function toggleFullScreen() {
      if (!document.fullscreenElement &&    // alternative standard method
          !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
          document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
      } else {
        if (document.cancelFullScreen) {
          document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        }
      }
    }

    $(".navbar li#goFullScreen *").click(function() {
      toggleFullScreen();
    });

    $(".navbar li#restart a").click(function() {
      repeat_choice(null, 0);
    });

  }();

  return 'Hello from Yeoman!';
});
