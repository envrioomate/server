import {Arg, Authorized, Ctx, Int, Mutation, Query, Resolver} from "type-graphql";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Role, User} from "../entity/user/User";
import {Repository} from "typeorm";
import {UserInput} from "./types/UserInput";
import {Media} from "../entity/Media";
import {Context} from "./types/Context";
import {Team} from "../entity/social/Team";
import {Container} from "typedi";
import {LeaderBoardManager} from "../gameLogic/LeaderBoardManager";
import {UserScoreManager} from "../gameLogic/UserScoreManager";
import {AchievementSelection} from "../entity/game-state/AchievementSelection";
import {AchievementCompletion} from "../entity/game-state/AchievementCompletion";
import {LevelUpTable, PlayerLevel} from "../gameLogic/PlayerLevel";

@Resolver()
export class UserResolver {
    constructor(
        @InjectRepository(Media) private readonly mediaRepository: Repository<Media>,
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) {
    }

    @Authorized("ADMIN")
    @Query(returns => [User], {nullable: true})
    users(): Promise<User[]> {
        return this.userRepository.find();
    }

    @Authorized("ADMIN")
    @Query(returns => User, {nullable: true})
    user(@Arg("userId", type => Int) userId: number): Promise<User> {
        return this.userRepository.findOne(userId);
    }

    /*
    @Authorized("ADMIN")
    @Mutation(returns => User, {nullable: true})
    async banUser(@Arg("userId", type => Int) userId: number): Promise<User> {
        const user = await this.userRepository.findOne(userId);
        user.isBanned = true;
        return this.userRepository.save(user);
    }*/

    @Authorized("ADMIN")
    @Mutation(returns => User, {nullable: true})
    async changeUser(@Arg("user", type => UserInput) userInput: UserInput): Promise<User> {
        const user = await this.userRepository.findOne(userInput.id);
        if (user.role === Role.Admin) {
            throw new Error("Contact DB Admin to modify admin accounts!");
        }
        console.log(userInput);
        user.screenName = userInput.screenName || user.screenName;
        user.userName = userInput.userName || user.userName;
        user.isBanned = (typeof userInput.isBanned === "boolean") ? userInput.isBanned : user.isBanned;
        user.emailConfirmed = (typeof userInput.emailConfirmed === "boolean") ? userInput.emailConfirmed : user.emailConfirmed;
        // TODO reset Avatars
        return this.userRepository.save(user)
    }

    @Query(returns => User)
    async getCurrentUser(@Ctx() {user}: Context): Promise<User> {
        return this.userRepository.findOne(user.id);
    }

    @Mutation(returns => User)
    async updateProfile(
        @Ctx() {user}: Context,
        @Arg("userName", type => String, {nullable: true}) userName?: string,
        @Arg("screenName", type => String, {nullable: true}) screenName?: string,
        @Arg("avatarId", type => Int, {nullable: true}) avatarId?: number,
    ): Promise<User> {
        let currentUser = await this.userRepository.findOne(user.id)
            .catch((err) => {
                console.log(err);
                return Promise.reject("could not load user record")
            });
        currentUser.screenName = screenName || currentUser.screenName;
        currentUser.userName = userName || currentUser.userName;
        if(avatarId){
            const newAvatar = await this.mediaRepository.findOne(avatarId);
            if(newAvatar) {
                currentUser.avatar = Promise.resolve(newAvatar);
            } else {
                return Promise.reject("Image could not be loaded")
            }
        }

        return this.userRepository.save(currentUser);
    }

    @Mutation(returns => User)
    async changePassword(
        @Arg("oldPassword", type => String) oldPassword: string,
        @Arg("newPassword", type => String) newPassword: string,
        @Ctx() {user}: Context
    ): Promise<User> {
        let currentUser = await this.userRepository.findOne(user.id)
            .catch((err) => {
                console.log(err);
                return Promise.reject("could not load user record")
            });
        if (currentUser.validatePassword(oldPassword)) {
            currentUser.password = newPassword; // this gets eaten by @BeforeInsert hook encrypt(),
                                                // password is not a column in user table and is
                                                // only transiently there during password changes
            return this.userRepository.save(currentUser);
        } else {
            return Promise.reject("Incorrect password");
        }

    }
    @Authorized("ADMIN")
    @Mutation(returns => [AchievementCompletion])
    async checkStartingAchievement() {
        return Container.get(UserScoreManager).checkStartingAchievement()
    }

    @Query( returns => PlayerLevel, {nullable: true})
    public async getLevelData(
        @Ctx() {user}: Context,
        @Arg("levelIndex", type => Int) levelIndex: number
    ) : Promise<PlayerLevel> {
        const level = LevelUpTable.find(level => level.index === levelIndex);
        if(level)
            return Promise.resolve(level);
        else
            return Promise.reject("Index out of bounds");
    }

    @Authorized("ADMIN")
    @Mutation(returns => [User])
    async updatePlayerLevels() {
        let users = await this.userRepository.find();
        return users.map(user => user.updateLevel())
    }
}




/*
const UPDATE_PROFILE = gql`
mutation updateProfile($userName: String, $screenName: String, $avatarId: Int){
    updateProfile(userName: $userName, screenName: $screenName, avatarId: $avatarId) {
        userName,
        screeName,
        avatar {path},
    }
}
`;

const CHANGE_PASSWORD = gql`
mutation changePassword($oldPassword: String!, $newPassword: String!){
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
        success
    }
}
`;}
 */