const express = require("express");
require("dotenv").config();
const app = express();
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Recipe = require("./models/Recipe");
const bodyParser = require("body-parser");

var { graphqlExpress, graphiqlExpress } = require("apollo-server-express");
var { makeExecutableSchema } = require("graphql-tools");

const { ApolloServer, gql } = require("apollo-server-express");

const filePath = path.join(__dirname, "typeDefs.gql");
const typeDefs = fs.readFileSync(filePath, "utf-8");
const { resolvers } = require("./resolvers");

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true })
  .then(() => {
    console.log("DB connected");
  })
  .catch(err => {
    console.log(err);
  });

app.use(async (req, res, next) => {
  const token = req.headers["authorization"];
  if (token) {
    try {
      const currentUser = await jwt.verify(token, process.env.SECRET);
      req.currentUser = currentUser;
    } catch (error) {
      console.log(error);
    }
  }
  next();
});

const PORT = process.env.PORT || 4000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const currentUser = req.currentUser;
    return { Recipe, User, currentUser };
  }
});
server.applyMiddleware({ app });

const appPath = path.join(__dirname, "build");
app.use(express.static(appPath));

app.get("*", function(req, res) {
  res.sendFile(path.resolve(appPath, "index.html"));
});

app.listen(PORT, () =>
  console.log(
    `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
  )
);
