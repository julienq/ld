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

var incr = 1;
var star_size = 25 / incr;
var svg = document.querySelector("svg svg");
var g_stars = document.getElementById("stars");
var vb = svg.viewBox.baseVal;

var stars = [];
for (var i = 0; i < 100; ++i) {
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

var hole = document.getElementById("hole");
flexo.make_property(hole, "_r", function (r) {
  if (r > 0) {
    hole.setAttribute("r", r);
  }
  g_stars.setAttribute("transform", "rotate(%0)".fmt(r));
  return r;
}, 0);

var score = 0;

function add_points(n) {
  score += n;
  var s = document.getElementById("score");
  s.setAttribute("font-size", score);
  s.textContent = score.toString();
}

var r = 0;
var last = Date.now();

var tick = function() {
  var now = Date.now();
  var dt = now - last;
  last = now;
  if (r < 0) {
    hole._r -= incr;
    r += incr;
  } else if (r > 0) {
    hole._r += incr;
    r -= incr;
  }
  flexo.request_animation_frame(tick);
}

tick();

document.addEventListener("mousemove", function (e) {
  var p = rotate(flexo.event_svg_point(e, svg), -hole._r);
  var n = 0;
  var plus = stars.filter(function (star) {
    return distance_squared(star._p, p) < star._r * star._r;
  });
  plus.forEach(function (star) {
    flexo.safe_remove(star)
    flexo.remove_from_array(stars, star);
    n += star_size - star._r;
  });
  add_points(n);
  r += incr;
  var rr = hole._r * hole._r;
  var unscore = stars.filter(function (star) {
    return distance_squared(star._p, { x: 0, y : 0 }) < rr;
  });
  unscore.forEach(function (star) {
    flexo.safe_remove(star)
    flexo.remove_from_array(stars, star);
  });
}, false);
