import {
    Arg,
    Authorized,
    Ctx,
    Field,
    InputType,
    Int,
    Mutation,
    ObjectType,
    Query,
    registerEnumType,
    Resolver
} from "type-graphql";
import {InjectRepository} from "typeorm-typedi-extensions";
import {User} from "../entity/user/User";
import {getCustomRepository, Not, Repository} from "typeorm";
import {Media} from "../entity/Media";
import {Membership} from "../entity/social/Membership";
import {Team, TeamSize} from "../entity/social/Team";
import {ConnectionArgs} from "./types/ConnectionPaging";
import {Context} from "./types/Context";
import {LeaderBoardRepository} from "../util/PaginatingRepository";
import {connectionTypes} from "../util/ConnectionTypes";
import {Container} from "typedi";
import {LeaderBoardManager} from "../gameLogic/LeaderBoardManager";



@ObjectType()
export class LeaderBoardEntry {
    @Field(type => Int)
    place: number

    @Field(type => Team)
    team: Team;
}

@Resolver()
export class LeaderBoardResolver {
    constructor(
        @InjectRepository(Media) private readonly mediaRepository: Repository<Media>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(Team) private readonly teamRepository: Repository<Team>,
        @InjectRepository(Membership) private readonly memberRepository: Repository<Membership>
    ) {
    }

    @Query(returns => connectionTypes<Team>('LeaderBoardEntry', Team), {nullable: true})
    async getLeaderBoard (
        @Ctx() {user}: Context,
        @Arg('connectionArgs', type => ConnectionArgs) connectionArgs: ConnectionArgs,
        @Arg('teamSize', type => TeamSize, {nullable: true}) searchConditions?: TeamSize,
    ) {
        const paginatingRepo = getCustomRepository(LeaderBoardRepository);
        return paginatingRepo.findAndPaginate({place: Not(-1)}, {place: "ASC", score: "DESC"}, connectionArgs);
    }

    @Authorized("ADMIN")
    @Mutation(returns => [Team])
    async resetLeaderBoard() {
        return Container.get(LeaderBoardManager).recalculateLeaderBoardPositions()
    }

}


