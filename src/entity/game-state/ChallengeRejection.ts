import {CreateDateColumn, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Field, Int, ObjectType} from "type-graphql";
import {User} from "../user/User";
import {SeasonPlanChallenge} from "./SeasonPlanChallenge";
import {Season} from "./Season";

@Entity()
@ObjectType()
export class ChallengeRejection {

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
    @ManyToOne(type => User, u => u.challengeRejections)
    owner: Promise<User>;
}