const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.url);

const itemSchema = { name: String };

const Item = mongoose.model("Item", itemSchema);

const item1 = Item({ name: "Welcome to your todolist!" });
const item2 = Item({ name: "Hit the + button to add a new item." });
const item3 = Item({ name: "<-- Hit this to delete an item." });

const defaultitems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  const fetch = async function () {
    const items = await Item.find({});
    if (items.length === 0) {
      Item.insertMany(defaultitems);
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  }

  fetch();

});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  const newOrLoad = async () => {
    const foundList = await List.findOne({ name: customListName }).exec();

    if (foundList === null) {
      const list = new List({
        name: customListName,
        items: defaultitems
      });
      list.save();
      res.redirect("/" + customListName);
    }
    else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  }
  newOrLoad();

});




app.post("/", function (req, res) {

  const item = req.body.newItem;
  const list = req.body.list;

  const newItem = new Item({ name: item });


  if (list === "Today") {

    newItem.save();
    res.redirect("/");
  }
  else {
    const add = async () => {

      const foundList = await List.findOne({ name: list }).exec();

      foundList.items.push(newItem);

      foundList.save();

      res.redirect("/" + list);
    };

    add();
  }
});

app.post("/delete", (req, res) => {
  const id = req.body.cb;
  const list = req.body.list;


  if (list === "Today") {
    const remove = async () => {
      await Item.findByIdAndRemove(id);
      res.redirect("/");
    };
    remove();
  }
  else {
    const removeCustom = async () => {
      const ret = await List.findOneAndUpdate({ name: list }, { $pull: { items: { _id: id } } });
      console.log(ret,list,id);
      
      res.redirect("/" + list);
    };
    removeCustom();
  }
});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT||3000, function () {
  console.log("Server started on port 3000");
});
