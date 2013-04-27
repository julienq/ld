"use strict";

var ARGS = flexo.get_args({ margin: 0, size: 100, player: 0x2779e, dur: 90 });

var Scheduler = {};

function scheduler() {
  var s = Object.create(Scheduler);
  s.t = Date.now();
  s.queue = [];
  s.on = [];
  s.__tick = s.tick.bind(s);
  s.__tick();
  return s;
}

Scheduler.event = function (event) {
  this.queue.push(event);
};

Scheduler.ramp = function (ramp) {
  this.queue.push(function () {
    this.on.push({ begin: this.t, ramp: ramp });
  }.bind(this));
};

Scheduler.tick = function () {
  var dt = Date.now() - this.t;
  this.t += dt;
  if (this.on.length === 0 && this.queue.length > 0) {
    this.queue.shift()();
  }
  this.on.forEach(function (on) {
    var p = (this.t - on.begin) / on.ramp.dur;
    if (p >= 0 && p < 1) {
      on.ramp.f(p);
    }
    if (p >= 1) {
      on.ramp.f(1);
      flexo.remove_from_array(this.on, on);
    }
  }, this);
  flexo.request_animation_frame(this.__tick);
};


var SHAPES = ["block", "spikes", "ladder"];

var ROOT = document.querySelector("svg svg");
var FG = document.getElementById("fg");
var SPRITES = document.getElementById("sprites");

function make_player(x, y) {
  var color = flexo.num_to_hex(ARGS.player);
  return flexo.$use({ "xlink:href": "#player", x: x * ARGS.size,
    y: y * ARGS.size, fill: color, stroke: color });
}

function make_star(x, y) {
  x = ARGS.size * (x + 0.5);
  y = ARGS.size * (y + 0.5);
  return flexo.$star({ branches: 5, fill: "white", "fill-opacity": 0.8,
    r: ARGS.size / 2.5, x: x, y: y },
    flexo.$animateTransform({ attributeName: "transform", attributeType: "XML",
      type: "rotate", from: "0 %0 %1".fmt(x, y), to: "360 %0 %1".fmt(x, y),
      dur: "7s", repeatCount: "indefinite" }));
}

var SCHEDULER = scheduler();

function init_level(rows, p, s, a) {

  ROOT.setAttribute("viewBox", "%0 %0 %1 %1"
      .fmt(-ARGS.margin, rows.length * ARGS.size + 2 * ARGS.margin));

  var args = Array.prototype.slice.call(arguments, 0, 3).map(function (a) {
    return a.slice();
  });
  for (var i = 0; i < a; ++i) {
    var rows_ = [];
    for (var y = 0; y < rows.length; ++y) {
      rows_[y] = "";
      for (var x = 0; x < rows.length; ++x) {
        var c = rows[x][rows.length - y - 1];
        var j = parseInt(c, 16);
        if (isNaN(j)) {
          rows_[y] += c;
        } else {
          j = (j & 12) | (((j & 3) + 3) % 4)
          rows_[y] += j.toString(16);
        }
      }
    }
    rows = rows_;
    s = [s[1], rows.length - s[0] - 1];
  }

  flexo.remove_children(FG);
  flexo.remove_children(SPRITES);
  rows.forEach(function (row, y) {
    Array.prototype.forEach.call(row, function (c, x) {
      var i = parseInt(c, 16);
      if (isNaN(i)) {
        return;
      }
      var x_ = x * ARGS.size;
      var y_ = y * ARGS.size;
      var transform = (i % 4 > 0) && "rotate(%0, %1, %2)"
        .fmt((i % 4) * 90, x_ + ARGS.size / 2, y_ + ARGS.size / 2);
      FG.appendChild(flexo.$use({ "xlink:href": "#" + SHAPES[i >> 2],
        transform: transform, x: x_, y: y_ }));
    });
  });

  var is_obstacle = function (x, y) {
    var i = parseInt(rows[y][x], 16);
    return !isNaN(i) &&  // not an empty space
      ((i >> 2) <= 1 ||  // block or spikes
      (i & 1) === 1);    // ladder turned
  };

  var is_ladder = function (x, y) {
    var i = parseInt(rows[y][x], 16);
    return !isNaN(i) &&  // not an empty space
      (i >> 2) === 2 &&  // a ladder
      (i & 1) === 0;     // going up or down
  };

  var is_grounded = function (x, y) {
    if (++y === rows.length) {
      return true;
    }
    var i = parseInt(rows[y][x], 16);
    return !isNaN(i) &&
      ((i >> 2) !== 1 ||
       i === 6);
  };

  SPRITES.appendChild(make_star.apply(this, s));

  ROOT._player = SPRITES.appendChild(make_player.apply(this, p));

  var x = p[0];
  var y = p[1];

  function transition(elem, attr, from, to, dur) {
    SCHEDULER.ramp({
      dur: dur,
      f: function (p) {
        elem.setAttribute(attr, (from + (to - from) * p));
      }
    });
  };

  Object.defineProperty(ROOT._player, "_x", {
    enumerable: true,
    get: function () {
      return x;
    },
    set: function (x_) {
      if (x_ < 0 || x_ >= rows.length || is_obstacle(x_, this._y)) {
        return;
      }
      transition(ROOT._player, "x", x * ARGS.size, x_ * ARGS.size, ARGS.dur);
      x = x_;
      if (!is_ladder(x, y)) {
        fall();
      }
      win();
    }
  });

  var win = function () {
    if (!ROOT._player._dead && !ROOT._player._won && x === s[0] && y === s[1]) {
      ROOT._player._won = true;
      SCHEDULER.event(function () {
        alert("YES!");
        window.location.hash = ((LEVEL + 1) % LEVELS.length).toString();
        window.location.reload(true);
      });
    }
  };

  var fall = function () {
    var y0 = y;
    while (!is_grounded(x, y) && !ROOT._player._dead) {
      if (++y < rows.length) {
        if (rows[y][x] === "4" || rows[y][x] === "5" || rows[y][x] === "7") {
          ROOT._player._dead = true;
        }
      }
    }
    transition(ROOT._player, "y", y0 * ARGS.size, y * ARGS.size,
        ARGS.dur * (y - y0));
    if (rows[y][x] === "4" || rows[y][x] === "5" || rows[y][x] === "7") {
      ROOT._player._dead = true;
    }
    if (ROOT._player._dead) {
      SCHEDULER.event(function () {
        alert("OH NOES!");
        init_level.apply(this, LEVELS[LEVEL]);
      });
    } else {
      win();
    }
  };
  Object.defineProperty(ROOT._player, "_y", {
    enumerable: true,
    get: function () {
      return y;
    },
    set: function (y_) {
      if (y_ < 0 || y_ >= rows.length) {
        return;
      }
      if (y_ < y) {
        if (!is_ladder(x, y)) {
          return;
        }
      } else {
        if (!is_ladder(x, y_)) {
          fall();
          return;
        }
      }
      transition(ROOT._player, "y", y * ARGS.size, y_ * ARGS.size, ARGS.dur);
      y = y_;
      win();
    }
  });

  ROOT._rotate = function (da) {
    args[1] = da > 0 ? [y, rows.length - x - 1] : [rows.length - y - 1, x];
    args.push(((a || 0) + da + 4) % 4);
    init_level.apply(this, args);
  }

  fall();
}


var LEVELS = [
  [[
    "66666666",
    "        ",
    "        ",
    "        ",
    "8888    ",
    "   8   4",
    "4  8  70",
    "05 8  70",
  ], [4, 7], [3, 3]],
  [[
    "66666666",
    "        ",
    "        ",
    "        ",
    "8888    ",
    "   8   4",
    "4  8  70",
    "05 8  70",
  ], [4, 7], [0, 3]],
  [[
    "66666666",
    "        ",
    "        ",
    "        ",
    "   8    ",
    "   8   4",
    "4  8  70",
    "05 8  70",
  ], [4, 7], [0, 3]],
];

var LEVEL = flexo.clamp(parseInt(window.location.hash.substr(1), 10),
      0, LEVELS.length - 1);

init_level.apply(this, LEVELS[LEVEL]);

document.addEventListener("keydown", function (e) {
  if (e.keyCode === 37) {        // left
    --ROOT._player._x;
  } else if (e.keyCode === 38) { // up
    --ROOT._player._y;
  } else if (e.keyCode === 39) { // right
    ++ROOT._player._x;
  } else if (e.keyCode === 40) { // down
    ++ROOT._player._y;
  } else if (e.keyCode === 88) { // X
    SCHEDULER.event(function () {
      ROOT._rotate(-1);
    });
  } else if (e.keyCode === 89 || e.keyCode === 90) { // Y, Z
    SCHEDULER.event(function () {
      ROOT._rotate(1);
    });
  }
}, false);
