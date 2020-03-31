import {Container, Service} from "typedi";
import {ChallengeCompletion} from "../entity/game-state/ChallengeCompletion";
import {subscribe} from "../util/EventUtil";
import {Membership} from "../entity/social/Membership";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Repository} from "typeorm";
import {Team} from "../entity/social/Team";
import {AchievementCompletion} from "../entity/game-state/AchievementCompletion";
import {User} from "../entity/user/User";

@Service()
export class LeaderBoardManager {

    constructor(
        @InjectRepository(ChallengeCompletion) private readonly challengeCompletionRepository: Repository<ChallengeCompletion>,
        @InjectRepository(AchievementCompletion) private readonly achievementCompletionRepository: Repository<AchievementCompletion>,
        @InjectRepository(User) private readonly  userRepository: Repository<User>,
        @InjectRepository(Membership) private readonly membershipRepository: Repository<Membership>,
        @InjectRepository(Team) private readonly teamRepository: Repository<Team>) {
    }

    public static async addScoreToTeams(user: User, scoreDelta: number) {

        let memberships = await user.memberships;
        let teamScoresChanged = false;
        Promise.all(memberships.map(async membership => {
            if (membership.isActive) {
                let team = await membership.team;
                console.log(`Updating score on ${team.name}`);
                await team.addScore(scoreDelta);
                teamScoresChanged = true;
            }
        })).then(() => {
                if (teamScoresChanged) Container.get(LeaderBoardManager).recalculateLeaderBoardPositions().catch(err => {
                    throw err;
                })
            }
        );
    }

    public static async teamScoreFromUsers(user: User) {

        let memberships = await user.memberships;
        let teamScoresChanged = false;
        Promise.all(memberships.map(async membership => {
            if (membership.isActive) {
                let team = await membership.team;
                console.log(`Updating score on ${team.name}`);
                await team.recalculateScore();
                teamScoresChanged = true;
            }
        })).then(() => {
                if (teamScoresChanged) Container.get(LeaderBoardManager).recalculateLeaderBoardPositions().catch(err => {
                    throw err;
                })
            }
        );
    }

    @subscribe(ChallengeCompletion)
    public static async recalculateUserScoresFromBadges(_challengeCompletion: ChallengeCompletion, action: string) {
        let challengeCompletion: ChallengeCompletion = await Container.get(LeaderBoardManager).challengeCompletionRepository.findOne(_challengeCompletion.id);
        let owner = await challengeCompletion.owner;
        let oldScore = owner.score;
        owner = await owner.recalculateScore()
        let currentScore = owner.score;
        LeaderBoardManager.teamScoreFromUsers(owner).catch(err => console.error(err));
    }

    @subscribe(AchievementCompletion)
    public static async recalculateUserScoresFromAchievements(_achievementCompletion: AchievementCompletion, action: string) {
        let achievementCompletion: AchievementCompletion = await Container.get(LeaderBoardManager).achievementCompletionRepository.findOne(_achievementCompletion.id);
        let owner = await achievementCompletion.owner;
        let oldScore = owner.score;
        owner = await owner.recalculateScore()
        let currentScore = owner.score;
        LeaderBoardManager.teamScoreFromUsers(owner).catch(err => console.error(err));
    }

    @subscribe(Membership)
    public static async updateTeamSize(_membership: Membership, action: string) {
        try {
            let membership = await Container.get(LeaderBoardManager).membershipRepository.findOne(_membership.id);
            if(membership.isAccepted && membership.isActive) {
                let team = await membership.team;
                console.log(`Updating team size on ${team.name}`);
                team.updateTeamSize(action).catch(err => console.error(err));
                team.recalculateScore().catch(err => console.error(err));
                Container.get(LeaderBoardManager).recalculateLeaderBoardPositions().catch(err => {
                    throw err;
                })
            } else
                return
        } catch (e) {
            console.log(e)
        }

    }

    public async recalculateLeaderBoardPositions() {
        const teams = await this.teamRepository.find();
        await Promise.all(teams.map(team => team.recalculateScore()));
        return teams.map(team => team.reinitPosition());
    }
}
