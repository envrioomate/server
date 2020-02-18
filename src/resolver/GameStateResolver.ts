import {Arg, Ctx, Int, Mutation, Query, Resolver} from "type-graphql";
import {Season} from "../entity/game-state/Season";
import {SeasonPlan} from "../entity/game-state/SeasonPlan";
import {GameProgressionManager} from "../gameLogic/GameProgressionManager";
import {Container} from "typedi";
import {ChallengeCompletion} from "../entity/game-state/ChallengeCompletion";
import {ChallengeRejection} from "../entity/game-state/ChallengeRejection";
import {IUserChallenge} from "../entity/game-state/IUserChallenge";
import {AchievementSelection} from "../entity/game-state/AchievementSelection";
import {AchievementCompletion} from "../entity/game-state/AchievementCompletion";
import {User} from "../entity/user/User";

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

    @Query(returns => [ChallengeCompletion], {nullable: true})
    public async getCompletedChallenges(@Ctx() {user}): Promise<ChallengeCompletion[]> {
        return this.mgmr.getCompletedChallengesForUser(user);
    }

    @Query(returns => [AchievementSelection], {nullable: true})
    async currentlySelectedAchievements(@Ctx() {user}): Promise<AchievementSelection[]> {
        return this.mgmr.getCurrentlySelectedAchievementsForUser(user);
    }

    @Mutation(returns => AchievementSelection, {nullable: true})
    async selectAchievement(@Ctx() {user}, @Arg("achievementName", type => String) achievementName: string): Promise<AchievementSelection>{
        return this.mgmr.selectAchievement(user, achievementName);

    }
    @Mutation(returns => AchievementCompletion, {nullable: true})
    async completeAchievement(@Ctx() {user}, @Arg("achievementSelectionId", type => Int) achievementSelectionId: number): Promise<AchievementSelection>{
        return this.mgmr.completeAchievement(user, achievementSelectionId);
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