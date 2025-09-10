import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

//Constants
const app = express();
const port = 3000;
const image_api_url = "https://covers.openlibrary.org/b/isbn/"
const image_api_url_end = "-L.jpg"
const image_api_url_end_medium = "-M.jpg"
let sortby = "id"

//Database Connection
const db = new pg.Client({
    user: "postgres",
    password: "R@#!l.1705",
    host: "localhost",
    port: 5432,
    database: "books"
});
try{
    db.connect();
    console.info("Connected to Database successfully.");
}catch(err){
    console.error("Error connecting to database: "+err);
}

//Middlewares

    // app.set("view engine", "ejs");
    // app.set("views", "./views")
    // ;
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(bodyParser.urlencoded({ extended: true }));


//Functions
async function getBooks() {
  const result = await(db.query("SELECT * FROM books ORDER BY $1 DESC",
    [sortby]
  ));
  const items = result.rows;
  // console.log(items);
  return items;
}

//App URLS and logic
app.get("/", (req,res)=>{
    res.render("index.ejs");
});

app.get("/reviews", async (req,res)=>{
    const data = await getBooks();
    // const books = data.rows();
    // console.log(data);
    res.render("reviews.ejs",{
        books: data,
        api_url: image_api_url,
        end_url: image_api_url_end,
        field: "Addtime"
    });
});

app.get("/sort", async (req, res) => {
  const field = req.query.field || "id"; // default sort
  const allowedFields = ["id", "rating", "date_read"]; // whitelist columns
  const sortField = allowedFields.includes(field) ? field : "id"; // safe fallback

  console.log("Sorting by:", sortField);

  const result = await db.query(`SELECT * FROM books ORDER BY ${sortField} DESC`);

  res.render("reviews.ejs", { 
    books: result.rows, 
    api_url: image_api_url, 
    end_url: image_api_url_end,
    field: sortField
  });
});


app.get("/add", (req,res)=>{
    res.render("new.ejs");
});

app.get("/about", (req,res)=>{
    res.render("about.ejs");
});

app.get("/edit/:id", async(req,res)=>{
    const id = req.params.id;
    const result = await(db.query("SELECT * FROM books WHERE id=($1)",
        [id]
    ));
    const post = result.rows;
    res.render("edit.ejs",{
        post: post,
    });
});

app.get("/reviews/:id", async (req, res)=>{
    const id = req.params.id;
    const result = await(db.query("SELECT * FROM books WHERE id=($1)",
        [id]
    ));
    const post = result.rows;
    res.render("post.ejs",{
        post: post,
        api_url: image_api_url,
        end_url: image_api_url_end
    });
});

//Post routes
app.post("/new", (req,res)=>{
    const result = req.body;
    db.query("INSERT INTO books (title, date_read, summary, rating, isbn) VALUES ($1, $2, $3, $4, $5)",
        [req.body.title, req.body.dateread, req.body.summary, req.body.rating, req.body.isbn]
    );
    // console.log(result);
    res.redirect("/reviews");
});

app.post("/edit", async (req,res)=>{
    const data = req.body;
    console.log(data);
    await db.query("UPDATE books SET title=$1, isbn=$2, rating=$3, summary=$4, date_read=$5 WHERE id=$6",
        [data.title, data.isbn, data.rating, data.summary, data.dateread, data.id]
    );
    const books = await getBooks();
    res.render("reviews.ejs",{
        books: books,
        api_url: image_api_url,
        end_url: image_api_url_end,
        alertmessage: "Edited the book successfully"
    });
});

app.get("/delete/:id", async (req,res)=>{
    const id = req.params.id;
    await db.query("DELETE FROM books WHERE id=$1",
        [id]
    );
    const books = await getBooks();
    res.render("reviews.ejs",{
        books: books,
        api_url: image_api_url,
        end_url: image_api_url_end,
        alertmessage: "Book Deleted successfully"
    });
});

app.get("/404", (req,res)=>{
    res.render("notfound.ejs");
})

app.get(/(.*)/, (req,res)=>{
    res.redirect("/404");
})

//Run app
app.listen(port, ()=>{
    console.log("App is running on port, "+port);
})