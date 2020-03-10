import {Container, Inject, Service} from "typedi";
import {subscribe} from "../util/EventUtil";
import {User} from "../entity/user/User";
import {GameProgressionManager} from "./GameProgressionManager";
import {getRepository} from "typeorm";

//TODO kill me
@Service()
export class UserScoreManager {

    public startingAchievementName: string = "RegistrierungK4all";

    @subscribe(User)
    public async assignStartingAchievement(user: User, action: string) {
        let gameProgressionManager = Container.get(GameProgressionManager);
        if(action !== "created") return;
        try {
            let selection = await gameProgressionManager.selectAchievement(user, this.startingAchievementName);
            return (await gameProgressionManager.completeAchievement(user, selection.id));
        } catch (e) {
            console.error(e)
        }
    }

    public async checkStartingAchievement() {
        let users = await getRepository(User).find();
        return users.map(u => this.assignStartingAchievement(u, "created"))
    }

}