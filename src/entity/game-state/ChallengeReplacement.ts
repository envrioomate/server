import {CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Ctx, Field, Int, ObjectType} from "type-graphql";
import {User} from "../user/User";
import {IUserChallenge} from "./IUserChallenge";
import {SeasonPlan} from "./SeasonPlan";
import {Badge} from "../wiki-content/Badge";
import {ChallengeCompletion} from "./ChallengeCompletion";
import {Context} from "../../resolver/types/Context";

@Entity()
@ObjectType({implements: IUserChallenge})
export class ChallengeReplacement extends IUserChallenge {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => User)
    @ManyToOne(type => User, u => u.challengeReplacements)
    owner: Promise<User>;

    @Field(type => Badge)
    @ManyToOne(type => Badge)
    challenge: Promise<Badge>;

    @Field(type => SeasonPlan)
    @ManyToOne(type => SeasonPlan)
    plan: Promise<SeasonPlan>;

    @Field(type => Boolean, {nullable: true})
    replaceable: Boolean = false;


    @Field(type => ChallengeCompletion, {nullable: true})
    @OneToOne(type => ChallengeCompletion, c => c.replacementChallenge, {nullable: true})
    completion: Promise<ChallengeCompletion>;

    @Field(type => ChallengeCompletion, {nullable: true})
    async(@Ctx() {user}: Context): Promise<ChallengeCompletion> {
        return this.completion
    }

}