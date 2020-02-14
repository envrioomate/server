import {Arg, Ctx, Int, Mutation, Query, Resolver} from "type-graphql";
import {Season} from "../entity/game-state/Season";
import {SeasonPlan} from "../entity/game-state/SeasonPlan";
import {GameProgressionManager} from "../gameLogic/GameProgressionManager";
import {Container} from "typedi";
import {ChallengeCompletion} from "../entity/game-state/ChallengeCompletion";
import {ChallengeRejection} from "../entity/game-state/ChallengeRejection";
import {IUserChallenge} from "../entity/game-state/IUserChallenge";

@Resolver()
export class GameStateResolver {

    private mgmr: GameProgressionManager = Container.get(GameProgressionManager);

    //TODO Add dedicated seasonProgress, history etc queries

    @Query(returns => Season, {nullable: true})
    async currentSeason(@Ctx() {user}): Promise<Season> {
        return this.mgmr.getCurrentSeason();
    }

    @Query(returns => SeasonPlan, {nullable: true})
    async globalCurrentChallenges(@Ctx() {user}): Promise<SeasonPlan> {
        return this.mgmr.getCurrentSeasonPlan();
    }

    @Query(returns => [IUserChallenge], {nullable: true})
    async currentChallenges(@Ctx() {user}): Promise<IUserChallenge[]> {
        return this.mgmr.getCurrentChallengesForUser(user);
    }

    @Mutation(returns => ChallengeCompletion, {nullable: true})
    async completeChallenge(@Ctx() {user}, @Arg("challengeId", type => Int) challengeId: number, @Arg("challengeGoalCompletionLevel", type => Int, {nullable: true}) challengeGoalCompletionLevel?: number, @Arg("challengeCompletionQuantity", type => Number, {nullable: true}) challengeCompletionQuantity?: number): Promise<ChallengeCompletion> {
        return this.mgmr.completeChallenge(user, challengeId, challengeGoalCompletionLevel, challengeCompletionQuantity)
    }

    @Mutation(returns => ChallengeCompletion, {nullable: true})
    async uncompleteChallenge(@Ctx() {user}, @Arg("challengeCompletionId", type => Int) challengeCompletionId: number): Promise<ChallengeCompletion> {
        return this.mgmr.unCompleteChallenge(user, challengeCompletionId)
    }

}