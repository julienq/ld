"use strict";

// Squared distance between two points
function distance_squared(u, v) {
  var dx = u.x - v.x;
  var dy = u.y - v.y;
  return (dx * dx) + (dy * dy);
}

// Rotate a point by r degrees
function rotate(p, r) {
  var th = r / 180 * π;
  var cos = Math.cos(th);
  var sin = Math.sin(th);
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
}

var level;
var incr;
var score;
var star_size;
var svg = document.querySelector("svg svg");
var g_stars = document.getElementById("stars");
var text = document.getElementById("score");
var vb = svg.viewBox.baseVal;
var stars;
var R = 0;

var hole = document.getElementById("hole");
flexo.make_property(hole, "_r", function (r) {
  if (r > 0) {
    hole.setAttribute("r", r);
  }
  g_stars.setAttribute("transform", "rotate(%0)".fmt(r));
  return r;
}, 0);

function add_points(n) {
  score = Math.round(score + n);
  text.setAttribute("font-size", hole._r / 5);
  text.textContent = score.toString();
}

var p;

(function tick() {
  if (stars) {
    var rr = hole._r * hole._r;
    var unscore = stars.filter(function (star) {
      return distance_squared(star._p, center) < rr;
    });
    unscore.forEach(function (star) {
      flexo.safe_remove(star)
      flexo.remove_from_array(stars, star);
      R += incr;
    });
    if (p && distance_squared(p, center) < rr) {
      game_over();
    } else if (stars && stars.length === 0) {
      stars = undefined;
      next_level();
    }
  }
  if (R < 0) {
    hole._r -= incr;
    R += incr;
  } else if (R > 0) {
    hole._r += incr;
    R -= incr;
  }
  flexo.request_animation_frame(tick);
}());

var center = { x: 0, y: 0 };

function game_over() {
  document.removeEventListener("mousemove", move, false);
  document.getElementById("score").textContent = "GAME OVER: %0".fmt(score);
  document.addEventListener("click", restart, false);
}

function next_level() {
  document.removeEventListener("mousemove", move, false);
  text.textContent = "LEVEL %0".fmt(level + 1);
  var cont = function () {
    init_level(level + 1, score);
    document.removeEventListener("click", cont, false);
  }
  document.addEventListener("click", cont, false);
}

function restart() {
  incr = 1;
  score = 0;
  init_level(1, 0);
  document.removeEventListener("click", restart, false);
};

function move(e) {
  p = rotate(flexo.event_svg_point(e, svg), -hole._r);
  var n = 0;
  var plus = stars.filter(function (star) {
    return distance_squared(star._p, p) < 2 * star._r * star._r;
  });
  plus.forEach(function (star) {
    flexo.safe_remove(star)
    flexo.remove_from_array(stars, star);
    n += star_size - star._r;
    R -= incr;
  });
  R += incr;
  add_points(n);
}

function init_level(level_, score_) {
  stars = [];
  level = level_;
  incr = 1 + (level - 1) / 10;
  score = score_;
  star_size = 25 / incr;
  flexo.remove_children(g_stars);
  R = 0;
  hole._r = 0;
  hole.setAttribute("r", 0);
  g_stars.removeAttribute("transform");
  add_points(0);

  for (var i = 0; i < 100 * incr; ++i) {
    var th = Math.random() * 2 * π;
    var d = flexo.random_int(vb.width / 2);
    var x = d * Math.cos(th);
    var y = d * Math.sin(th);
    var r = flexo.random_int(5, star_size);
    var star = g_stars.appendChild(flexo.$star({ branches: 5, fill: "yellow",
      r: r, x: x, y: y, phase: flexo.random_int(360) }));
    star._r = r;
    star._p = { x: x, y: y };
    stars.push(star);
  }

  document.addEventListener("mousemove", move, false);
}

document.addEventListener("click", restart, false);

