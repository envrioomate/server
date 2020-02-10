import {Container, Service} from "typedi";
import {Challenge} from "../entity/wiki-content/Challenge";
import {ChallengeCompletion, ChallengeGoalCompletionLevel} from "../entity/game-state/ChallengeCompletion";
import {SeasonPlanChallenge} from "../entity/game-state/SeasonPlanChallenge";
import {InjectRepository} from "typeorm-typedi-extensions";
import {EntitySubscriberInterface, EventSubscriber, In, InsertEvent, LessThan, MoreThan, Repository} from "typeorm";
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
        @InjectRepository(Challenge) private readonly challengeRepository: Repository<Challenge>,
        @InjectRepository(SeasonPlanChallenge) private readonly seasonPlanChallengeRepository: Repository<SeasonPlanChallenge>,
        @InjectRepository(ChallengeCompletion) private readonly challengeCompletionRepository: Repository<ChallengeCompletion>,
        @InjectRepository(ChallengeRejection) private readonly challengeRejectionRepository: Repository<ChallengeRejection>,
        @InjectRepository(ChallengeReplacement) private readonly challengeReplacementRepository: Repository<ChallengeReplacement>,
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
            // TODO define meaningful pre-season content
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
        if (existingChallengeCompletion) return existingChallengeCompletion;
        // complete challenge
        let challengeCompletion: ChallengeCompletion = new ChallengeCompletion();
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

    public async rejectChallenge(user: User, seasonPlanChallengeId: number): Promise<ChallengeRejection> {
        let seasonPlanChallenge: SeasonPlanChallenge = await this.getSeasonPlanChallengeFromCurrentSeasonPlanById(seasonPlanChallengeId);
        const currentSeasonPlan = await this.getCurrentSeasonPlan();
        if (!seasonPlanChallenge) return Promise.reject("SeasonPlanChallenge not found in current SeasonPlan!");
        const userRejections = await this.challengeRejectionRepository.find({where: {owner: user, seasonPlanChallenge: seasonPlanChallenge}});
        if(userRejections && userRejections.length > 0) {
            return Promise.reject("SeasonPlanChallenge already rejected!");
        }
        // TODO check jokers
        let challengeRejection: ChallengeRejection = new ChallengeRejection();
        challengeRejection.owner = Promise.resolve(user);
        challengeRejection.seasonPlanChallenge = Promise.resolve(seasonPlanChallenge);

        await this.addReplacementChallenge(user, currentSeasonPlan, challengeRejection)
            .catch(err => {
                return Promise.reject(err)
            });

        return this.challengeRejectionRepository.save(challengeRejection)
    }

    public async getCurrentChallengesForUser(user: User): Promise<IUserChallenge[]> {
        const currentSeasonPlan = await this.getCurrentSeasonPlan();
        let challenges: IUserChallenge[] = await currentSeasonPlan.challenges;
        challenges = (await Promise.all(
            challenges.map(async c => {return {challenge: c, isSpare: (await c.challenge).isSpare}})))
            .filter(v => !v.isSpare)
            .map(v => v.challenge);
        const replacements: IUserChallenge[] = await this.challengeReplacementRepository.find({
            where: {
                owner: user,
                seasonPlan: currentSeasonPlan
            }
        });
        challenges = challenges.concat(replacements);

        console.log(await challenges.map(challenge => challenge.challenge.then(async c => await c.themenWoche)));

        const rejections = await this.challengeRejectionRepository.find({
            where: {
                owner: user,
                seasonPlanChallenge: {id: In(challenges.map(ch => ch.id))}
            }
        });

        if(rejections && rejections.length > 0){
            const rejectionPlanIds = await Promise.all(rejections.map(async rejection => {
                return {rejection, id: await rejection.seasonPlanChallenge.then(_ => _.id)}
            }));

            console.log("rejectionPlanIds: " + rejectionPlanIds);

            const nonRejectedChallenges = challenges.filter(challenge => {
                console.log("challenge: " + challenge);

                return rejectionPlanIds.some(rejectionPlanId => {
                    return rejectionPlanId.id !== challenge.id
                });
            });

            console.log("nonRejectedChallenges: " + nonRejectedChallenges);

            return nonRejectedChallenges;
        } else {
            return challenges;
        }

    }

    private async addReplacementChallenge(user: User, currentSeasonPlan: SeasonPlan, newRejection?: ChallengeRejection): Promise<ChallengeReplacement> {

        let challengeReplacement = new ChallengeReplacement();
        challengeReplacement.owner = Promise.resolve(user);
        challengeReplacement.plan = Promise.resolve(currentSeasonPlan);

        const rejections = await user.challengeRejections;
        if(newRejection) rejections.push(newRejection);
        const rejectedChallenges = await Promise.all(rejections.map(async rejection => {
            return await rejection.seasonPlanChallenge;
        }));

        // select replacement challenge by searching the oberthema and then te kategorie. Error out if no more challenges are available;
        let replacementChallenge: Challenge;
        const themenwoche = await currentSeasonPlan.themenwoche;
        const oberthemaChallenges = await themenwoche.oberthema.then(async value => await value.challenges);
        const availableOberthemaChallenges = oberthemaChallenges.filter(challenge => this.filterRejections(challenge, rejections, currentSeasonPlan));
        if(availableOberthemaChallenges && availableOberthemaChallenges.length > 0) {
            replacementChallenge = availableOberthemaChallenges[0];
        } else {
            const kategorieChallenges = await themenwoche.kategorie.then(async value => await value.challenges);
            const availableKategorieChallenges = kategorieChallenges.filter(challenge => this.filterRejections(challenge, rejections, currentSeasonPlan));
            if(availableKategorieChallenges && availableKategorieChallenges.length > 0) {
                replacementChallenge = availableKategorieChallenges[0];
            } else {
                return Promise.reject("No additional challenges in oberthema or katergorie!");
            }
        }

        challengeReplacement.challenge = Promise.resolve(replacementChallenge);

        return this.challengeReplacementRepository.save(challengeReplacement);
    }

    private async filterRejections(challenge: Challenge, rejections: ChallengeRejection[], currentSeasonPlan: SeasonPlan): Promise<boolean> {
        const r = rejections.filter( async rejection => {
            let seasonPlanChallenge = await rejection.seasonPlanChallenge.then(async spc => await spc.challenge);
            return challenge.id === seasonPlanChallenge.id;
        });
        const currentSeasonPlanChallenges = await currentSeasonPlan.challenges;
        const s = currentSeasonPlanChallenges.filter(async spc => {
            let seasonPlanChallenge = await spc.challenge;
            return challenge.id === seasonPlanChallenge.id;
        });
        return !(r.length + s.length);
    }

    private async getSeasonPlanChallengeFromCurrentSeasonPlanById(seasonPlanChallengeId: number): Promise<SeasonPlanChallenge> {
        return (await this.getCurrentSeasonPlan()).challenges.then(seasonPlanChallenges =>
            seasonPlanChallenges.find(
                sp => sp.id == seasonPlanChallengeId));
    }
}
