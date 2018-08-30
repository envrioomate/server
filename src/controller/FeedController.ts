import {Request, Response, Router} from "express";
import * as TypeGraphQl from "type-graphql";
import {FeedPostResolver} from "../resolver/FeedPostResolver";
import * as expressGrpahQL from "express-graphql"
import {graphql, printSchema} from "graphql";
import * as graphqlHTTP from "express-graphql";
import {writeFileSync} from "fs";
import {Context} from "../resolver/types/Context";
import {authChecker} from "../resolver/AuthChecker";
import {apolloUploadExpress} from "apollo-upload-server";
import {MediaResolver} from "../resolver/MediaResolver";

let router = Router();

const schema = TypeGraphQl.buildSchemaSync({
    resolvers: [FeedPostResolver, MediaResolver],
    authChecker
});

writeFileSync("./schema.gql", " \"\"\" \n This file was autogenerated by type-graphql, do not edit! \n \"\"\"\n" + printSchema(schema));

router.use('/',
    apolloUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
    graphqlHTTP((request, response, graphQLParams) => ({
        schema: schema,
        context: {
            user: request.user
        },
        graphiql: true,
})));
export {router as FeedController} ;