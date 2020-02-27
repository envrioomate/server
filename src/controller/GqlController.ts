import {Request, Response, Router} from "express";
import * as TypeGraphQl from "type-graphql";
import {FeedPostResolver} from "../resolver/FeedPostResolver";
import * as expressGrpahQL from "express-graphql"
import {graphql, printSchema} from "graphql";
import * as graphqlHTTP from "express-graphql";
import {writeFileSync} from "fs";
import {Context} from "../resolver/types/Context";
import {authChecker} from "../resolver/AuthChecker";
import {graphqlUploadExpress} from "graphql-upload";
import {MediaResolver} from "../resolver/MediaResolver";
import {UserResolver} from "../resolver/UserResolver";
import {SeasonResolver} from "../resolver/SeasonResolver";
import {AdminActionResolver} from "../resolver/AdminActionResolver";
import {GameStateResolver} from "../resolver/GameStateResolver";
import {TeamResolver} from "../resolver/TeamResolver";
import {LeaderBoardResolver} from "../resolver/LeaderBoardResolver";
import {PushNotificationResolver} from "../resolver/PushNotificationResolver";

let router = Router();

try {
    const schema = TypeGraphQl.buildSchemaSync({
        resolvers: [
            AdminActionResolver,
            FeedPostResolver,
            GameStateResolver,
            LeaderBoardResolver,
            MediaResolver,
            PushNotificationResolver,
            SeasonResolver,
            TeamResolver,
            UserResolver
        ],
        emitSchemaFile: {
            commentDescriptions: true,
            path: "./schema.gql"
        },
        authChecker
    });

    router.use('/',
        graphqlUploadExpress({maxFileSize: 10000000, maxFiles: 10}),
        graphqlHTTP((request: Request, response: Response, graphQLParams) => ({
            schema: schema,
            context: {
                user: request.user
            },
            graphiql: true,
        })));
} catch (e) {
    console.error(e);
    process.exit(-1);
}
export {router as FeedController} ;