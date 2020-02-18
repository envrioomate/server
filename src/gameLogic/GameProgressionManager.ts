import {Container, Service} from "typedi";
import {Badge} from "../entity/wiki-content/Badge";
import {ChallengeCompletion, ChallengeGoalCompletionLevel} from "../entity/game-state/ChallengeCompletion";
import {SeasonPlanChallenge} from "../entity/game-state/SeasonPlanChallenge";
import {InjectRepository} from "typeorm-typedi-extensions";
import {EntitySubscriberInterface, EventSubscriber, InsertEvent, LessThan, MoreThan, Repository} from "typeorm";
import {User} from "../entity/user/User";
import {Season} from "../entity/game-state/Season";
import {SeasonPlan} from "../entity/game-state/SeasonPlan";
import {ChallengeRejection} from "../entity/game-state/ChallengeRejection";
import {DateUtils} from "typeorm/util/DateUtils";
import {ChallengeReplacement} from "../entity/game-state/ChallengeReplacement";
import {IUserChallenge} from "../entity/game-state/IUserChallenge";
import {RedisClient} from "redis";
import {publish, subscribe} from "../util/EventUtil";
import {error} from "util";
import {Achievement} from "../entity/wiki-content/Achievement";
import {AchievementSelection} from "../entity/game-state/AchievementSelection";
import {AchievementCompletion, AchievementCompletionType} from "../entity/game-state/AchievementCompletion";
import moment = require("moment");

const {promisify} = require('util');
@Service()
@EventSubscriber()
export class GameProgressionManager implements EntitySubscriberInterface{

    private redisClient: RedisClient = Container.get("redis");
    private getRedisAsync: Function;
    private seasonUseRedisTTL = true;
    private seasonPlanUseRedisTTL = true;

    // Subscribing to updates to Season and SeasonPlan provides a way to reinitialize the game state if new seasons are added.
    // This is useful in testing to be able to insert a new _current_ season and making it the currentSeason without restarting the server.
    // In production, this could be used to fix errors in the current season and immediately reflect these changes in the app.
    // TODO fix this it doesn't work
    afterUpdate(event: InsertEvent<any>) {
        if(event.entity instanceof Season || event.entity instanceof SeasonPlan) {
            console.log(`BEFORE ENTITY INSERTED: `, event.entity);
            this.setUpCurrentSeason();
        }
    }

    afterInsert(event: InsertEvent<any>) {
        if(event.entity instanceof Season || event.entity instanceof SeasonPlan) {
            console.log(`BEFORE ENTITY INSERTED: `, event.entity);
            this.setUpCurrentSeason();
        }
    }


    async getCurrentSeason(): Promise<Season> {

        let currentSesonId = await this.getRedisAsync("currentSeason");
        if (!currentSesonId) {
            const s = await this.findCurrentSeason();
            this.setCurrentSeason(s);
        }
        return this.seasonRepository.findOne(await this.getRedisAsync("currentSeason"));

        //return this.redisClient.get("currentSeason");
    }

    setCurrentSeason(season: Season) {
        this.redisClient.set("currentSeason", season.id.toString(), (err, result) => {
            if (err) console.error(err);
            console.log(JSON.stringify(result));
            if (this.seasonUseRedisTTL) {
                const timeLeft = Math.floor(season.timeLeft() / 1000);
                if (timeLeft > 0)
                    this.redisClient.expire("currentSeason", timeLeft);
                else console.warn(`Setting currentSeason but season.timeLeft = ${timeLeft} is < 0!`);
            }
        });
    }

    async getCurrentSeasonPlan(): Promise<SeasonPlan> {
        let currentSeasonPlanId = await this.getRedisAsync("currentSeasonPlan");
        if (!currentSeasonPlanId) {
            const sp = await this.findCurrentSeasonPlan(await this.getCurrentSeason());
            this.setCurrentSeasonPlan(sp);
        }
        return this.seasonPlanRepository.findOne(currentSeasonPlanId);
    }

    setCurrentSeasonPlan(seasonPlan: SeasonPlan) {
        this.redisClient.set("currentSeasonPlan", seasonPlan.id.toString(), async (err, result) => {
            if (err) console.error(err);
            console.log(JSON.stringify(result));
            if (this.seasonPlanUseRedisTTL) {
                const seasonPlanEndDateTime = await GameProgressionManager.getAbsoluteEndTimeOfSeasonPlan(await this.getCurrentSeason(), seasonPlan).catch(err => {
                    throw new Error(err)
                });
                console.log(seasonPlanEndDateTime);
                const timeLeft = Math.floor(seasonPlanEndDateTime - Date.now() / 1000);
                if (timeLeft > 0)
                    this.redisClient.expire("currentSeasonPlan", timeLeft);
                else console.warn(`Setting currentSeasonPlan but timeLeft = ${timeLeft} is < 0!`);
            }
        });
    };

    constructor(
        @InjectRepository(Season) private readonly seasonRepository: Repository<Season>,
        @InjectRepository(SeasonPlan) private readonly seasonPlanRepository: Repository<SeasonPlan>,
        @InjectRepository(Badge) private readonly challengeRepository: Repository<Badge>,
        @InjectRepository(SeasonPlanChallenge) private readonly seasonPlanChallengeRepository: Repository<SeasonPlanChallenge>,
        @InjectRepository(ChallengeCompletion) private readonly challengeCompletionRepository: Repository<ChallengeCompletion>,
        @InjectRepository(ChallengeRejection) private readonly challengeRejectionRepository: Repository<ChallengeRejection>,
        @InjectRepository(ChallengeReplacement) private readonly challengeReplacementRepository: Repository<ChallengeReplacement>,
        @InjectRepository(Achievement) private readonly achievementRepository: Repository<Achievement>,
        @InjectRepository(AchievementSelection) private readonly achievementSelectionRepository: Repository<AchievementSelection>,
        @InjectRepository(AchievementCompletion) private readonly achievementCompletionRepository: Repository<AchievementCompletion>,
    ) {
        console.log("Starting GameProgressionManager...");
        this.getRedisAsync = promisify(this.redisClient.get).bind(this.redisClient);
        this.setUpCurrentSeason();
    }

    @subscribe([Season, SeasonPlan])
    public static async listen(season: Season) {
        Container.get(GameProgressionManager).setUpCurrentSeason();
    }

    public async setUpCurrentSeason() {
        console.log("setting up season ... ")
        try {
            const s = await this.findCurrentSeason();
            this.setCurrentSeason(s);
            const sp = await this.findCurrentSeasonPlan(s);
            this.setCurrentSeasonPlan(sp);
        } catch (err) {
            console.error(err)
        }
    }


    static async getAbsoluteEndTimeOfSeasonPlan(season: Season, seasonPlan: SeasonPlan): Promise<number> {
        let seasonPlans = await season.seasonPlan;
        const idx = seasonPlans.findIndex(value => value.id === seasonPlan.id);
        if (idx < 0) throw new Error("Illegal argument: seasonPlan is not part of season!");

        const seasonPlansBefore = seasonPlans.slice(0, idx + 1);
        const secsInSeasonPlansBefore = seasonPlansBefore.reduce((acc, cur) => {
            return acc + cur.duration;
        }, 0);

        let startOffset = season.startOffsetDate.getTime() / 1000;
        return (startOffset + secsInSeasonPlansBefore);
    }

    private async findCurrentSeason(): Promise<Season> {
        let now = new Date(Date.now());
        let nowString = DateUtils.mixedDateToDatetimeString(now);
        let currentSeason = await this.seasonRepository.findOne({
            where: {
                startDate: LessThan(nowString),
                endDate: MoreThan(nowString)
            }
        })
            .catch(err => {
                console.error(err);
            });
        console.log(currentSeason);
        if (!currentSeason)
            throw error("No Current Season");
        else
            return currentSeason;
    }

    private async findCurrentSeasonPlan(season: Season): Promise<SeasonPlan> { //TODO wait for start offset date
        let timeInSeason = (Date.now() - (season.startOffsetDate.getTime())) / 1000;
        if (timeInSeason < 0) {
            // we are in the season startDate - startOffsetDate gap, so no SeasonPlan should be activated.
            // TODO define meaningful pre-season text
            return undefined
        }
        let seasonPlans = await season.seasonPlan;
        console.log(timeInSeason, seasonPlans);
        return seasonPlans.slice(0).reduce((acc, cur) => { // don't do that to reduce, it has done nothing wrong! :(
            timeInSeason = timeInSeason - cur.duration;
            if (timeInSeason <= 0) {
                return cur;
            }
        }, undefined)
    }

    public async completeChallenge(user: User, seasonPlanChallengeId: number, challengeGoalCompletionLevel: ChallengeGoalCompletionLevel, challengeCompletionQuantity: number): Promise<ChallengeCompletion> {
        let seasonPlanChallenge: SeasonPlanChallenge = await this.getSeasonPlanChallengeFromCurrentSeasonPlanById(seasonPlanChallengeId);
        // check the spc exists
        if (!seasonPlanChallenge) return Promise.reject("SeasonPlanChallenge not found in current SeasonPlan!");
        // check that it wasn't rejected
        let challengeRejection: ChallengeRejection = await this.challengeRejectionRepository.findOne(
            {where: {owner: user, seasonPlanChallenge: seasonPlanChallenge}}
        );
        if (challengeRejection) return Promise.reject("SeasonPlanChallenge has previously rejected!");
        // check if the challenge was already completed
        let existingChallengeCompletion: ChallengeCompletion = await this.challengeCompletionRepository.findOne({
            where: {
                owner: {id: user.id},
                seasonPlanChallenge: seasonPlanChallenge
            }
        });
        console.log(existingChallengeCompletion);
        // complete challenge
        let challengeCompletion: ChallengeCompletion = existingChallengeCompletion ? existingChallengeCompletion : new ChallengeCompletion();
        challengeCompletion.owner = Promise.resolve(user);
        challengeCompletion.seasonPlanChallenge = Promise.resolve(seasonPlanChallenge);
        challengeCompletion.challengeGoalCompletionLevel = challengeGoalCompletionLevel;
        challengeCompletion.challengeCompletionQuantity = challengeCompletionQuantity;
        challengeCompletion = await this.challengeCompletionRepository.save(challengeCompletion);
        publish(challengeCompletion, "add", true);
        return challengeCompletion;
    }

    public async unCompleteChallenge(user: User, challengeCompletionId: number): Promise<ChallengeCompletion> {
        let challengeCompletion: ChallengeCompletion = await this.challengeCompletionRepository.findOne(challengeCompletionId);
        // check the spc exists
        if (!challengeCompletion) return Promise.reject("challengeCompletion not found!");
        // check that it wasn't rejected
        challengeCompletion = await this.challengeCompletionRepository.remove(challengeCompletion);
        publish(challengeCompletion, "remove", true);
        return challengeCompletion;
    }

    public async getCurrentChallengesForUser(user: User): Promise<IUserChallenge[]> {
        const currentSeasonPlan = await this.getCurrentSeasonPlan();
        console.log(await currentSeasonPlan.challenges);
        let challenges: IUserChallenge[] = await currentSeasonPlan.challenges;
        challenges = (await Promise.all(
            challenges.map(async c => {return {challenge: c}})))
            .map(v => v.challenge);

        console.log(await challenges.map(challenge => challenge.challenge.then(async c => await c.thema)));

         return challenges;
    }


    public async getCompletedChallengesForUser(user: User): Promise<ChallengeCompletion[]> {
        return  this.challengeCompletionRepository.find({where: {owner: user}})
    }

    private async getSeasonPlanChallengeFromCurrentSeasonPlanById(seasonPlanChallengeId: number): Promise<SeasonPlanChallenge> {
        return (await this.getCurrentSeasonPlan()).challenges.then(seasonPlanChallenges =>
            seasonPlanChallenges.find(
                sp => sp.id == seasonPlanChallengeId));
    }

    public async getCurrentlySelectedAchievementsForUser(user: User) {
        return this.achievementSelectionRepository.find({where: {owner: user}});
    }

    public async selectAchievement(user: User, achievementName: string) {
        let achievement = await this.achievementRepository.findOne({where: {name: achievementName}});
        if(!achievement) return Promise.reject(`Achievement ${achievementName} not found!`);
        let achievementSelection = await this.achievementSelectionRepository.findOne({where: {achievement: achievement, owner: user}});
        if(achievementSelection) return achievementSelection;
        let selection = new AchievementSelection();
        selection.owner = Promise.resolve(user);
        selection.achievement = Promise.resolve(achievement);
        console.log(selection);
        return this.achievementSelectionRepository.save(selection);
    }
    public async completeAchievement(user: User, achievementSelectionId: number) {
        let achievementSelection = await this.achievementSelectionRepository.findOne({where: {id: achievementSelectionId}});
        let achievementCompletion = await this.achievementCompletionRepository.find({where: {achievementSelection: achievementSelection, owner: user}});

        //TODO Gate based on frequency
        if(achievementCompletion.length > 0) {
            achievementCompletion.sort((a,b) => {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            });
            let lastCompletion = achievementCompletion[achievementCompletion.length - 1] ;
            let now = moment();
            let input = moment(lastCompletion.updatedAt);
            let isThisWeek = (now.isoWeek() == input.isoWeek())
            return lastCompletion
        }


        let completion = new AchievementCompletion();
        completion.owner = Promise.resolve(user);
        completion.achievement = Promise.resolve(await achievementSelection.achievement);
        completion.achievementSelection = Promise.resolve(achievementSelection);
        completion.achievementCompletionType = AchievementCompletionType.COMPLETED;
        //TODO Add score to user
        return this.achievementCompletionRepository.save(completion);
    }
}
