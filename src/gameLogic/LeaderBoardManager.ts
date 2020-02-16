import {Container, Service} from "typedi";
import {ChallengeCompletion} from "../entity/game-state/ChallengeCompletion";
import {subscribe} from "../util/EventUtil";
import {Membership} from "../entity/social/Membership";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Repository} from "typeorm";
import {Team} from "../entity/social/Team";
import {AchievementCompletion} from "../entity/game-state/AchievementCompletion";

@Service()
export class LeaderBoardManager {

    constructor(@InjectRepository(ChallengeCompletion) private readonly challengeCompletionRepository: Repository<ChallengeCompletion>,
                @InjectRepository(Membership) private readonly membershipRepository: Repository<Membership>,
                @InjectRepository(Team) private readonly teamRepository: Repository<Team>) {
    }

    @subscribe(ChallengeCompletion)
    public static async addScoreToTeams(_challengeCompletion: ChallengeCompletion, action: string) {
        console.log(_challengeCompletion);
        let challengeCompletion: ChallengeCompletion = await Container.get(LeaderBoardManager).challengeCompletionRepository.findOne(_challengeCompletion.id);
        console.log(challengeCompletion);

        const owner = await challengeCompletion.owner;
        const memberships = await owner.memberships;
        const points = (await (await challengeCompletion.seasonPlanChallenge).challenge).score;
        console.log(`ChallengeCompletion mod for ${owner.screenName}, action ${action}, score value ${points}`);

        let teamScoresChanged = false;
        Promise.all(memberships.map(async membership => {
            if (membership.isActive) {
                let team = await membership.team;
                console.log(`Updating score on ${team.name}`);
                action === 'add' ? await team.addScore(points) : await team.subScore(points);
                teamScoresChanged = true;
            }
        })).then(() => {
                if (teamScoresChanged) Container.get(LeaderBoardManager).recalculateLeaderBoardPositions().catch(err => {
                    throw err;
                })
            }
        );
    }

    @subscribe(Membership)
    public static async updateTeamSize(membership: Membership, action: string) {
        let team = await (await Container.get(LeaderBoardManager).membershipRepository.findOne(membership.id)).team;
        console.log(`Updating team size on ${team.name}`);
        team.updateTeamSize(action).catch(err => console.error(err));
    }

    public async recalculateLeaderBoardPositions() {
        const teams = await this.teamRepository.find();
        return teams.map(team => team.reinitPosition());
    }
}
