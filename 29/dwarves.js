(function () {
  "use strict";

  function handle_keys(keys) {
    document.addEventListener("keydown", function (e) {
      var key = describe_key(e);
      if (key in keys) {
        e.preventDefault();
      }
    });
    document.addEventListener("keyup", function (e) {
      var key = describe_key(e);
      if (key in keys) {
        keys[key] = true;
        console.log(key);
        e.preventDefault();
      }
    });
    return keys;
  }

  function move_dwarves(world, key) {
    if (key === "right" || key === "left") {
      var dx = key === "right" ? 1 : -1;
      world.dwarves.sort(function (a, b) {
        return (b.x - a.x) * dx || (b.y - a.y);
      }).forEach(function (dwarf) {
        var x = dwarf.x + dx;
        var y = dwarf.y;
        if (x >= 0 && x < world.w) {
          if (!world.terrain[y][x][1]) {
            while (y < world.h && !world.terrain[y + 1][x][0] &&
              !world.terrain[y + 1][x][1]) {
              ++y;
            }
            world.terrain[dwarf.y][dwarf.x][1] = "";
            // world.terrain[y][x][0] = "";
            world.terrain[y][x][1] = "dwarf";
            dwarf.x = x;
            dwarf.y = y;
            dwarf.elem.setAttribute("cx", (dwarf.x + 0.5) * world.sz);
            dwarf.elem.setAttribute("cy", (dwarf.y + 0.5) * world.sz);
          }
        }
      });
    } else if (key === "down") {
      var dy = 1;
      world.dwarves.sort(function (a, b) {
        return (b.y - a.y) * dy || (a.x - b.x);
      }).forEach(function (dwarf) {
        var x = dwarf.x;
        var y = dwarf.y + dy;
        if (y > world.sky_h && y < world.h) {
          if (!world.terrain[y][x][1]) {
            while (y < world.h && !world.terrain[y + 1][x][0] &&
              !world.terrain[y + 1][x][1]) {
              ++y;
            }
            world.terrain[dwarf.y][dwarf.x][1] = "";
            // world.terrain[y][x][0] = "";
            world.terrain[y][x][1] = "dwarf";
            dwarf.x = x;
            dwarf.y = y;
            dwarf.elem.setAttribute("cx", (dwarf.x + 0.5) * world.sz);
            dwarf.elem.setAttribute("cy", (dwarf.y + 0.5) * world.sz);
          }

        }
      });
    }
  }

  function update(dt, keys, world) {
    var handled = false;
    Object.keys(keys).forEach(function (key) {
      if (keys[key]) {
        keys[key] = false;
        if (!handled) {
          handled = true;
          move_dwarves(world, key);
        }
      }
    });
  }

  (function () {
    var svg = document.querySelector("svg");
    var vb = svg.viewBox.baseVal;

    var world = { sz: 100 };
    world.w = vb.width / world.sz;
    world.h = vb.height / world.sz;
    world.sky_h = 2;

    var x_hole = random_int(4, world.w - 5);

    world.terrain = [];
    for (var y = 0; y < world.h; ++y) {
      world.terrain.push([]);
      var ratio = (y - world.sky_h) / (world.h - world.sky_h);
      for (var x = 0; x < world.w; ++x) {
        world.terrain[y].push(y < world.sky_h ||
          (y === world.sky_h && x === x_hole) ? ["", ""] : ["dirt", ""]);
        var color = y < world.sky_h ? palette.blue :
          y === world.sky_h && x === x_hole ? "#444" :
          ratio < 0.25 ? palette.yellow :
          ratio < 0.5 ? palette.orange :
          ratio < 0.75 ? palette.red : palette.brown;
        svg.appendChild($rect({ x: x * world.sz, y: y * world.sz,
          width: world.sz, height: world.sz, fill: color }));
      }
    }

    world.dwarves = [];
    var y_dwarves = world.sky_h - 1;
    var x_dwarves = x_hole > 7 ? 0 : world.w - 1;
    var x_incr = x_hole > 7 ? 1 : -1;
    for (var i = 0; i < 7; ++i) {
      var dwarf = { x: x_dwarves + i * x_incr, y: y_dwarves,
        elem: $circle({ r: world.sz * 0.4, fill: palette.green }) };
      dwarf.elem.setAttribute("cx", (dwarf.x + 0.5) * world.sz);
      dwarf.elem.setAttribute("cy", (dwarf.y + 0.5) * world.sz);
      svg.appendChild(dwarf.elem);
      world.dwarves.push(dwarf);
      world.terrain[dwarf.y][dwarf.x][1] = "dwarf";
    }

    var keys = handle_keys({ up: false, down: false, left: false,
      right: false });
    var t = Date.now();
    var loop = function (t_) {
      var dt = t_ - t;
      t = t_;
      update(dt, keys, world);
      requestAnimationFrame(loop);
    };
    loop();
  }())

}());
