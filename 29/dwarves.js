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
    var dx = key === "right" ? 1 : key === "left" ? -1 : 0;
    var dy = key === "down" ? 1 : key === "up" ? -1 : 0;
    world.dwarves.sort(function (a, b) {
      return (b.x - a.x) * dx || (b.y - a.y) * dy;
    }).forEach(function (dwarf) {
      var x = dwarf.x + dx;
      var y = dwarf.y + dy;
      if (x >= 0 && x < world.w && y >= world.sky_h - 1 && y < world.h) {
        if (!world.terrain[y][x][1]) {
          world.terrain[dwarf.y][dwarf.x][1] = "";
          world.terrain[y][x][0] = "";
          world.terrain[y][x][1] = "dwarf";
          if (y >= world.sky_h) {
            world.terrain[y][x][2].setAttribute("fill", "#444");
          }
          dwarf.x = x;
          dwarf.y = y;
          dwarf.elem.setAttribute("cx", (dwarf.x + 0.5) * world.sz);
          dwarf.elem.setAttribute("cy", (dwarf.y + 0.5) * world.sz);
        }
      }
    });
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

    world.tiles = svg.appendChild($g());
    world.terrain = [];
    for (var y = 0; y < world.h; ++y) {
      world.terrain.push([]);
      var ratio = (y - world.sky_h) / (world.h - world.sky_h);
      for (var x = 0; x < world.w; ++x) {
        world.terrain[y].push(y < world.sky_h ? ["", ""] : ["dirt", ""]);
        var color = y < world.sky_h ? palette.blue :
          ratio < 0.25 ? palette.yellow :
          ratio < 0.5 ? palette.orange :
          ratio < 0.75 ? palette.red : palette.brown;
        world.terrain[y][x][2] = world.tiles.appendChild($rect({
          x: x * world.sz, y: y * world.sz, width: world.sz, height: world.sz,
          fill: color }));
      }
    }

    var xs = Urn.create();
    for (var i = 0; i < world.w; ++i) {
      xs.add(i);
    }
    world.dwarves = [];
    var y_dwarves = world.sky_h - 1;
    for (var i = 0; i < 7; ++i) {
      var dwarf = { x: xs.pick(),
        y: random_int(Math.floor(world.h * 0.25), Math.floor(world.h * 0.75)),
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
