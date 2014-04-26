(function () {
  "use strict";

  $.Item = mixin({

    init: function (name) {
      Listenable.init.call(this);
      Hierarchical.init.call(this);
      this.name = name;
      this.tags = {};
    },

    item: function (item) {
      this.append_child(item);
      return this;
    },

    tag: function (tag) {
      this.tags[tag] = true;
      return this;
    },

    untag: function (tag) {
      delete this.tags[tag];
      return this;
    },

    did_append_child: function (child) {
      this.notify("item", { item: child });
    },

    did_remove_child: function (child) {
      this.notify("unitem", { item: child });
    },

    toString: function () {
      var tags = Object.keys(this.tags).sort().join("+");
      return this.name + (tags ? "+" + tags : "");
    }

  }, Creatable, Listenable, Hierarchical);


  $.Machine = mixin({
    init: function () {
      Listenable.init.call(this);
      this.rules = [];
      this.items = {};
    },

    item: function (item) {
      if (!this.items[item.name]) {
        this.items[item.name] = [];
      }
      this.items[item.name].push(item);
      return this;
    },

    rule: function () {
      push(this.rules, slice(arguments));
    },

    match: function (item, target) {
      for (var i = this.rules.length - 1; i >= 0; --i) {
        console.log("match #%0 (%1, %2)".fmt(i, item, target));
        for (var j = 0, n = this.rules[i].length, m = true; m && j < n; ++j) {
          var instruction = this.rules[i][j];
          console.log("  -", instruction);
          switch(instruction[0]) {
            case "ITEM":
              m = item && item.name === instruction[1];
              break;
            case "NOTARGET":
              m = target == null;
              break;
            case "STATUS":
              this.notify("status", { status: instruction[1] });
              break;
          }
        }
        if (m) {
          return;
        }
      }
    },
  }, Creatable, Listenable);

  Object.defineProperty($.Machine, "location", {
    enumerable: true,
    get: function () {
      return this._location;
    },
    set: function (item) {
      this._location = item;
      this.match(item);
      this.notify("location");
    }
  });

  var ui = {

    status: document.getElementById("status"),
    items: document.getElementById("items"),

    handleEvent: function (e) {
      if (e.type === "location") {
        remove_children(this.items);
        e.source.location.__children.forEach(function (item) {
          var img = $img({ alt: item.toString(),
            src: "img/%0.png".fmt(item.toString()) });
          this.items.appendChild(img);
        }, this);
      } else if (e.type === "status") {
        this.status.textContent = e.status;
      }
    }
  }

  var machine = $.Machine.create();
  machine.listen("location", ui);
  machine.listen("status", ui);

  // Hand compiled rules
  machine.item($.Item.create("Ocean Floor").item($.Item
        .create("diver").tag("PC").tag("Shoes").tag("Helmet")));
  machine.rule(["ITEM", "Ocean Floor"], ["NOTARGET"],
      ["STATUS", "On the ocean floor."]);
  machine.location = machine.items["Ocean Floor"][0];

}(window.$ = {}));
