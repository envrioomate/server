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

    @subscribe(User)
    public static async addScoreToTeams(user: User, action: string) {
        if(action !== "ScoreUpdated") return;
        user =  await Container.get(LeaderBoardManager).userRepository.findOne(user.id);
        if(!user) {
            console.error("User " + user + " not found!");
            return
        }
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
        const owner = await challengeCompletion.owner;
        owner.recalculateScore()
    }

    @subscribe(AchievementCompletion)
    public static async recalculateUserScoresFromAchievements(_achievementCompletion: AchievementCompletion, action: string) {
        let achievementCompletion: AchievementCompletion = await Container.get(LeaderBoardManager).achievementCompletionRepository.findOne(_achievementCompletion.id);
        const owner = await achievementCompletion.owner;
        owner.recalculateScore()

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
